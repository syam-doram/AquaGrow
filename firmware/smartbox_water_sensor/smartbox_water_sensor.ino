/**
 * ============================================================
 *  AquaGrow — Smart Box Firmware: WATER QUALITY SENSOR
 *  Device Type : SENSOR
 *  Role        : slave
 *  Transport   : ESP-NOW  ←→  Master Box (MB001 …)
 * ============================================================
 *
 *  WIRING
 *  ──────
 *  GPIO 32  →  DO Sensor    (4–20 mA or analog voltage out)
 *  GPIO 33  →  pH Sensor    (analog 0–3.3V, 0–14 pH)
 *  GPIO 34  →  Temperature  (DS18B20 one-wire OR NTC thermistor)
 *  GPIO 35  →  Turbidity    (SEN0189 or similar, analog)
 *  GPIO 36  →  TDS Sensor   (Gravity TDS analog probe)
 *  GPIO 39  →  Salinity     (EC / conductivity sensor, analog)
 *  GPIO 25  →  Ammonia      (MQ137 gas sensor analog out or NH3 ion probe)
 *  GPIO 27  →  DS18B20 DATA (if using one-wire digital temperature)
 *  GPIO 2   →  Onboard LED
 *
 *  BEHAVIOUR
 *  ─────────
 *  1. On boot, broadcasts DISCOVER to Master Box.
 *  2. Once paired, reads all sensors every 30 s.
 *  3. Sends a SENSOR_DATA packet to the Master Box.
 *  4. Master Box forwards the data to the AquaGrow cloud.
 *  5. No relay control — this is a read-only sensor node.
 *
 *  FLASH SETTINGS (Arduino IDE)
 *  ─────────────────────────────
 *  Board  : ESP32 Dev Module
 *  Speed  : 115200 baud
 *
 *  LIBRARIES (install via Arduino Library Manager)
 *  ────────────────────────────────────────────────
 *  - ArduinoJson  (Benoit Blanchon)  >= 6.21
 *  - OneWire      (Jim Studt)
 *  - DallasTemperature (Miles Burton)
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ── User config ──────────────────────────────────────────────────────────────
#define BOX_ID              "SB002"       // Must match what's registered in AquaGrow app
#define DEVICE_TYPE         "SENSOR"

#define READ_INTERVAL_MS    30000UL       // Read sensors every 30 seconds
#define HEARTBEAT_INTERVAL_MS 60000UL    // Send liveness heartbeat every 60 s
#define DISCOVER_INTERVAL_MS  30000UL    // Re-broadcast DISCOVER every 30 s until paired

// ── Pin definitions ──────────────────────────────────────────────────────────
#define PIN_DO_SENSOR       32
#define PIN_PH_SENSOR       33
#define PIN_TURBIDITY       35
#define PIN_TDS             36
#define PIN_SALINITY        39
#define PIN_AMMONIA         25   // Change if not using ammonia sensor
#define PIN_DS18B20         27   // OneWire data pin
#define PIN_LED             2

// ── ADC / calibration constants ──────────────────────────────────────────────
#define ADC_REF             3.3f
#define ADC_MAX             4095.0f

// pH sensor: 4502C module
//   pH = (2.5 - Vout) / 0.18 + 7.0   (typical calibration)
#define PH_OFFSET           0.0f         // Adjust after calibration

// DO sensor: gravity analog (0–3.3V = 0–20 mg/L, adjust for your probe)
#define DO_MAX_VOLTAGE      3.3f
#define DO_MAX_MGL          20.0f

// Turbidity: SEN0189 (0–4.5V = 0–3000 NTU in reverse)
#define TURBIDITY_CLEAR_V   4.2f         // Voltage in clear water
#define TURBIDITY_MAX_NTU   3000.0f

// TDS: Gravity TDS probe
//   TDS(ppm) = (133.42 × V³ - 255.86 × V² + 857.39 × V) × 0.5
//   (DFRobot formula)

// Salinity / EC probe: 1 V = 1 mS/cm (adjust per your probe)
#define EC_TO_PSU_FACTOR    0.5f         // rough EC mS/cm → salinity ppt

// Ammonia: MQ-137 (analog, needs factory calibration curve)
//   Simple linear: 0V=0 mg/L, 3.3V=10 mg/L
#define AMMONIA_MAX_V       3.3f
#define AMMONIA_MAX_MGL     10.0f

// ── DS18B20 setup ─────────────────────────────────────────────────────────────
OneWire           oneWire(PIN_DS18B20);
DallasTemperature ds18b20(&oneWire);

// ── State ────────────────────────────────────────────────────────────────────
static bool     g_paired        = false;
static uint8_t  g_masterMac[6]  = {0};
static uint32_t g_lastRead      = 0;
static uint32_t g_lastHeartbeat = 0;
static uint32_t g_lastDiscover  = 0;
static char     g_myMac[18]     = {0};

// ── Helpers ──────────────────────────────────────────────────────────────────
static float adcToVoltage(int pin) {
  int raw = analogRead(pin);
  return (raw / ADC_MAX) * ADC_REF;
}

static float readDO() {
  float v = adcToVoltage(PIN_DO_SENSOR);
  return (v / DO_MAX_VOLTAGE) * DO_MAX_MGL;
}

static float readPH() {
  float v = adcToVoltage(PIN_PH_SENSOR);
  // Typical gravity pH module formula:
  float ph = 7.0f + ((2.5f - v) / 0.18f) + PH_OFFSET;
  return constrain(ph, 0.0f, 14.0f);
}

static float readTemperature() {
  ds18b20.requestTemperatures();
  float t = ds18b20.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C || t == -127.0f) {
    // Fallback: NTC thermistor on analog if DS18B20 not connected
    // (remove if always using DS18B20)
    return -1.0f;
  }
  return t;
}

static float readTurbidity() {
  float v = adcToVoltage(PIN_TURBIDITY);
  // SEN0189 formula (inverted — clear water = high voltage)
  float ntu = (TURBIDITY_CLEAR_V - v) / TURBIDITY_CLEAR_V * TURBIDITY_MAX_NTU;
  return max(0.0f, ntu);
}

static float readTDS(float tempC) {
  float v = adcToVoltage(PIN_TDS);
  // Temperature compensation
  float compensationCoefficient = 1.0f + 0.02f * (tempC - 25.0f);
  float compensatedV = v / compensationCoefficient;
  float tds = (133.42f * compensatedV * compensatedV * compensatedV
               - 255.86f * compensatedV * compensatedV
               + 857.39f * compensatedV) * 0.5f;
  return max(0.0f, tds);
}

static float readSalinity() {
  float v = adcToVoltage(PIN_SALINITY);
  // EC (mS/cm) from voltage, then to salinity ppt
  float ec = (v / ADC_REF) * 20.0f;   // 0–20 mS/cm range
  return ec * EC_TO_PSU_FACTOR;
}

static float readAmmonia() {
  float v = adcToVoltage(PIN_AMMONIA);
  return (v / AMMONIA_MAX_V) * AMMONIA_MAX_MGL;
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

// ── Read all sensors and send ─────────────────────────────────────────────────
static void sendSensorReading() {
  float temp      = readTemperature();
  float doVal     = readDO();
  float ph        = readPH();
  float turbidity = readTurbidity();
  float tds       = readTDS(temp > 0 ? temp : 25.0f);
  float salinity  = readSalinity();
  float ammonia   = readAmmonia();

  Serial.printf("[SENSOR] Temp=%.2f°C  DO=%.2fmg/L  pH=%.2f  Turbidity=%.1fNTU  TDS=%.1fppm  Sal=%.1fppt  NH3=%.3fmg/L\n",
    temp, doVal, ph, turbidity, tds, salinity, ammonia);

  // Build JSON payload
  StaticJsonDocument<512> doc;
  doc["type"]       = "SENSOR_DATA";
  doc["boxId"]      = BOX_ID;
  doc["deviceType"] = DEVICE_TYPE;
  if (temp > -0.5f)  doc["temp"]      = round(temp * 100.0f) / 100.0f;
  if (doVal > 0.0f)  doc["do"]        = round(doVal * 100.0f) / 100.0f;
  if (ph > 0.0f)     doc["ph"]        = round(ph * 100.0f) / 100.0f;
  if (turbidity >= 0) doc["turbidity"] = round(turbidity * 10.0f) / 10.0f;
  if (tds > 0.0f)    doc["tds"]       = round(tds * 10.0f) / 10.0f;
  if (salinity >= 0) doc["salinity"]  = round(salinity * 100.0f) / 100.0f;
  if (ammonia >= 0)  doc["ammonia"]   = round(ammonia * 1000.0f) / 1000.0f;
  doc["rssi"]       = WiFi.RSSI();

  char buf[512];
  serializeJson(doc, buf, sizeof(buf));
  espNowSendToMaster(buf);
  Serial.printf("[SENSOR_DATA TX] %s\n", buf);
}

// ── Heartbeat (liveness only — no sensor data) ────────────────────────────────
static void sendHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["type"]       = "HEARTBEAT";
  doc["boxId"]      = BOX_ID;
  doc["deviceType"] = DEVICE_TYPE;
  doc["rssi"]       = WiFi.RSSI();

  char buf[128];
  serializeJson(doc, buf, sizeof(buf));
  espNowSendToMaster(buf);
}

// ── Incoming ESP-NOW callback ─────────────────────────────────────────────────
static void onDataRecv(const esp_now_recv_info_t* info, const uint8_t* data, int len) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, data, len);
  if (err) return;

  const char* msgType = doc["type"] | "";
  Serial.printf("[RX] type=%s\n", msgType);

  // PAIR_ACK: Master confirmed our DISCOVER
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
    digitalWrite(PIN_LED, HIGH);

    // Send first reading immediately
    sendSensorReading();
    g_lastRead = millis();
    return;
  }

  // PING: Master requesting a fresh reading
  if (strcmp(msgType, "PING") == 0) {
    sendSensorReading();
    g_lastRead = millis();
    return;
  }

  // COMMAND: Sensor boxes ignore ON/OFF commands
  if (strcmp(msgType, "COMMAND") == 0) {
    Serial.println("[CMD] Sensor box ignores ON/OFF commands.");
    return;
  }
}

// ── Arduino setup ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== AquaGrow WATER SENSOR Smart Box ===");
  Serial.printf("Box ID      : %s\n", BOX_ID);
  Serial.printf("Device Type : %s\n", DEVICE_TYPE);

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);

  // Start DS18B20
  ds18b20.begin();
  Serial.printf("[DS18B20] Found %d sensor(s)\n", ds18b20.getDeviceCount());

  // WiFi (Station mode for ESP-NOW)
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // WiFi.macAddress() works on all ESP32 Arduino core versions
  String macStr = WiFi.macAddress();
  macStr.toCharArray(g_myMac, sizeof(g_myMac));
  Serial.printf("MAC         : %s\n", g_myMac);

  // ESP-NOW init
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] esp_now_init() failed — reboot in 5s");
    delay(5000);
    ESP.restart();
  }
  esp_now_register_recv_cb(onDataRecv);

  // Add broadcast peer for DISCOVER
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
    digitalWrite(PIN_LED, (now / 500) % 2);

    if (now - g_lastDiscover >= DISCOVER_INTERVAL_MS) {
      sendDiscover();
      g_lastDiscover = now;
    }
    return;
  }

  // Read sensors on interval
  if (now - g_lastRead >= READ_INTERVAL_MS) {
    sendSensorReading();
    g_lastRead = now;
  }

  // Heartbeat on longer interval
  if (now - g_lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    g_lastHeartbeat = now;
  }
}
