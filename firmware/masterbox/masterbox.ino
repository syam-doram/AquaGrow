/**
 * ============================================================
 *  AquaGrow — Master Box Firmware  v2.0
 *  Device Type : MASTER
 *  Role        : master (role=master in the AquaGrow backend)
 * ============================================================
 *
 *  PROVISIONING ARCHITECTURE
 *  ─────────────────────────
 *  Factory flash:  BOX_ID + DEVICE_TYPE + FACTORY_KEY  (never changes)
 *
 *  First Boot (no WiFi stored):
 *    1. ESP32 starts AP  "AquaGrow-MB001"  password: 12345678
 *    2. Farmer opens AquaGrow app → "Add Master Box"
 *    3. Farmer connects phone to AquaGrow-MB001
 *    4. App sends POST http://192.168.4.1/wifi/setup
 *         { "ssid": "Farmer_WiFi", "password": "FarmerPass" }
 *    5. ESP32 stores credentials in NVS and restarts
 *
 *  After WiFi connected (no provisioning token yet):
 *    6. ESP32 calls POST /api/device/provision
 *         { boxId, factoryKey, deviceType }
 *    7. Backend returns { pondId, deviceToken }
 *    8. ESP32 stores pondId + deviceToken in NVS
 *
 *  Subsequent boots:
 *    → Reads NVS → connects to WiFi → polls cloud immediately
 *    → No user action ever needed again
 *
 *  WiFi Reset (hold GPIO 0 for 10 s):
 *    → Clears NVS → restarts → AP mode starts fresh
 *
 *  LED STATUS
 *  ──────────
 *  Double-blink (repeating) = AP mode (awaiting setup)
 *  Fast blink (200 ms)      = Connecting to WiFi
 *  Solid ON                 = Fully operational
 *  Double-flash             = Command dispatched to Smart Box
 *
 *  LIBRARIES (Library Manager)
 *  ────────────────────────────
 *  - ArduinoJson >= 6.21  (Benoit Blanchon)
 *  All other libs are built-in to ESP32 Arduino core.
 *
 *  FLASH SETTINGS (Arduino IDE)
 *  ──────────────────────────────
 *  Board     : ESP32 Dev Module
 *  Partition : Default 4MB with SPIFFS (needs NVS partition)
 *  Baud      : 115200
 * ============================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>
#include <esp_now.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ─────────────────────────────────────────────────────────────────────────────
//  FACTORY CONSTANTS — flashed once at manufacturing, NEVER changed
// ─────────────────────────────────────────────────────────────────────────────
#define BOX_ID       "MB001"              // Unique ID for this unit
#define DEVICE_TYPE  "MASTER"             // Always MASTER for this firmware
#define FACTORY_KEY  "AQUAGROW_FACTORY_2025"  // Must match backend env var
#define AP_PASSWORD  "12345678"           // AP password shown to farmer in app

// Cloud API
#define API_BASE  "https://aquagrow.onrender.com/api"

// Hardware
#define LED_PIN         2     // Onboard LED
#define RESET_BTN_GPIO  0     // BOOT button — hold 10 s to factory reset
#define RESET_HOLD_MS   10000

// Operational timing
#define CLOUD_POLL_INTERVAL_MS   5000UL
#define MASTER_HEARTBEAT_MS     30000UL
#define SLAVE_PING_INTERVAL_MS  60000UL
#define MAX_KNOWN_SLAVES        20
#define CMD_RETRY_COUNT         3
#define HTTP_TIMEOUT_MS         8000

// ─────────────────────────────────────────────────────────────────────────────
//  DEV / TEST WIFI OVERRIDE
//  Fill TEST_SSID to skip AP mode and connect directly — useful during testing.
//  Set TEST_SSID to "" for production (uses normal AP provisioning flow).
// ─────────────────────────────────────────────────────────────────────────────
#define TEST_SSID      "iPhone"      // ← Your hotspot / router name
#define TEST_PASSWORD  ""            // ← Your hotspot password (blank if open)
#define TEST_TOKEN     ""            // ← Paste apiKey from backend DB here
#define TEST_POND_ID   ""            // ← Paste pondId here (e.g. 69d21569b5dcd1a28857838c)
#define USE_TEST_WIFI  1             // ← Set to 0 for production AP provisioning

// ─────────────────────────────────────────────────────────────────────────────
//  SLAVE ENTRY  (declared here so Arduino auto-prototype sees the type)
// ─────────────────────────────────────────────────────────────────────────────
struct SlaveEntry {
  char     boxId[16];
  uint8_t  mac[6];
  bool     valid;
  uint32_t lastSeenMs;
};

// ─────────────────────────────────────────────────────────────────────────────
//  FIRMWARE STATE MACHINE
// ─────────────────────────────────────────────────────────────────────────────
enum FirmwareState {
  STATE_AP_MODE,      // No WiFi creds → broadcast setup AP
  STATE_OPERATIONAL,  // WiFi + token → normal cloud + ESP-NOW operation
};
static FirmwareState g_state = STATE_AP_MODE;

// ─────────────────────────────────────────────────────────────────────────────
//  RUNTIME CREDENTIALS  (loaded from NVS — never hardcoded)
// ─────────────────────────────────────────────────────────────────────────────
static String g_ssid;         // Farm WiFi SSID
static String g_password;     // Farm WiFi password
static String g_pondId;       // From provisioning endpoint
static String g_deviceToken;  // From provisioning endpoint (used as X-API-Key)
static String g_apSsid;       // Built at runtime: "AquaGrow-MB001"
static bool   g_wifiOk = false;

// ─────────────────────────────────────────────────────────────────────────────
//  NVS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
static Preferences g_prefs;

static void loadFromNVS() {
  g_prefs.begin("aquagrow", /*readOnly=*/true);
  g_ssid        = g_prefs.getString("ssid",        "");
  g_password    = g_prefs.getString("password",    "");
  g_pondId      = g_prefs.getString("pondId",      "");
  g_deviceToken = g_prefs.getString("deviceToken", "");
  g_prefs.end();
  Serial.printf("[NVS] ssid=%s  pondId=%s  token=%s\n",
    g_ssid.length() ? g_ssid.c_str() : "(none)",
    g_pondId.length() ? g_pondId.c_str() : "(none)",
    g_deviceToken.length() ? "***" : "(none)");
}

static void saveWifiCredentials(const String& ssid, const String& password) {
  g_prefs.begin("aquagrow", false);
  g_prefs.putString("ssid",     ssid);
  g_prefs.putString("password", password);
  g_prefs.end();
  Serial.printf("[NVS] Saved WiFi: ssid=%s\n", ssid.c_str());
}

static void saveProvisionData(const String& pondId, const String& token) {
  g_prefs.begin("aquagrow", false);
  g_prefs.putString("pondId",      pondId);
  g_prefs.putString("deviceToken", token);
  g_prefs.end();
  g_pondId      = pondId;
  g_deviceToken = token;
  Serial.printf("[NVS] Saved provision data: pondId=%s\n", pondId.c_str());
}

static void clearNVS() {
  g_prefs.begin("aquagrow", false);
  g_prefs.clear();
  g_prefs.end();
  g_ssid = g_password = g_pondId = g_deviceToken = "";
  Serial.println("[NVS] Cleared — all credentials wiped");
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESET BUTTON  (GPIO 0, hold 10 s → factory reset)
// ─────────────────────────────────────────────────────────────────────────────
static uint32_t g_resetPressMs  = 0;
static bool     g_resetHolding  = false;

static void checkResetButton() {
  bool pressed = (digitalRead(RESET_BTN_GPIO) == LOW);

  if (pressed && !g_resetHolding) {
    g_resetHolding = true;
    g_resetPressMs = millis();
    Serial.println("[RESET] Button pressed — hold 10 s for factory reset");

  } else if (!pressed && g_resetHolding) {
    g_resetHolding = false;
    uint32_t held = millis() - g_resetPressMs;
    Serial.printf("[RESET] Released after %lu ms\n", held);

  } else if (pressed && g_resetHolding) {
    uint32_t held = millis() - g_resetPressMs;

    // Blink faster as we approach 10 s (visual feedback)
    uint32_t period = (uint32_t)map((long)held, 0, RESET_HOLD_MS, 800, 80);
    period = max(period, (uint32_t)60);
    digitalWrite(LED_PIN, (millis() / period) % 2 ? HIGH : LOW);

    if (held >= RESET_HOLD_MS) {
      Serial.println("[RESET] 10 s held — factory reset!");
      clearNVS();
      delay(300);
      ESP.restart();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  AP MODE — Web Server + DNS (captive portal)
// ─────────────────────────────────────────────────────────────────────────────
static WebServer g_webServer(80);
static DNSServer g_dnsServer;

// Helper: send JSON response with CORS headers (app may call from HTTP)
static void sendJson(int code, const String& body) {
  g_webServer.sendHeader("Access-Control-Allow-Origin",  "*");
  g_webServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  g_webServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  g_webServer.sendHeader("Cache-Control",                "no-cache");
  g_webServer.send(code, "application/json", body);
}

// GET /status → { boxId, deviceType, provisioned, apSsid }
static void handleStatus() {
  StaticJsonDocument<200> doc;
  doc["boxId"]       = BOX_ID;
  doc["deviceType"]  = DEVICE_TYPE;
  doc["provisioned"] = false;
  doc["apSsid"]      = g_apSsid;
  doc["fwVersion"]   = "2.0";
  char buf[200];
  serializeJson(doc, buf);
  sendJson(200, buf);
}

// OPTIONS preflight — needed for browsers / Capacitor apps
static void handleOptions() {
  sendJson(200, "{}");
}

// POST /wifi/setup  { "ssid": "...", "password": "..." }
// → stores credentials in NVS → restart into STA mode
static void handleWifiSetup() {
  if (!g_webServer.hasArg("plain")) {
    sendJson(400, R"({"error":"Request body required"})");
    return;
  }
  String body = g_webServer.arg("plain");
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, body)) {
    sendJson(400, R"({"error":"Invalid JSON"})");
    return;
  }

  const char* ssid = doc["ssid"]     | "";
  const char* pass = doc["password"] | "";
  if (strlen(ssid) == 0) {
    sendJson(400, R"({"error":"ssid is required"})");
    return;
  }

  Serial.printf("[AP] Received WiFi setup: ssid=%s\n", ssid);
  saveWifiCredentials(ssid, pass);
  sendJson(200, R"({"success":true,"message":"Credentials saved. Restarting..."})");

  delay(500);  // Give response time to reach the app
  ESP.restart();
}

// POST /reset → clears all NVS → restarts into AP mode
static void handleResetEndpoint() {
  sendJson(200, R"({"success":true,"message":"Clearing credentials and restarting..."})");
  delay(500);
  clearNVS();
  ESP.restart();
}

// Catch-all → captive portal redirect to /status
static void handleNotFound() {
  g_webServer.sendHeader("Location", "http://192.168.4.1/status");
  g_webServer.send(302, "text/plain", "");
}

static void startAPMode() {
  Serial.println("[AP] ──────────────────────────────────────────");
  Serial.println("[AP] Starting provisioning AP...");
  Serial.printf ("[AP] SSID     : %s\n", g_apSsid.c_str());
  Serial.printf ("[AP] Password : %s\n", AP_PASSWORD);
  Serial.println("[AP] Connect your phone and open AquaGrow app");
  Serial.println("[AP] ──────────────────────────────────────────");

  WiFi.mode(WIFI_AP);
  WiFi.softAP(g_apSsid.c_str(), AP_PASSWORD);
  delay(200);

  Serial.printf("[AP] IP: %s\n", WiFi.softAPIP().toString().c_str());

  // DNS: redirect all queries to our IP (captive portal)
  g_dnsServer.start(53, "*", WiFi.softAPIP());

  // Register web routes
  g_webServer.on("/status",     HTTP_GET,     handleStatus);
  g_webServer.on("/status",     HTTP_OPTIONS, handleOptions);
  g_webServer.on("/wifi/setup", HTTP_POST,    handleWifiSetup);
  g_webServer.on("/wifi/setup", HTTP_OPTIONS, handleOptions);
  g_webServer.on("/reset",      HTTP_POST,    handleResetEndpoint);
  g_webServer.on("/reset",      HTTP_OPTIONS, handleOptions);
  g_webServer.onNotFound(handleNotFound);
  g_webServer.begin();

  // Visual feedback: triple double-blink = AP mode
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH); delay(120);
    digitalWrite(LED_PIN, LOW);  delay(120);
    digitalWrite(LED_PIN, HIGH); delay(120);
    digitalWrite(LED_PIN, LOW);  delay(600);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  WIFI CONNECTION (STA mode)
// ─────────────────────────────────────────────────────────────────────────────
static bool connectWifi() {
  Serial.printf("[WiFi] Connecting to \"%s\"...\n", g_ssid.c_str());
  // WIFI_AP_STA allows ESP-NOW (needs STA radio) + WiFi simultaneously
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(g_ssid.c_str(), g_password.c_str());

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(200);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    g_wifiOk = true;
    digitalWrite(LED_PIN, HIGH);
    Serial.printf("\n[WiFi] Connected!  IP: %s  RSSI: %d dBm\n",
      WiFi.localIP().toString().c_str(), WiFi.RSSI());
    return true;
  }
  Serial.println("\n[WiFi] Connection FAILED. Will retry in loop.");
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
//  PROVISIONING  (GET /api/device/{BOX_ID})
//  Called after WiFi connects if deviceToken is not yet in NVS.
//  The farmer must have already registered BOX_ID in the AquaGrow app
//  (assigned it to a pond) before this call will succeed.
//
//  Request:
//    GET  {API_BASE}/device/{BOX_ID}
//    X-Factory-Key : FACTORY_KEY   (validates this is genuine hardware)
//    X-Device-Type : DEVICE_TYPE   (e.g. MASTER)
//
//  Response (200):
//    { "success": true, "pondId": "POND001", "deviceToken": "xyz123" }
// ─────────────────────────────────────────────────────────────────────────────
static bool provisionDevice() {
  // Build URL: GET /api/device/MB001
  char url[120];
  snprintf(url, sizeof(url), "%s/device/%s", API_BASE, BOX_ID);

  Serial.println("[PROVISION] Contacting provisioning server...");
  Serial.printf("[PROVISION] GET %s\n", url);

  WiFiClientSecure tls;
  tls.setInsecure();  // Prototype: skip cert verify

  HTTPClient http;
  http.begin(tls, url);
  // Permanent factory credentials sent as headers — no body needed
  http.addHeader("X-Factory-Key",  FACTORY_KEY);
  http.addHeader("X-Device-Type",  DEVICE_TYPE);
  http.setTimeout(HTTP_TIMEOUT_MS);

  int    code = http.GET();
  String resp = code > 0 ? http.getString() : "";
  http.end();

  Serial.printf("[PROVISION] HTTP %d  Body: %.400s\n", code, resp.c_str());

  if (code == 200 || code == 201) {
    DynamicJsonDocument doc(512);
    if (!deserializeJson(doc, resp)) {
      bool        success = doc["success"] | false;
      const char* pondId  = doc["pondId"]      | "";
      const char* token   = doc["deviceToken"] | "";
      if (success && strlen(pondId) > 0 && strlen(token) > 0) {
        saveProvisionData(pondId, token);
        Serial.printf("[PROVISION] ✓ Success!  Pond: %s\n", pondId);
        return true;
      }
      if (!success) {
        const char* err = doc["error"] | "Unknown error from server";
        Serial.printf("[PROVISION] ✗ Server returned success=false: %s\n", err);
      } else {
        Serial.println("[PROVISION] ✗ Response missing pondId or deviceToken");
      }
    } else {
      Serial.println("[PROVISION] ✗ JSON parse failed");
    }
  } else if (code == 401 || code == 403) {
    Serial.println("[PROVISION] ✗ Invalid FACTORY_KEY. Check #define FACTORY_KEY in firmware.");
  } else if (code == 404) {
    Serial.println("[PROVISION] ✗ Box not found. Register BOX_ID in the AquaGrow app first.");
    Serial.printf ("[PROVISION]   → App: Add Master Box → Box ID: %s\n", BOX_ID);
  } else if (code == 409) {
    Serial.println("[PROVISION] ✗ Box already claimed by another account.");
  } else if (code < 0) {
    Serial.println("[PROVISION] ✗ Network error — check WiFi connection.");
  } else {
    Serial.printf("[PROVISION] ✗ Unexpected HTTP %d\n", code);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HTTP HELPERS  (operational mode — uses dynamic token from NVS)
// ─────────────────────────────────────────────────────────────────────────────
static WiFiClientSecure g_tlsClient;

static int httpPost(const char* url, const char* body, String* respOut = nullptr) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  HTTPClient http;
  g_tlsClient.setInsecure();
  http.begin(g_tlsClient, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key",    g_deviceToken);  // token from NVS
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
  http.addHeader("X-API-Key", g_deviceToken);
  http.setTimeout(HTTP_TIMEOUT_MS);
  int code = http.GET();
  if (respOut && code > 0) *respOut = http.getString();
  http.end();
  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SLAVE REGISTRY  (in-RAM, boxId → MAC)
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
//  CLOUD API CALLS
// ─────────────────────────────────────────────────────────────────────────────

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
  int code = httpPost(API_BASE "/espnow/heartbeat", buf);
  Serial.printf("[HB] Master → Cloud: HTTP %d\n", code);
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
  int code = httpPost(API_BASE "/espnow/discover", buf, &resp);
  Serial.printf("[DISCOVER→Cloud] %s  HTTP %d\n", slaveBoxId, code);
}

static void postSlaveHeartbeat(JsonDocument& d, const char* mac) {
  d["masterId"] = BOX_ID;
  d["pondId"]   = g_pondId;
  d["mac"]      = mac;
  char buf[512];
  serializeJson(d, buf, sizeof(buf));
  int code = httpPost(API_BASE "/espnow/heartbeat", buf);
  Serial.printf("[HB→Cloud] %s  HTTP %d\n", d["boxId"] | "?", code);
}

static void postSensorReading(JsonDocument& d, const char* mac) {
  d["masterId"] = BOX_ID;
  d["pondId"]   = g_pondId;
  d["mac"]      = mac;
  char buf[768];
  serializeJson(d, buf, sizeof(buf));
  int code = httpPost(API_BASE "/espnow/reading", buf);
  Serial.printf("[READING→Cloud] %s  HTTP %d\n", d["boxId"] | "?", code);
}

static void postCommandConfirm(JsonDocument& d) {
  d["masterId"] = BOX_ID;
  d["pondId"]   = g_pondId;
  char buf[256];
  serializeJson(d, buf, sizeof(buf));
  int code = httpPost(API_BASE "/espnow/confirm", buf);
  Serial.printf("[CONFIRM→Cloud] cmdId=%s  HTTP %d\n", d["cmdId"] | "?", code);
}

// ─────────────────────────────────────────────────────────────────────────────
//  ESP-NOW DISPATCH TO SLAVES
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
      // Double-flash LED on successful dispatch
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
//  CLOUD COMMAND POLL  (every 5 s)
// ─────────────────────────────────────────────────────────────────────────────
static void pollAndDispatchCommands() {
  char url[200];
  snprintf(url, sizeof(url),
    "%s/espnow/commands/%s?status=pending&limit=10", API_BASE, g_pondId.c_str());

  String resp;
  int code = httpGet(url, &resp);
  if (code != 200) {
    Serial.printf("[POLL] Commands HTTP %d\n", code);
    return;
  }

  DynamicJsonDocument cmds(4096);
  if (deserializeJson(cmds, resp)) return;

  int dispatched = 0;
  for (JsonObject cmd : cmds.as<JsonArray>()) {
    const char* cmdId    = cmd["_id"]         | "";
    const char* targetId = cmd["targetBoxId"] | "";
    const char* action   = cmd["action"]      | "";
    int speed  = cmd["params"]["speed"]           | 0;
    int durMin = cmd["params"]["durationMinutes"] | 0;
    if (!strlen(targetId) || !strlen(action)) continue;

    bool ok = dispatchCommandToSlave(targetId, action, cmdId, speed, durMin);
    if (!ok) {
      StaticJsonDocument<200> fail;
      fail["cmdId"]   = cmdId;
      fail["success"] = false;
      fail["reason"]  = "Slave unreachable";
      postCommandConfirm(fail);
    }
    dispatched++;
  }
  if (dispatched) Serial.printf("[POLL] Dispatched %d command(s)\n", dispatched);
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
  if (next == g_rxTail) return;   // Queue full — drop
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

  g_apSsid = String("AquaGrow-") + BOX_ID;

  Serial.println("\n=========================================");
  Serial.println("  AquaGrow MASTER BOX  v2.0");
  Serial.printf ("  Box ID      : %s\n", BOX_ID);
  Serial.printf ("  Device Type : %s\n", DEVICE_TYPE);
  Serial.printf ("  Setup AP    : %s\n", g_apSsid.c_str());
  Serial.println("=========================================\n");

  pinMode(LED_PIN,        OUTPUT);
  pinMode(RESET_BTN_GPIO, INPUT_PULLUP);
  digitalWrite(LED_PIN, LOW);

  // ── Load NVS ──────────────────────────────────────────────────────────────
  loadFromNVS();

#if USE_TEST_WIFI
  // ── DEV OVERRIDE: auto-inject test WiFi into NVS if not already set ────────
  if (g_ssid != TEST_SSID) {
    Serial.println("[DEV] USE_TEST_WIFI — writing test credentials to NVS");
    saveWifiCredentials(TEST_SSID, TEST_PASSWORD);
    g_ssid     = TEST_SSID;
    g_password = TEST_PASSWORD;
    Serial.printf("[DEV] SSID set to: %s\n", TEST_SSID);
  }
  // Also inject token + pondId if provided (skips /api/device/provision)
  #if defined(TEST_TOKEN) && defined(TEST_POND_ID)
  if (strlen(TEST_TOKEN) > 0 && strlen(TEST_POND_ID) > 0) {
    if (g_deviceToken != TEST_TOKEN || g_pondId != TEST_POND_ID) {
      Serial.println("[DEV] Injecting TEST_TOKEN + TEST_POND_ID into NVS");
      saveProvisionData(TEST_POND_ID, TEST_TOKEN);
    }
  }
  #endif
#endif

  bool hasWifi  = (g_ssid.length() > 0);
  bool hasToken = (g_deviceToken.length() > 0 && g_pondId.length() > 0);

  // ── No WiFi credentials → AP Mode ────────────────────────────────────────
  if (!hasWifi) {
    g_state = STATE_AP_MODE;
    startAPMode();
    return;   // loop() handles AP from here
  }

  // ── Has WiFi → Connect ────────────────────────────────────────────────────
  Serial.printf("[BOOT] WiFi credentials found: %s\n", g_ssid.c_str());
  connectWifi();

  // ── No device token → Provision ──────────────────────────────────────────
  if (!hasToken && WiFi.status() == WL_CONNECTED) {
    Serial.println("[BOOT] No provisioning token — contacting cloud...");
    int attempts = 0;
    while (!provisionDevice() && attempts < 5) {
      attempts++;
      Serial.printf("[BOOT] Provisioning retry %d/5 in 10 s...\n", attempts);
      for (int s = 0; s < 10; s++) {
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        delay(1000);
      }
    }
    if (g_pondId.length() == 0) {
      Serial.println("[BOOT] ─────────────────────────────────────────────");
      Serial.println("[BOOT] Provisioning failed after 5 attempts.");
      Serial.println("[BOOT] Check that BOX_ID is registered in the app.");
      Serial.println("[BOOT] Will retry provisioning on next cloud poll.");
      Serial.println("[BOOT] ─────────────────────────────────────────────");
    }
  }

  // ── Start ESP-NOW ─────────────────────────────────────────────────────────
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] esp_now_init() failed — rebooting in 5 s");
    delay(5000);
    ESP.restart();
  }
  esp_now_register_recv_cb(onDataRecv);

  // Broadcast peer (for sending PAIR_ACK to new slaves)
  esp_now_peer_info_t bcast = {};
  memset(bcast.peer_addr, 0xFF, 6);
  bcast.channel = 0;
  bcast.encrypt = false;
  esp_now_add_peer(&bcast);

  g_state = STATE_OPERATIONAL;

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

  // ── AP Mode — serve web requests ──────────────────────────────────────────
  if (g_state == STATE_AP_MODE) {
    g_dnsServer.processNextRequest();
    g_webServer.handleClient();
    // Slow heartbeat blink = AP alive
    digitalWrite(LED_PIN, (millis() / 800) % 2 ? HIGH : LOW);
    return;
  }

  // ── Operational Mode ──────────────────────────────────────────────────────
  uint32_t now = millis();
  static uint32_t lastPoll  = 0;
  static uint32_t lastHB    = 0;
  static uint32_t lastPing  = 0;
  static uint32_t lastRetry = 0;

  // Process ESP-NOW messages received since last loop
  processRxQueue();

  // WiFi watchdog — reconnect if lost
  if (WiFi.status() != WL_CONNECTED) {
    g_wifiOk = false;
    if (now - lastRetry >= 10000) {
      Serial.println("[WiFi] Lost — reconnecting...");
      WiFi.reconnect();
      lastRetry = now;
    }
    return;
  }
  if (!g_wifiOk) {
    g_wifiOk = true;
    Serial.println("[WiFi] Reconnected!");
    digitalWrite(LED_PIN, HIGH);
  }

  // If provisioning never completed, retry once per minute
  if (g_pondId.length() == 0) {
    if (now - lastRetry >= 60000) {
      Serial.println("[PROVISION] Retrying provisioning...");
      provisionDevice();
      lastRetry = now;
    }
    return;
  }

  // Normal cloud operations
  if (now - lastPoll >= CLOUD_POLL_INTERVAL_MS)  { pollAndDispatchCommands(); lastPoll = now; }
  if (now - lastHB   >= MASTER_HEARTBEAT_MS)     { postMasterHeartbeat();     lastHB   = now; }
  if (now - lastPing >= SLAVE_PING_INTERVAL_MS)  { pingAllSlaves();           lastPing = now; }
}
