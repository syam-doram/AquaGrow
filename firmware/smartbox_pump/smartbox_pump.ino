/**
 * ============================================================
 *  AquaGrow — Smart Box Firmware: WATER PUMP
 *  Device Type : PUMP
 *  Role        : slave
 *  Transport   : ESP-NOW  ←→  Master Box (MB001 …)
 * ============================================================
 *
 *  WIRING
 *  ──────
 *  GPIO 14  →  Relay IN  (controls pump motor)
 *  GPIO 12  →  Flow Sensor pulse (YF-S201 or similar)  [optional]
 *  GPIO 34  →  ACS712 current sensor analog out         [optional]
 *  GPIO 35  →  Voltage divider (supply voltage monitor) [optional]
 *  GPIO 26  →  Float switch (HIGH = water level OK)     [optional]
 *  GPIO 2   →  Onboard LED
 *
 *  BEHAVIOUR
 *  ─────────
 *  1. On boot, broadcasts DISCOVER to Master Box.
 *  2. Once paired, listens for ON / OFF / SPEED / RESET commands.
 *  3. Sends heartbeat every 10 s with pump state + telemetry.
 *  4. Safety features:
 *     - Auto-shutoff after MAX_RUN_MINUTES if no OFF command received.
 *     - Dry-run protection via float switch / current threshold.
 *     - Confirms every received command back to Master.
 *
 *  FLASH SETTINGS (Arduino IDE)
 *  ─────────────────────────────
 *  Board  : ESP32 Dev Module
 *  Speed  : 115200 baud
 *
 *  LIBRARY
 *  ────────
 *  - ArduinoJson (Benoit Blanchon) >= 6.21
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <ArduinoJson.h>

// ── User config ──────────────────────────────────────────────────────────────
#define BOX_ID              "SB003"        // Must match AquaGrow app registration
#define DEVICE_TYPE         "PUMP"

#define HEARTBEAT_INTERVAL_MS  10000UL     // Heartbeat every 10 s
#define DISCOVER_INTERVAL_MS   30000UL     // DISCOVER re-broadcast interval
#define MAX_RUN_MINUTES        60          // Auto-shutoff after 60 min (safety)
#define FLOW_PULSE_FACTOR      7.5f        // YF-S201: 7.5 pulses per litre/min

// ── Pin definitions ──────────────────────────────────────────────────────────
#define PUMP_RELAY_PIN      14
#define RELAY_ACTIVE_HIGH   true           // Set false if relay triggers on LOW
#define FLOW_SENSOR_PIN     12             // Interrupt-capable pin for flow pulse
#define CURRENT_PIN         34             // ACS712 analog
#define VOLTAGE_PIN         35             // Voltage divider analog
#define FLOAT_SWITCH_PIN    26             // Water level float (HIGH = level OK)
#define LED_PIN             2

// ── ADC / sensor calibration ─────────────────────────────────────────────────
#define ADC_REF             3.3f
#define ADC_MAX             4095.0f
#define VOLTAGE_DIV_RATIO   5.0f          // (R1+R2)/R2 — adjust for your divider
#define ACS712_SENSITIVITY  0.066f        // V/A for ACS712-30A  (use 0.185 for 5A)
#define ACS712_ZERO_V       1.65f
#define DRY_RUN_CURRENT_A   0.3f          // Current below this = pump is dry-running

// ── State ────────────────────────────────────────────────────────────────────
static bool     g_pumpOn        = false;
static bool     g_paired        = false;
static uint8_t  g_masterMac[6]  = {0};
static uint32_t g_lastHeartbeat = 0;
static uint32_t g_lastDiscover  = 0;
static uint32_t g_pumpStartMs   = 0;      // When pump was last turned ON
static char     g_myMac[18]     = {0};

// Flow sensor
static volatile uint32_t g_flowPulseCount = 0;
static float    g_flowLPM       = 0.0f;   // Litres per minute
static float    g_totalLitres   = 0.0f;

// ── Flow sensor ISR ───────────────────────────────────────────────────────────
void IRAM_ATTR flowPulseISR() {
  g_flowPulseCount++;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
static void setPump(bool on) {
  if (on) {
    // Safety check: float switch (if LOW = no water, don't run)
    if (digitalRead(FLOAT_SWITCH_PIN) == LOW) {
      Serial.println("[SAFETY] Float switch LOW — pump start blocked (no water)!");
      return;
    }
    g_pumpStartMs = millis();
  }
  g_pumpOn = on;
  bool level = RELAY_ACTIVE_HIGH ? on : !on;
  digitalWrite(PUMP_RELAY_PIN, level ? HIGH : LOW);
  Serial.printf("[PUMP] Relay -> %s\n", on ? "ON" : "OFF");
}

static float readVoltage() {
  int raw = analogRead(VOLTAGE_PIN);
  return (raw / ADC_MAX) * ADC_REF * VOLTAGE_DIV_RATIO;
}

static float readCurrent() {
  int raw = analogRead(CURRENT_PIN);
  float v = (raw / ADC_MAX) * ADC_REF;
  return fabsf((v - ACS712_ZERO_V) / ACS712_SENSITIVITY);
}

static float readFlowLPM(uint32_t elapsedMs) {
  // Capture and reset pulse count atomically
  noInterrupts();
  uint32_t pulses = g_flowPulseCount;
  g_flowPulseCount = 0;
  interrupts();

  float litres = pulses / FLOW_PULSE_FACTOR;
  float minutes = elapsedMs / 60000.0f;
  if (minutes > 0) {
    g_flowLPM = litres / minutes;
  }
  g_totalLitres += litres;
  return g_flowLPM;
}

// ── Safety monitor (called in loop) ──────────────────────────────────────────
static void checkSafetyConditions() {
  if (!g_pumpOn) return;

  uint32_t now = millis();

  // 1. Auto-shutoff after MAX_RUN_MINUTES
  if ((now - g_pumpStartMs) >= (uint32_t)MAX_RUN_MINUTES * 60000UL) {
    Serial.println("[SAFETY] Max run time reached — auto shutoff!");
    setPump(false);
    return;
  }

  // 2. Dry-run protection: if pump is ON but current is too low
  float current = readCurrent();
  if (current < DRY_RUN_CURRENT_A) {
    Serial.printf("[SAFETY] Dry-run detected (%.2fA < %.2fA) — shutoff!\n",
      current, DRY_RUN_CURRENT_A);
    setPump(false);
  }

  // 3. Float switch: shutoff if water level drops while running
  if (digitalRead(FLOAT_SWITCH_PIN) == LOW) {
    Serial.println("[SAFETY] Float switch LOW while running — shutoff!");
    setPump(false);
  }
}

// ── ESP-NOW send helper ───────────────────────────────────────────────────────
static void espNowSendToMaster(const char* jsonPayload) {
  if (!g_paired) return;
  esp_now_send(g_masterMac, (const uint8_t*)jsonPayload, strlen(jsonPayload) + 1);
}

// ── DISCOVER broadcast ────────────────────────────────────────────────────────
static void sendDiscover() {
  StaticJsonDocument<256> doc;
  doc["type"]       = "DISCOVER";
  doc["boxId"]      = BOX_ID;
  doc["deviceType"] = DEVICE_TYPE;
  doc["mac"]        = g_myMac;

  char buf[256];
  serializeJson(doc, buf, sizeof(buf));

  uint8_t broadcast[6] = {0xFF,0xFF,0xFF,0xFF,0xFF,0xFF};
  esp_now_send(broadcast, (const uint8_t*)buf, strlen(buf) + 1);
  Serial.printf("[DISCOVER] %s\n", buf);
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
static void sendHeartbeat() {
  float v   = readVoltage();
  float i   = readCurrent();
  float w   = v * i;
  float lpm = readFlowLPM(HEARTBEAT_INTERVAL_MS);
  bool  floatOk = digitalRead(FLOAT_SWITCH_PIN) == HIGH;

  StaticJsonDocument<384> doc;
  doc["type"]         = "HEARTBEAT";
  doc["boxId"]        = BOX_ID;
  doc["deviceType"]   = DEVICE_TYPE;
  doc["aeratorState"] = g_pumpOn ? "ON" : "OFF";   // uses same field for dashboard compatibility
  doc["pumpOn"]       = g_pumpOn;
  doc["voltage"]      = round(v * 100.0f) / 100.0f;
  doc["current"]      = round(i * 100.0f) / 100.0f;
  doc["powerWatts"]   = round(w * 100.0f) / 100.0f;
  doc["flowLPM"]      = round(lpm * 10.0f) / 10.0f;
  doc["totalLitres"]  = round(g_totalLitres * 10.0f) / 10.0f;
  doc["floatOk"]      = floatOk;
  doc["rssi"]         = WiFi.RSSI();

  char buf[384];
  serializeJson(doc, buf, sizeof(buf));
  espNowSendToMaster(buf);
  Serial.printf("[HEARTBEAT] %s\n", buf);
}

// ── Command confirmation ──────────────────────────────────────────────────────
static void sendConfirm(const char* cmdId, const char* action, bool success, const char* reason = "") {
  StaticJsonDocument<256> doc;
  doc["type"]         = "CMD_CONFIRM";
  doc["boxId"]        = BOX_ID;
  doc["cmdId"]        = cmdId;
  doc["action"]       = action;
  doc["success"]      = success;
  doc["aeratorState"] = g_pumpOn ? "ON" : "OFF";
  if (strlen(reason) > 0) doc["reason"] = reason;

  char buf[256];
  serializeJson(doc, buf, sizeof(buf));
  espNowSendToMaster(buf);
  Serial.printf("[CONFIRM] %s\n", buf);
}

// ── Incoming ESP-NOW callback ─────────────────────────────────────────────────
static void onDataRecv(const esp_now_recv_info_t* info, const uint8_t* data, int len) {
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, data, len);
  if (err) return;

  const char* msgType = doc["type"] | "";
  Serial.printf("[RX] type=%s\n", msgType);

  // PAIR_ACK
  if (strcmp(msgType, "PAIR_ACK") == 0) {
    memcpy(g_masterMac, info->src_addr, 6);
    g_paired = true;
    Serial.println("[PAIR] Paired with Master!");

    esp_now_peer_info_t peer = {};
    memcpy(peer.peer_addr, g_masterMac, 6);
    peer.channel = 0;
    peer.encrypt = false;
    if (!esp_now_is_peer_exist(g_masterMac)) {
      esp_now_add_peer(&peer);
    }
    digitalWrite(LED_PIN, HIGH);
    sendHeartbeat();
    return;
  }

  // COMMAND
  if (strcmp(msgType, "COMMAND") == 0) {
    const char* action = doc["action"] | "";
    const char* cmdId  = doc["cmdId"]  | "unknown";

    bool success = false;
    const char* reason = "";

    if (strcmp(action, "ON") == 0) {
      if (digitalRead(FLOAT_SWITCH_PIN) == LOW) {
        reason  = "Float switch LOW — no water detected";
        success = false;
      } else {
        setPump(true);
        success = true;
      }
    } else if (strcmp(action, "OFF") == 0) {
      setPump(false);
      success = true;
    } else if (strcmp(action, "RESET") == 0) {
      setPump(false);
      g_totalLitres = 0.0f;
      success = true;
    } else {
      Serial.printf("[CMD] Unknown action: %s\n", action);
      reason = "Unknown action";
    }

    sendConfirm(cmdId, action, success, reason);
    return;
  }

  // PING
  if (strcmp(msgType, "PING") == 0) {
    sendHeartbeat();
    return;
  }
}

// ── Arduino setup ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== AquaGrow PUMP Smart Box ===");
  Serial.printf("Box ID      : %s\n", BOX_ID);
  Serial.printf("Device Type : %s\n", DEVICE_TYPE);

  // GPIO
  pinMode(PUMP_RELAY_PIN,  OUTPUT);
  pinMode(LED_PIN,         OUTPUT);
  pinMode(FLOAT_SWITCH_PIN, INPUT_PULLUP);
  setPump(false);  // Safe default: pump OFF on boot
  digitalWrite(LED_PIN, LOW);

  // Flow sensor interrupt
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), flowPulseISR, RISING);

  // WiFi
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // WiFi.macAddress() works on all ESP32 Arduino core versions
  String macStr = WiFi.macAddress();
  macStr.toCharArray(g_myMac, sizeof(g_myMac));
  Serial.printf("MAC         : %s\n", g_myMac);

  // ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] esp_now_init() failed — reboot in 5s");
    delay(5000);
    ESP.restart();
  }
  esp_now_register_recv_cb(onDataRecv);

  esp_now_peer_info_t peer = {};
  memset(peer.peer_addr, 0xFF, 6);
  peer.channel = 0;
  peer.encrypt = false;
  esp_now_add_peer(&peer);

  Serial.println("[BOOT] Ready. Broadcasting DISCOVER…");
  sendDiscover();
  g_lastDiscover = millis();
}

// ── Arduino loop ──────────────────────────────────────────────────────────────
void loop() {
  uint32_t now = millis();

  // Blink until paired
  if (!g_paired) {
    digitalWrite(LED_PIN, (now / 500) % 2);

    if (now - g_lastDiscover >= DISCOVER_INTERVAL_MS) {
      sendDiscover();
      g_lastDiscover = now;
    }
    return;
  }

  // Safety checks every loop iteration
  checkSafetyConditions();

  // Heartbeat
  if (now - g_lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    g_lastHeartbeat = now;
  }
}
