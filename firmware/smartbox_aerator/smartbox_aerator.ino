/**
 * ============================================================
 *  AquaGrow — Smart Box Firmware: AERATOR
 *  Device Type : AERATOR
 *  Role        : slave
 *  Transport   : ESP-NOW  ←→  Master Box (MB001 …)
 * ============================================================
 *
 *  WIRING
 *  ──────
 *  GPIO 14  →  Relay IN  (controls aerator motor)
 *  GPIO 34  →  ACS712 / INA219 analog (current sensing)  [optional]
 *  GPIO 35  →  Voltage divider for supply voltage         [optional]
 *
 *  BEHAVIOUR
 *  ─────────
 *  1. On boot, broadcasts DISCOVER to Master Box.
 *  2. Once Master assigns this box (pairing complete),
 *     it listens for ON / OFF commands.
 *  3. Sends heartbeat every 10 s with aerator state +
 *     voltage / current telemetry.
 *  4. Confirms every received command back to Master.
 *
 *  FLASH SETTINGS (Arduino IDE)
 *  ─────────────────────────────
 *  Board  : ESP32 Dev Module (or WEMOS D1 Mini ESP32)
 *  Speed  : 115200 baud
 *  PSRAM  : disabled
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <ArduinoJson.h>

// ── User config ──────────────────────────────────────────────────────────────
// Change these to match your deployment
#define BOX_ID          "SB001"          // Unique Smart Box ID  (match what's registered in AquaGrow app)
#define DEVICE_TYPE     "AERATOR"        // Must be "AERATOR" for aerator smart box
#define AERATOR_PIN     14               // Relay control pin (HIGH = ON)
#define RELAY_ACTIVE_HIGH true           // Set to false if your relay triggers on LOW
#define HEARTBEAT_INTERVAL_MS  10000UL  // Send telemetry every 10 seconds
#define DISCOVER_INTERVAL_MS   30000UL  // Re-broadcast DISCOVER every 30 s until paired

// ── Pin config ───────────────────────────────────────────────────────────────
#define CURRENT_PIN     34   // ACS712 output (or leave unused if no current sensor)
#define VOLTAGE_PIN     35   // Voltage divider output (or leave unused)
#define ONBOARD_LED     2    // Built-in LED (optional feedback)

// Voltage divider ratio: R1=30kΩ, R2=7.5kΩ → ratio = (R1+R2)/R2 = 5.0
#define VOLTAGE_DIVIDER_RATIO  5.0f
#define ADC_REF_VOLTAGE        3.3f
#define ADC_RESOLUTION         4095.0f

// ACS712-30A: sensitivity = 66mV/A, zero at VCC/2
#define ACS712_SENSITIVITY     0.066f   // V per Ampere (use 0.185 for 5A version)
#define ACS712_ZERO_VOLTAGE    1.65f    // VCC/2 when running on 3.3V logic

// ── State ────────────────────────────────────────────────────────────────────
static bool      g_aeratorOn      = false;
static bool      g_paired         = false;   // true once Master acknowledges DISCOVER
static uint8_t   g_masterMac[6]   = {0};     // MAC of Master Box (filled on first pairing)
static uint32_t  g_lastHeartbeat  = 0;
static uint32_t  g_lastDiscover   = 0;
static char      g_myMac[18]      = {0};     // This device's MAC (for logging only)

// ── Helpers ──────────────────────────────────────────────────────────────────
static void setAerator(bool on) {
  g_aeratorOn = on;
  bool pinLevel = RELAY_ACTIVE_HIGH ? on : !on;
  digitalWrite(AERATOR_PIN, pinLevel ? HIGH : LOW);
  Serial.printf("[AERATOR] Relay -> %s\n", on ? "ON" : "OFF");
}

static float readVoltage() {
  int raw = analogRead(VOLTAGE_PIN);
  float v = (raw / ADC_RESOLUTION) * ADC_REF_VOLTAGE * VOLTAGE_DIVIDER_RATIO;
  return v;
}

static float readCurrent() {
  int raw = analogRead(CURRENT_PIN);
  float vSense = (raw / ADC_RESOLUTION) * ADC_REF_VOLTAGE;
  float current = (vSense - ACS712_ZERO_VOLTAGE) / ACS712_SENSITIVITY;
  return fabsf(current);   // always positive
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

  // Broadcast to all devices (FF:FF:FF:FF:FF:FF)
  uint8_t broadcast[6] = {0xFF,0xFF,0xFF,0xFF,0xFF,0xFF};
  esp_now_send(broadcast, (const uint8_t*)buf, strlen(buf) + 1);
  Serial.printf("[DISCOVER] Broadcasted: %s\n", buf);
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
static void sendHeartbeat() {
  float v = readVoltage();
  float i = readCurrent();
  float w = v * i;

  StaticJsonDocument<256> doc;
  doc["type"]         = "HEARTBEAT";
  doc["boxId"]        = BOX_ID;
  doc["deviceType"]   = DEVICE_TYPE;
  doc["aeratorState"] = g_aeratorOn ? "ON" : "OFF";
  doc["voltage"]      = round(v * 100.0f) / 100.0f;
  doc["current"]      = round(i * 100.0f) / 100.0f;
  doc["powerWatts"]   = round(w * 100.0f) / 100.0f;
  doc["rssi"]         = WiFi.RSSI();

  char buf[256];
  serializeJson(doc, buf, sizeof(buf));
  espNowSendToMaster(buf);
  Serial.printf("[HEARTBEAT] %s\n", buf);
}

// ── Command confirmation ──────────────────────────────────────────────────────
static void sendConfirm(const char* cmdId, const char* action, bool success) {
  StaticJsonDocument<200> doc;
  doc["type"]         = "CMD_CONFIRM";
  doc["boxId"]        = BOX_ID;
  doc["cmdId"]        = cmdId;
  doc["action"]       = action;
  doc["success"]      = success;
  doc["aeratorState"] = g_aeratorOn ? "ON" : "OFF";

  char buf[200];
  serializeJson(doc, buf, sizeof(buf));
  espNowSendToMaster(buf);
  Serial.printf("[CONFIRM] %s\n", buf);
}

// ── Incoming ESP-NOW callback ─────────────────────────────────────────────────
static void onDataRecv(const esp_now_recv_info_t* info, const uint8_t* data, int len) {
  // Parse JSON
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, data, len);
  if (err) {
    Serial.printf("[RX] JSON parse error: %s\n", err.c_str());
    return;
  }

  const char* msgType = doc["type"] | "";
  Serial.printf("[RX] type=%s\n", msgType);

  // ── PAIR_ACK: Master confirmed pairing ──
  if (strcmp(msgType, "PAIR_ACK") == 0) {
    memcpy(g_masterMac, info->src_addr, 6);
    g_paired = true;
    Serial.println("[PAIR] Paired with Master!");

    // Register Master as a peer so we can unicast to it
    esp_now_peer_info_t peer = {};
    memcpy(peer.peer_addr, g_masterMac, 6);
    peer.channel = 0;
    peer.encrypt = false;
    if (!esp_now_is_peer_exist(g_masterMac)) {
      esp_now_add_peer(&peer);
    }

    digitalWrite(ONBOARD_LED, HIGH);  // Solid LED = paired
    sendHeartbeat();
    return;
  }

  // ── COMMAND: ON / OFF ──
  if (strcmp(msgType, "COMMAND") == 0) {
    const char* action = doc["action"] | "";
    const char* cmdId  = doc["cmdId"]  | "unknown";

    bool success = false;
    if (strcmp(action, "ON") == 0) {
      setAerator(true);
      success = true;
    } else if (strcmp(action, "OFF") == 0) {
      setAerator(false);
      success = true;
    } else if (strcmp(action, "RESET") == 0) {
      setAerator(false);
      success = true;
    } else {
      Serial.printf("[CMD] Unknown action: %s\n", action);
    }

    sendConfirm(cmdId, action, success);
    return;
  }

  // ── PING: Master checking liveness ──
  if (strcmp(msgType, "PING") == 0) {
    sendHeartbeat();
    return;
  }
}

// ── Arduino setup ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== AquaGrow AERATOR Smart Box ===");
  Serial.printf("Box ID      : %s\n", BOX_ID);
  Serial.printf("Device Type : %s\n", DEVICE_TYPE);

  // GPIO init
  pinMode(AERATOR_PIN, OUTPUT);
  pinMode(ONBOARD_LED, OUTPUT);
  setAerator(false);  // Safe default: aerator OFF on boot
  digitalWrite(ONBOARD_LED, LOW);

  // WiFi in Station mode (needed for ESP-NOW)
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // Store own MAC for logging (WiFi.macAddress() works on all ESP32 core versions)
  String macStr = WiFi.macAddress();
  macStr.toCharArray(g_myMac, sizeof(g_myMac));
  Serial.printf("MAC         : %s\n", g_myMac);

  // ESP-NOW init
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] esp_now_init() failed — rebooting in 5s");
    delay(5000);
    ESP.restart();
  }
  esp_now_register_recv_cb(onDataRecv);

  // Add broadcast peer so DISCOVER can be sent
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

  // Blink LED slowly when not paired
  if (!g_paired) {
    digitalWrite(ONBOARD_LED, (now / 500) % 2);

    // Retry DISCOVER every 30 s
    if (now - g_lastDiscover >= DISCOVER_INTERVAL_MS) {
      sendDiscover();
      g_lastDiscover = now;
    }
  }

  // Heartbeat when paired
  if (g_paired && now - g_lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    g_lastHeartbeat = now;
  }
}
