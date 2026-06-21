// =============================================================================
//  AquaGrow MASTER BOX  v3.0  —  Final Development Architecture
//
//  Architecture:
//    AquaGrow App  ←→  Backend  ←HTTPS→  Master Box  ←ESP-NOW→  Smart Boxes
//
//  The app NEVER talks directly to the ESP32.
//  The ESP32 only talks to the backend via HTTPS.
//
//  Boot flow:
//    1. Connect to hardcoded WiFi
//    2. Read NVS (pondId + apiKey)
//    3. If missing → POST /api/masterbox/register → save to NVS
//    4. Start normal operations (heartbeat, command poll, ESP-NOW relay)
// =============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <esp_now.h>
#include <Preferences.h>

// ─────────────────────────────────────────────────────────────────────────────
//  FACTORY CONSTANTS  —  flashed once, never changed in the field
// ─────────────────────────────────────────────────────────────────────────────
#define BOX_ID       "MB001"                // Unique ID pre-programmed per unit
#define DEVICE_TYPE  "MASTER"               // Always MASTER for this firmware
#define FACTORY_KEY  "AQUAGROW_FACTORY_2025" // Must match FACTORY_KEY on backend

// ─────────────────────────────────────────────────────────────────────────────
//  WIFI CREDENTIALS  —  change for your development hotspot / router
//  After product is stable, replace with SIM7600 or AP-provisioning module.
// ─────────────────────────────────────────────────────────────────────────────
#define WIFI_SSID     "Syam_Hotspot"   // ← Change to your WiFi name
#define WIFI_PASSWORD "12345678"       // ← Change to your WiFi password

// ─────────────────────────────────────────────────────────────────────────────
//  CLOUD API
// ─────────────────────────────────────────────────────────────────────────────
#define API_BASE    "https://aquagrow.onrender.com/api"
#define ESPNOW_BASE "https://aquagrow.onrender.com/api/espnow"

// ─────────────────────────────────────────────────────────────────────────────
//  HARDWARE
// ─────────────────────────────────────────────────────────────────────────────
#define LED_PIN         2   // Onboard LED (GPIO2)
#define RESET_BTN_GPIO  0   // BOOT button — hold 10 s to factory-reset NVS
#define RESET_HOLD_MS   10000

// ─────────────────────────────────────────────────────────────────────────────
//  TIMING
// ─────────────────────────────────────────────────────────────────────────────
#define CLOUD_POLL_INTERVAL_MS  5000UL   // Poll commands every 5 s
#define MASTER_HEARTBEAT_MS    30000UL   // Send heartbeat every 30 s
#define SLAVE_PING_INTERVAL_MS 60000UL   // Ping slaves every 60 s
#define HTTP_TIMEOUT_MS         8000     // HTTP timeout
#define MAX_KNOWN_SLAVES          20     // Max in-RAM slave registry
#define CMD_RETRY_COUNT            3     // ESP-NOW send retries per command

// ─────────────────────────────────────────────────────────────────────────────
//  SLAVE ENTRY  (in-RAM registry: boxId → MAC)
// ─────────────────────────────────────────────────────────────────────────────
struct SlaveEntry {
  char     boxId[16];
  uint8_t  mac[6];
  bool     valid;
  uint32_t lastSeenMs;
};

// ─────────────────────────────────────────────────────────────────────────────
//  RUNTIME STATE
// ─────────────────────────────────────────────────────────────────────────────
static String g_pondId;    // Loaded from NVS after provisioning
static String g_apiKey;    // Loaded from NVS after provisioning (used as X-API-Key)
static bool   g_wifiOk = false;

// ─────────────────────────────────────────────────────────────────────────────
//  NVS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
static Preferences g_prefs;

static void loadFromNVS() {
  g_prefs.begin("aquagrow", /*readOnly=*/true);
  g_pondId = g_prefs.getString("pondId",  "");
  g_apiKey = g_prefs.getString("apiKey",  "");

  // ── Backward compat: old firmware stored token as "deviceToken" ──────────
  // If "apiKey" is empty but "deviceToken" exists (from prior firmware version),
  // read the old key so we don't force an unnecessary factory reset.
  String legacyToken = "";
  if (g_apiKey.length() == 0) {
    legacyToken = g_prefs.getString("deviceToken", "");
  }
  g_prefs.end();

  // Migrate: write "apiKey" + remove "deviceToken" so next boot is clean
  if (legacyToken.length() > 0) {
    g_apiKey = legacyToken;
    g_prefs.begin("aquagrow", false);
    g_prefs.putString("apiKey", g_apiKey);
    g_prefs.remove("deviceToken");
    g_prefs.end();
    Serial.println("[NVS] Migrated 'deviceToken' → 'apiKey' (one-time upgrade)");
  }

  Serial.printf("[NVS] pondId=%s  apiKey=%s\n",
    g_pondId.length() ? g_pondId.c_str() : "(none)",
    g_apiKey.length() ? "***"            : "(none)");
}

static void saveProvisionData(const String& pondId, const String& apiKey) {
  g_prefs.begin("aquagrow", false);
  g_prefs.putString("pondId", pondId);
  g_prefs.putString("apiKey", apiKey);
  g_prefs.remove("deviceToken"); // clean up old key if still present
  g_prefs.end();
  g_pondId = pondId;
  g_apiKey = apiKey;
  Serial.printf("[NVS] Saved: pondId=%s\n", pondId.c_str());
}

static void clearNVS() {
  g_prefs.begin("aquagrow", false);
  g_prefs.clear();
  g_prefs.end();
  g_pondId = g_apiKey = "";
  Serial.println("[NVS] Cleared — will re-provision on next boot");
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESET BUTTON  (GPIO 0 — hold 10 s → clears NVS → reboots)
// ─────────────────────────────────────────────────────────────────────────────
static uint32_t g_resetPressMs = 0;
static bool     g_resetHolding = false;

static void checkResetButton() {
  bool pressed = (digitalRead(RESET_BTN_GPIO) == LOW);
  if (pressed && !g_resetHolding) {
    g_resetHolding = true;
    g_resetPressMs = millis();
  }
  if (!pressed && g_resetHolding) {
    g_resetHolding = false;
    g_resetPressMs = 0;
  }
  if (g_resetHolding && (millis() - g_resetPressMs >= RESET_HOLD_MS)) {
    Serial.println("[RESET] Factory reset triggered!");
    for (int i = 0; i < 6; i++) {
      digitalWrite(LED_PIN, HIGH); delay(100);
      digitalWrite(LED_PIN, LOW);  delay(100);
    }
    clearNVS();
    delay(300);
    ESP.restart();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  WIFI CONNECTION
// ─────────────────────────────────────────────────────────────────────────────
static void connectWifi() {
  Serial.printf("[WiFi] Connecting to \"%s\"...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    g_wifiOk = true;
    Serial.printf("[WiFi] Connected!  IP: %s  RSSI: %d dBm\n",
      WiFi.localIP().toString().c_str(), WiFi.RSSI());
    digitalWrite(LED_PIN, HIGH);
  } else {
    g_wifiOk = false;
    Serial.println("[WiFi] ✗ Connection failed — will retry in loop");
    digitalWrite(LED_PIN, LOW);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HTTP HELPERS  (all cloud calls use g_apiKey as X-API-Key)
// ─────────────────────────────────────────────────────────────────────────────
static WiFiClientSecure g_tlsClient;

static int httpPost(const char* url, const char* body, String* respOut = nullptr) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  HTTPClient http;
  g_tlsClient.setInsecure();
  http.begin(g_tlsClient, url);
  http.addHeader("Content-Type", "application/json");
  if (g_apiKey.length() > 0)
    http.addHeader("X-API-Key", g_apiKey);
  http.setTimeout(HTTP_TIMEOUT_MS);
  int code = http.POST(body);
  if (respOut && code > 0) *respOut = http.getString();
  http.end();
  return code;
}

static int httpGet(const char* url, String* respOut) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  HTTPClient http;
  g_tlsClient.setInsecure();
  http.begin(g_tlsClient, url);
  http.addHeader("X-API-Key", g_apiKey);
  http.setTimeout(HTTP_TIMEOUT_MS);
  int code = http.GET();
  if (respOut && code > 0) *respOut = http.getString();
  http.end();
  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROVISIONING  —  POST /api/masterbox/register
//
//  Request body:
//    { "boxId": "MB001", "deviceType": "MASTER", "factoryKey": "AQUAGROW_..." }
//
//  Response (200):
//    { "success": true, "pondId": "...", "apiKey": "aqg_..." }
//
//  On success, pondId + apiKey are saved to NVS and the box starts
//  sending heartbeats. On subsequent boots, NVS is read and this call is
//  skipped entirely.
// ─────────────────────────────────────────────────────────────────────────────
static bool provisionDevice() {
  Serial.println("[PROVISION] Contacting provisioning server...");

  StaticJsonDocument<256> req;
  req["boxId"]      = BOX_ID;
  req["deviceType"] = DEVICE_TYPE;
  req["factoryKey"] = FACTORY_KEY;
  char reqBuf[256];
  serializeJson(req, reqBuf, sizeof(reqBuf));

  const char* url = API_BASE "/masterbox/register";
  Serial.printf("[PROVISION] POST %s\n", url);

  String resp;
  int code = httpPost(url, reqBuf, &resp);
  Serial.printf("[PROVISION] HTTP %d  Body: %.300s\n", code, resp.c_str());

  if (code == 200 || code == 201) {
    DynamicJsonDocument doc(512);
    if (!deserializeJson(doc, resp)) {
      bool        success = doc["success"] | false;
      const char* pondId  = doc["pondId"]  | "";
      const char* apiKey  = doc["apiKey"]  | "";
      if (success && strlen(pondId) > 0 && strlen(apiKey) > 0) {
        saveProvisionData(pondId, apiKey);
        Serial.printf("[PROVISION] ✓ Success!  Pond: %s\n", pondId);
        return true;
      }
      const char* err = doc["error"] | "Unknown error";
      Serial.printf("[PROVISION] ✗ Server error: %s\n", err);
    } else {
      Serial.println("[PROVISION] ✗ JSON parse failed");
    }
  } else if (code == 401) {
    Serial.println("[PROVISION] ✗ Invalid FACTORY_KEY — check #define FACTORY_KEY");
  } else if (code == 404) {
    Serial.println("[PROVISION] ✗ BOX_ID not registered in AquaGrow app.");
    Serial.printf( "[PROVISION]   → App: Register Device → Master Box → Box ID: %s\n", BOX_ID);
  } else if (code == 409) {
    Serial.println("[PROVISION] ✗ Box already claimed by another account.");
  } else if (code < 0) {
    Serial.println("[PROVISION] ✗ Network error — check WiFi.");
  } else {
    Serial.printf("[PROVISION] ✗ Unexpected HTTP %d\n", code);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SLAVE REGISTRY  (in-RAM: boxId → MAC)
// ─────────────────────────────────────────────────────────────────────────────
static SlaveEntry g_slaves[MAX_KNOWN_SLAVES];
static int        g_slaveCount = 0;

static SlaveEntry* findSlaveByBoxId(const char* boxId) {
  for (int i = 0; i < MAX_KNOWN_SLAVES; i++)
    if (g_slaves[i].valid && strcmp(g_slaves[i].boxId, boxId) == 0)
      return &g_slaves[i];
  return nullptr;
}

static void addEspNowPeer(const uint8_t* mac) {
  if (!esp_now_is_peer_exist(mac)) {
    esp_now_peer_info_t peer = {};
    memcpy(peer.peer_addr, mac, 6);
    peer.channel = 0;
    peer.encrypt = false;
    esp_now_add_peer(&peer);
  }
}

static void registerSlave(const char* boxId, const uint8_t* mac) {
  SlaveEntry* e = findSlaveByBoxId(boxId);
  if (e) {
    memcpy(e->mac, mac, 6);
    e->lastSeenMs = millis();
    addEspNowPeer(mac);
    return;
  }
  for (int i = 0; i < MAX_KNOWN_SLAVES; i++) {
    if (!g_slaves[i].valid) {
      strlcpy(g_slaves[i].boxId, boxId, sizeof(g_slaves[i].boxId));
      memcpy(g_slaves[i].mac, mac, 6);
      g_slaves[i].valid      = true;
      g_slaves[i].lastSeenMs = millis();
      g_slaveCount++;
      addEspNowPeer(mac);
      Serial.printf("[REGISTRY] New slave: %s\n", boxId);
      return;
    }
  }
  Serial.println("[REGISTRY] ERROR: Registry full!");
}

// ─────────────────────────────────────────────────────────────────────────────
//  ESP-NOW DISPATCH
// ─────────────────────────────────────────────────────────────────────────────
static bool espNowSend(const uint8_t* mac, const char* payload) {
  return esp_now_send(mac, (const uint8_t*)payload, strlen(payload) + 1) == ESP_OK;
}

static void sendPairAck(const uint8_t* mac, const char* slaveBoxId) {
  StaticJsonDocument<128> doc;
  doc["type"]     = "PAIR_ACK";
  doc["masterId"] = BOX_ID;
  doc["pondId"]   = g_pondId;
  doc["boxId"]    = slaveBoxId;
  char buf[128];
  serializeJson(doc, buf, sizeof(buf));
  espNowSend(mac, buf);
  Serial.printf("[PAIR_ACK] → %s\n", slaveBoxId);
}

static bool dispatchCommandToSlave(const char* targetBoxId, const char* action,
                                   const char* cmdId, int speed = 0, int durMin = 0) {
  SlaveEntry* s = findSlaveByBoxId(targetBoxId);
  if (!s) {
    Serial.printf("[CMD] Unknown slave: %s\n", targetBoxId);
    return false;
  }
  StaticJsonDocument<256> doc;
  doc["type"]   = "COMMAND";
  doc["cmdId"]  = cmdId;
  doc["action"] = action;
  if (speed  > 0) doc["speed"]           = speed;
  if (durMin > 0) doc["durationMinutes"] = durMin;
  char buf[256];
  serializeJson(doc, buf, sizeof(buf));

  for (int attempt = 0; attempt < CMD_RETRY_COUNT; attempt++) {
    if (espNowSend(s->mac, buf)) {
      Serial.printf("[CMD] %s → %s (attempt %d) OK\n", action, targetBoxId, attempt + 1);
      for (int f = 0; f < 2; f++) {
        digitalWrite(LED_PIN, LOW);  delay(50);
        digitalWrite(LED_PIN, HIGH); delay(50);
      }
      return true;
    }
    delay(100);
  }
  Serial.printf("[CMD] FAILED after %d tries: %s\n", CMD_RETRY_COUNT, targetBoxId);
  return false;
}

static void pingAllSlaves() {
  StaticJsonDocument<32> doc;
  doc["type"] = "PING";
  char buf[32];
  serializeJson(doc, buf, sizeof(buf));
  for (int i = 0; i < MAX_KNOWN_SLAVES; i++) {
    if (g_slaves[i].valid) {
      espNowSend(g_slaves[i].mac, buf);
      Serial.printf("[PING] → %s\n", g_slaves[i].boxId);
      delay(20);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLOUD API CALLS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
//  AUTO RE-PROVISION  — called when server returns 401 (stale apiKey)
// ─────────────────────────────────────────────────────────────────────────────
static void triggerReProvision() {
  Serial.println("[AUTH] 401 detected — apiKey is stale. Clearing NVS and re-provisioning...");
  clearNVS();           // wipes pondId + apiKey
  // Immediately try to get fresh credentials from server
  if (WiFi.status() == WL_CONNECTED) {
    int attempts = 0;
    while (!provisionDevice() && attempts < 3) {
      attempts++;
      Serial.printf("[AUTH] Re-provision attempt %d/3 in 15 s...\n", attempts);
      for (int s = 0; s < 15; s++) {
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        delay(1000);
        checkResetButton();
      }
    }
    if (g_pondId.length() == 0) {
      Serial.println("[AUTH] Re-provision failed — will retry every 60 s.");
      Serial.println("[AUTH] Ensure MB001 is registered in the AquaGrow app.");
    }
  }
}

static void postMasterHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["boxId"]      = BOX_ID;
  doc["pondId"]     = g_pondId;
  doc["role"]       = "master";
  doc["rssi"]       = WiFi.RSSI();
  doc["freeHeap"]   = ESP.getFreeHeap();
  doc["slaveCount"] = g_slaveCount;
  char buf[256];
  serializeJson(doc, buf, sizeof(buf));
  int code = httpPost(ESPNOW_BASE "/heartbeat", buf);
  Serial.printf("[HB] Master → Cloud: HTTP %d\n", code);
  if (code == 401) triggerReProvision();
}

static void postDiscover(const char* slaveBoxId, const char* slaveMac) {
  StaticJsonDocument<256> doc;
  doc["boxId"]    = slaveBoxId;
  doc["masterId"] = BOX_ID;
  doc["pondId"]   = g_pondId;
  doc["mac"]      = slaveMac;
  char buf[256];
  serializeJson(doc, buf, sizeof(buf));
  String resp;
  int code = httpPost(ESPNOW_BASE "/discover", buf, &resp);
  Serial.printf("[DISCOVER→Cloud] %s  HTTP %d\n", slaveBoxId, code);
}

static void postSlaveHeartbeat(JsonDocument& d, const char* mac) {
  d["masterId"] = BOX_ID;
  d["pondId"]   = g_pondId;
  d["mac"]      = mac;
  char buf[512];
  serializeJson(d, buf, sizeof(buf));
  int code = httpPost(ESPNOW_BASE "/heartbeat", buf);
  Serial.printf("[HB→Cloud] %s  HTTP %d\n", d["boxId"] | "?", code);
}

static void postSensorReading(JsonDocument& d, const char* mac) {
  d["masterId"] = BOX_ID;
  d["pondId"]   = g_pondId;
  d["mac"]      = mac;
  char buf[768];
  serializeJson(d, buf, sizeof(buf));
  int code = httpPost(ESPNOW_BASE "/reading", buf);
  Serial.printf("[READING→Cloud] %s  HTTP %d\n", d["boxId"] | "?", code);
}

static void postCommandConfirm(JsonDocument& d) {
  d["masterId"] = BOX_ID;
  d["pondId"]   = g_pondId;
  char buf[256];
  serializeJson(d, buf, sizeof(buf));
  int code = httpPost(ESPNOW_BASE "/confirm", buf);
  Serial.printf("[CONFIRM→Cloud] cmdId=%s  HTTP %d\n", d["cmdId"] | "?", code);
}

static void pollAndDispatchCommands() {
  char url[200];
  snprintf(url, sizeof(url),
    "%s/poll/%s", ESPNOW_BASE, g_pondId.c_str());

  String resp;
  int code = httpGet(url, &resp);
  Serial.printf("[POLL] HTTP %d\n", code);
  if (code == 401) { triggerReProvision(); return; }
  if (code != 200) {
    return;
  }

  // Response: { "command": { commandId, targetBoxId, targetMac, action, params } | null }
  DynamicJsonDocument doc(2048);
  if (deserializeJson(doc, resp)) {
    Serial.println("[POLL] JSON parse error");
    return;
  }

  JsonVariant cmdVar = doc["command"];
  if (cmdVar.isNull()) return;  // no pending command

  JsonObject cmd = cmdVar.as<JsonObject>();
  const char* cmdId    = cmd["commandId"]  | "";
  const char* targetId = cmd["targetBoxId"]| "";
  const char* action   = cmd["action"]     | "";
  int speed  = cmd["params"]["speed"]           | 0;
  int durMin = cmd["params"]["durationMinutes"] | 0;

  if (!strlen(targetId) || !strlen(action)) return;

  Serial.printf("[POLL] Command: %s → %s  id=%s\n", action, targetId, cmdId);
  bool ok = dispatchCommandToSlave(targetId, action, cmdId, speed, durMin);
  if (!ok) {
    StaticJsonDocument<200> fail;
    fail["cmdId"]   = cmdId;
    fail["success"] = false;
    fail["reason"]  = "Slave unreachable";
    postCommandConfirm(fail);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  ESP-NOW RX QUEUE  (interrupt-safe circular buffer)
// ─────────────────────────────────────────────────────────────────────────────
struct RxMsg {
  uint8_t src[6];
  char    payload[600];
  bool    pending;
};
#define RX_QUEUE_SIZE 8
static RxMsg        g_rxQueue[RX_QUEUE_SIZE];
static volatile int g_rxHead = 0;
static int          g_rxTail = 0;

static void IRAM_ATTR onDataRecv(const esp_now_recv_info_t* info,
                                  const uint8_t* data, int len) {
  int next = (g_rxHead + 1) % RX_QUEUE_SIZE;
  if (next == g_rxTail) return;  // Queue full — drop
  RxMsg& m = g_rxQueue[g_rxHead];
  memcpy(m.src, info->src_addr, 6);
  int n = min(len, (int)sizeof(m.payload) - 1);
  memcpy(m.payload, data, n);
  m.payload[n] = '\0';
  m.pending    = true;
  g_rxHead     = next;
}

static void processRxQueue() {
  while (g_rxTail != g_rxHead) {
    RxMsg& m = g_rxQueue[g_rxTail];
    if (!m.pending) { g_rxTail = (g_rxTail + 1) % RX_QUEUE_SIZE; continue; }

    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
      m.src[0], m.src[1], m.src[2], m.src[3], m.src[4], m.src[5]);

    DynamicJsonDocument doc(1024);
    if (deserializeJson(doc, m.payload)) {
      Serial.printf("[RX] JSON parse error from %s\n", macStr);
      m.pending = false;
      g_rxTail = (g_rxTail + 1) % RX_QUEUE_SIZE;
      continue;
    }

    const char* type  = doc["type"]  | "";
    const char* boxId = doc["boxId"] | "";
    Serial.printf("[RX] boxId=%-8s type=%-12s from=%s\n", boxId, type, macStr);

    if      (!strcmp(type, "DISCOVER"))    { registerSlave(boxId, m.src); sendPairAck(m.src, boxId); postDiscover(boxId, macStr); }
    else if (!strcmp(type, "HEARTBEAT"))   { registerSlave(boxId, m.src); postSlaveHeartbeat(doc, macStr); }
    else if (!strcmp(type, "SENSOR_DATA")) { registerSlave(boxId, m.src); postSensorReading(doc, macStr); }
    else if (!strcmp(type, "CMD_CONFIRM")) { postCommandConfirm(doc); }
    else    { Serial.printf("[RX] Unknown type: %s\n", type); }

    m.pending = false;
    g_rxTail  = (g_rxTail + 1) % RX_QUEUE_SIZE;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=========================================");
  Serial.println("  AquaGrow MASTER BOX  v3.0");
  Serial.printf ("  Box ID      : %s\n", BOX_ID);
  Serial.printf ("  Device Type : %s\n", DEVICE_TYPE);
  Serial.printf ("  WiFi SSID   : %s\n", WIFI_SSID);
  Serial.println("=========================================\n");

  pinMode(LED_PIN,        OUTPUT);
  pinMode(RESET_BTN_GPIO, INPUT_PULLUP);
  digitalWrite(LED_PIN, LOW);

  // ── Step 1: Connect WiFi ──────────────────────────────────────────────────
  connectWifi();

  // ── Step 2: Read NVS ─────────────────────────────────────────────────────
  loadFromNVS();

  bool hasToken = (g_apiKey.length() > 0 && g_pondId.length() > 0);

  // ── Step 3: Provision if needed ───────────────────────────────────────────
  if (!hasToken && WiFi.status() == WL_CONNECTED) {
    Serial.println("[BOOT] No provisioning data — calling provision API...");
    int attempts = 0;
    while (!provisionDevice() && attempts < 5) {
      attempts++;
      Serial.printf("[BOOT] Provision retry %d/5 in 10 s...\n", attempts);
      for (int s = 0; s < 10; s++) {
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        delay(1000);
      }
    }
    if (g_pondId.length() == 0) {
      Serial.println("[BOOT] Provisioning failed — will retry every 60 s in loop.");
      Serial.println("[BOOT] Make sure MB001 is registered in the AquaGrow app.");
    }
  } else if (hasToken) {
    Serial.printf("[BOOT] apiKey found — skipping provisioning. Pond: %s\n", g_pondId.c_str());
  }

  // ── Step 4: Init ESP-NOW ──────────────────────────────────────────────────
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] esp_now_init() failed — rebooting in 5 s");
    delay(5000);
    ESP.restart();
  }
  esp_now_register_recv_cb(onDataRecv);

  // Broadcast peer (for PAIR_ACK to new slaves)
  esp_now_peer_info_t bcast = {};
  memset(bcast.peer_addr, 0xFF, 6);
  bcast.channel = 0;
  bcast.encrypt = false;
  esp_now_add_peer(&bcast);

  // ── Step 5: Start operational ─────────────────────────────────────────────
  Serial.println("[BOOT] ─────────────────────────────────────────────");
  Serial.printf ("[BOOT] OPERATIONAL  Pond: %s\n",
    g_pondId.length() ? g_pondId.c_str() : "(pending provisioning)");
  Serial.println("[BOOT] ─────────────────────────────────────────────\n");

  if (g_pondId.length() > 0) {
    postMasterHeartbeat();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  checkResetButton();

  uint32_t now = millis();
  static uint32_t lastPoll      = 0;
  static uint32_t lastHB        = 0;
  static uint32_t lastPing      = 0;
  static uint32_t lastWifiRetry = 0;  // WiFi reconnect timer
  static uint32_t lastProvRetry = 0;  // Provision retry timer (separate)

  // Process incoming ESP-NOW messages
  processRxQueue();

  // ── WiFi watchdog — reconnect if dropped ──────────────────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    g_wifiOk = false;
    if (now - lastWifiRetry >= 10000) {
      Serial.println("[WiFi] Lost — reconnecting...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      lastWifiRetry = now;
    }
    return;
  }
  if (!g_wifiOk) {
    g_wifiOk = true;
    Serial.println("[WiFi] Reconnected!");
    digitalWrite(LED_PIN, HIGH);
  }

  // ── Retry provisioning if no credentials (or 401 cleared them) ───────────
  if (g_pondId.length() == 0 || g_apiKey.length() == 0) {
    if (now - lastProvRetry >= 60000) {
      Serial.println("[PROVISION] Retrying register call...");
      provisionDevice();
      lastProvRetry = now;
    }
    return;
  }

  // ── Normal cloud operations ───────────────────────────────────────────────
  if (now - lastPoll >= CLOUD_POLL_INTERVAL_MS) { pollAndDispatchCommands(); lastPoll = now; }
  if (now - lastHB   >= MASTER_HEARTBEAT_MS)    { postMasterHeartbeat();     lastHB   = now; }
  if (now - lastPing >= SLAVE_PING_INTERVAL_MS) { pingAllSlaves();           lastPing = now; }
}
