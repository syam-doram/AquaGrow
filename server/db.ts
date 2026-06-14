import mongoose from 'mongoose';


// --- MONGODB SCHEMA ---
const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  planName: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  features: [String],
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // NOTE: phoneNumber is NOT globally unique — the compound index below
  // enforces uniqueness per ROLE so the same phone can register as both
  // a farmer AND a service provider independently.
  phoneNumber: { type: String, required: true },
  email: { type: String },
  password: { type: String, required: true },
  location: { type: String },
  farmSize: { type: Number, default: 0 },
  language: { type: String, default: 'English' },
  theme: { type: String, enum: ['light', 'dark', 'midnight'], default: 'dark' },
  // User collection is ONLY for farmers and service providers.
  // Admin users live in the separate `adminusers` collection (see AdminUser model below).
  role: { type: String, enum: ['farmer', 'provider'], default: 'farmer' },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'pro', 'pro_silver', 'pro_gold', 'pro_diamond'],
    default: 'free'
  },
  subscriptionExpiry: { type: String },          // ISO date string
  fcmToken: { type: String },
  notifications: {
    water: { type: Boolean, default: true },
    feed: { type: Boolean, default: true },
    market: { type: Boolean, default: false }
  },
  completedReminders: [String],
  notificationHistory: [{
    id: String,
    title: String,
    body: String,
    type: { type: String, default: 'alert' },
    date: { type: String },
    isRead: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Compound unique index: same phone can exist once per role
// (a farmer can also be a provider with the same phone number)
UserSchema.index({ phoneNumber: 1, role: 1 }, { unique: true });



const PondSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number },
  stockingDate: { type: String },
  seedCount: { type: Number },
  seedSource: { type: String },
  species: { type: String, enum: ['Vannamei', 'Tiger'], default: 'Vannamei' },
  status: { type: String, enum: ['active', 'harvested', 'archive', 'planned', 'harvest_pending'], default: 'active' },
  harvestData: { type: Map, of: String },
  waterType: { type: String, default: 'Borewell' },
  initialSalinity: { type: Number, default: 0 },
  aeratorSnoozedUntil: { type: String },
  // Current aerator state + cumulative logs
  aerators: {
    count:       { type: Number, default: 0 },
    hp:          { type: Number, default: 1 },
    positions:   [{ type: String }],
    addedNew:    { type: Boolean, default: false },
    lastUpdated: { type: String },
    lastDoc:     { type: Number, default: 0 },
    log: [{
      doc:       { type: Number },
      date:      { type: String },
      count:     { type: Number },
      hp:        { type: Number },
      positions: [{ type: String }],
      addedNew:  { type: Boolean, default: false },
      notes:     { type: String },
    }],
  },
}, { timestamps: true });

// Separate aerator log collection for cross-pond queries & history
const AeratorLogSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  pondId:    { type: String, required: true },
  pondName:  { type: String },
  doc:       { type: Number, required: true },
  date:      { type: String },
  count:     { type: Number },
  hp:        { type: Number },
  positions: [{ type: String }],
  addedNew:  { type: Boolean, default: false },
  notes:     { type: String },
  sopMet:    { type: Boolean, default: false },    // was count >= recommended?
  recommended: { type: Number },                   // recommended at time of log
  source:    { type: String, default: 'pond_detail' }, // 'pond_detail' | 'alert_confirm'
}, { timestamps: true });


const FeedLogSchema = new mongoose.Schema({
  pondId:      { type: String, required: true },
  userId:      { type: String, required: true },
  date:        { type: String },
  time:        { type: String },           // slot time e.g. '06:00 AM'
  brand:       { type: String },           // feed brand name
  feedType:    { type: String },           // 'Starter' | 'Grower' | 'Finisher'
  feedNo:      { type: String },           // 'Pellet No. 2' etc.
  quantity:    { type: Number },           // kg applied
  cost:        { type: Number },           // estimated cost (₹)
  doc:         { type: Number },           // day of culture
  slotLabel:   { type: String },           // 'Morning 1', 'Afternoon' etc.
  notes:       { type: String },           // any free-form note
  fcr:         { type: Number },           // FCR value at time of logging
  adjustmentFactor: { type: Number },      // lunar/weather adjustment applied
}, { timestamps: true });

const MedicineLogSchema = new mongoose.Schema({
  pondId:        { type: String, required: true },
  userId:        { type: String, required: true },
  date:          { type: String },
  name:          { type: String },           // product / medicine name
  category:      { type: String },           // 'probiotic' | 'antibiotic' | 'mineral' | 'pond_prep' | 'supplement'
  dosage:        { type: String },           // dose string e.g. '2 kg/acre'
  dosageKg:      { type: Number },           // numeric kg
  applicationMethod: { type: String },       // 'broadcast' | 'dissolved'
  purpose:       { type: String },           // reason for application
  doc:           { type: Number },           // day of culture
  notes:         { type: String },
  soakedInWater: { type: Boolean },
  appliedAt:     { type: String },           // time of application
  sopTag:        { type: String },           // which SOP triggered this log
}, { timestamps: true });

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expiryDate: { type: Date, required: true }
}, { timestamps: true });

const WaterLogSchema = new mongoose.Schema({
  pondId:       { type: String, required: true },
  userId:       { type: String, required: true },
  date:         { type: String, required: true },
  time:         { type: String },              // time of reading
  ph:           { type: Number },
  do:           { type: Number },              // dissolved oxygen mg/L
  temp:         { type: Number },              // °C
  temperature:  { type: Number },              // alias for temp (backward compat)
  salinity:     { type: Number },              // ppt
  ammonia:      { type: Number },              // mg/L
  alkalinity:   { type: Number },              // mg/L
  turbidity:    { type: Number },              // NTU / Secchi
  tds:          { type: Number },
  nitrite:      { type: Number },
  nitrate:      { type: Number },
  mortality:    { type: Number },              // count of dead shrimp
  waterColor:   { type: String },              // farmer's observation
  notes:        { type: String },
  doc:          { type: Number },
  alerts:       [{ type: String }],            // auto-generated alert strings
  isSynced:     { type: Boolean, default: true }
}, { timestamps: true });

const SOPLogSchema = new mongoose.Schema({
  pondId:       { type: String, required: true },
  userId:       { type: String, required: true },
  date:         { type: String, required: true },
  sopType:      { type: String },              // 'daily' | 'weekly' | 'disease' | 'feed' | 'water'
  doc:          { type: Number },
  avgWeight:    { type: Number },              // g
  feedQty:      { type: Number },              // kg
  mortality:    { type: Number },
  checks:       { type: Map, of: Boolean },    // completed SOP checkboxes
  actions:      [{ type: String }],            // list of actions taken
  notes:        { type: String },
  diseaseFlag:  { type: String },              // if triggered by disease detection
  severity:     { type: String },              // 'safe' | 'warning' | 'critical'
  completedBy:  { type: String },              // user name
  isSynced:     { type: Boolean, default: true }
}, { timestamps: true, strict: false });       // strict:false allows extra dynamic fields

const ExpenseSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: String, required: true },
  category: { type: String },
  categoryLabel: { type: String },
  amount: { type: Number },
  quantity: { type: Number },
  notes: { type: String },
  isSynced: { type: Boolean, default: true }
}, { timestamps: true });

const HarvestRequestSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  userId: { type: String, required: true },
  providerId: { type: String }, // The buyer/agent who accepts
  biomass: { type: Number, required: true },
  avgWeight: { type: Number, required: true },
  targetedBuyers: [String],
  broadcastRadius: { type: Number, default: 150 },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'quality_checked', 'weighed', 'rate_confirmed', 'harvested', 'paid', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  cancellationReason: { type: String },
  qualityReports: [{
    parameter: String,
    value: String,
    status: String,
    date: { type: Date, default: Date.now }
  }],
  finalWeight: { type: Number },
  finalTotal: { type: Number },
  price: { type: Number }, // confirmed final price per kg
  chatMessages: [{
    senderId: { type: String, required: true },
    senderName: { type: String },
    senderRole: { type: String, enum: ['farmer', 'provider', 'admin'], default: 'farmer' },
    message: { type: String, required: true },
    proposedPrice: { type: Number }, // optional price proposal in message
    timestamp: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

const ROIEntrySchema = new mongoose.Schema({
  userId:              { type: String, required: true },
  pondId:              { type: String, required: true },
  harvestDate:         { type: String },
  harvestWeightKg:     { type: Number },
  countPerKg:         { type: Number },
  survivalRate:        { type: Number },
  gradeA:              { type: Number },
  gradeB:              { type: Number },
  // Investments
  seedCost:            { type: Number, default: 0 },
  feedCost:            { type: Number, default: 0 },
  medicineCost:        { type: Number, default: 0 },
  laborCost:           { type: Number, default: 0 },
  utilityCost:         { type: Number, default: 0 },
  infrastructureCost:  { type: Number, default: 0 },
  otherCost:           { type: Number, default: 0 },
  cultureDays:         { type: Number },
  // Revenue
  saleAmountTotal:     { type: Number, default: 0 },
  buyerName:           { type: String },
  pricePerKg:          { type: Number },
  subsidyAmount:       { type: Number, default: 0 },
  notes:               { type: String },
  // Computed
  totalInvested:       { type: Number },
  totalRevenue:        { type: Number },
  netProfit:           { type: Number },
  roi:                 { type: Number },
}, { timestamps: true });

const NotificationLogSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  title:     { type: String },
  body:      { type: String },
  type:      { type: String, default: 'alert' },  // 'alert' | 'harvest' | 'aerator' | 'feed'
  deepLink:  { type: String },
  isRead:    { type: Boolean, default: false },
  date:      { type: String },
}, { timestamps: true });

// ═══════════════════════════════════════════════════════════════
//  ADMIN USER COLLECTION (separate from farmers & providers)               ║
//  Collection name: `adminusers`                                            ║
//  One record = one admin staff member.                                     ║
//  Never mix with `User` (farmers/providers).                               ║
// ═══════════════════════════════════════════════════════════════
export const ADMIN_ROLES_ENUM = [
  'super_admin',
  'finance_admin',
  'operations_admin',
  'sales_admin',
  'support_admin',
  'inventory_admin',
  'technical_admin',
  'hr_admin',
] as const;

export type AdminRoleType = typeof ADMIN_ROLES_ENUM[number];

const AdminUserSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },   // phone is globally unique for admins
  email:       { type: String },
  password:    { type: String, required: true },
  role: {
    type:    String,
    enum:    ADMIN_ROLES_ENUM,
    default: 'super_admin',
  },
  isActive:    { type: Boolean, default: true },      // soft disable without deleting
  location:    { type: String },
  lastLogin:   { type: Date },
  createdBy:   { type: String },                      // _id of admin who created this row
  permissions: [String],                              // optional fine-grained overrides
}, { timestamps: true, collection: 'adminusers' });

export const User      = mongoose.model('User', UserSchema);
export const AdminUser = mongoose.model('AdminUser', AdminUserSchema);
export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export const Pond = mongoose.model('Pond', PondSchema);
export const FeedLog = mongoose.model('FeedLog', FeedLogSchema);
export const MedicineLog = mongoose.model('MedicineLog', MedicineLogSchema);
export const WaterLog = mongoose.model('WaterLog', WaterLogSchema);
export const SOPLog = mongoose.model('SOPLog', SOPLogSchema);
export const Expense = mongoose.model('Expense', ExpenseSchema);
export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
export const HarvestRequest = mongoose.model('HarvestRequest', HarvestRequestSchema);
export const ROIEntry = mongoose.model('ROIEntry', ROIEntrySchema);
export const NotificationLog = mongoose.model('NotificationLog', NotificationLogSchema);
export const AeratorLog = mongoose.model('AeratorLog', AeratorLogSchema);

// ═══════════════════════════════════════════════════════════════
//  ESP-NOW IoT DEVICE SCHEMAS                                    ║
//  Three collections for ESP32 device management:               ║
//    espdevices     — registered Master/Slave ESP32 nodes       ║
//    espsensorreadings — high-frequency telemetry from Master   ║
//    espcommands    — aerator commands (app → Master → Slave)   ║
// ═══════════════════════════════════════════════════════════════

/**
 * EspDevice — one record per registered ESP32 board.
 * Masters are linked directly to a pond; Slaves are linked to a Master.
 * The apiKey is a 64-char hex secret stored on the device and used instead
 * of JWT for all device-facing endpoints.
 */
const EspDeviceSchema = new mongoose.Schema({
  userId:      { type: String, required: true },          // owning farmer
  pondId:      { type: String, required: true },          // associated pond
  mac:         { type: String, required: true, unique: true }, // ESP32 MAC address (AA:BB:CC:DD:EE:FF)
  role:        { type: String, enum: ['master', 'slave'], required: true },
  masterMac:   { type: String },                          // for slaves: the master's MAC
  label:       { type: String },                          // human-readable label e.g. "Aerator 1"
  apiKey:      { type: String, required: true, unique: true }, // 64-char hex secret
  firmwareVersion: { type: String },                      // optional: OTA tracking
  isActive:    { type: Boolean, default: true },
  lastSeen:    { type: Date },                            // updated on every ingest/poll
  heartbeatAt: { type: Date },                            // updated on every /heartbeat call
  // ── Real-time state (updated on every ingest + ACK) ──────────────────────
  aeratorState: { type: String, enum: ['ON', 'OFF', 'UNKNOWN'], default: 'UNKNOWN' }, // live aerator state
  voltage:      { type: Number },                         // last reported voltage (V)
  current:      { type: Number },                         // last reported current (A)
  powerWatts:   { type: Number },                         // last reported power (W)
  signalStrength: { type: Number },                       // RSSI from slave (dBm)
  metadata:    { type: Map, of: String },                 // flexible extra fields
}, { timestamps: true, collection: 'espdevices' });

// Compound index so we can quickly look up all slaves of a master
EspDeviceSchema.index({ masterMac: 1, role: 1 });
EspDeviceSchema.index({ userId: 1, pondId: 1 });

/**
 * EspSensorReading — one record per sensor snapshot pushed by a Master.
 * Kept separate from WaterLog so manual entries and IoT telemetry don't mix.
 * High-frequency: potentially every 30 s per pond.
 */
const EspSensorReadingSchema = new mongoose.Schema({
  deviceId:    { type: String, required: true },          // EspDevice._id (master)
  pondId:      { type: String, required: true },
  userId:      { type: String, required: true },
  // Water quality parameters
  do:          { type: Number },                          // dissolved oxygen mg/L
  ph:          { type: Number },
  temp:        { type: Number },                          // °C
  salinity:    { type: Number },                          // ppt
  ammonia:     { type: Number },                          // mg/L
  turbidity:   { type: Number },                          // NTU
  tds:         { type: Number },                          // mg/L
  nitrite:     { type: Number },
  nitrate:     { type: Number },
  // Power telemetry from Master
  voltage:     { type: Number },                          // V
  current:     { type: Number },                          // A
  powerWatts:  { type: Number },                          // W
  aeratorState: { type: String, enum: ['ON', 'OFF', 'UNKNOWN'] }, // master aerator state at this reading
  // Per-slave data reported by Master via ESP-NOW
  slaveReadings: [{
    mac:          { type: String },                       // slave MAC
    aeratorState: { type: String, enum: ['ON', 'OFF', 'UNKNOWN'] },
    voltage:      { type: Number },
    current:      { type: Number },
    powerWatts:   { type: Number },
    rssi:         { type: Number },                       // ESP-NOW signal strength (dBm)
  }],
  // Status flags auto-computed on ingest
  alerts:      [{ type: String }],                        // e.g. ['DO_LOW', 'PH_HIGH']
  rawPayload:  { type: Map, of: mongoose.Schema.Types.Mixed }, // preserve any extra fields from firmware
  recordedAt:  { type: Date, required: true },            // timestamp from ESP32 (or server time if missing)
}, { timestamps: true, collection: 'espsensorreadings' });

// TTL: auto-delete readings older than 90 days to keep collection lean
EspSensorReadingSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
EspSensorReadingSchema.index({ pondId: 1, recordedAt: -1 });
EspSensorReadingSchema.index({ deviceId: 1, recordedAt: -1 });

/**
 * EspAeratorCommand — a command issued by the farmer app to a specific slave aerator.
 * Lifecycle: pending → sent → confirmed | failed | timeout
 *
 *  pending   : stored by server, waiting for Master to poll
 *  sent      : Master has picked it up and forwarded via ESP-NOW
 *  confirmed : Slave acknowledged execution
 *  failed    : Slave reported failure
 *  timeout   : Master never polled within TTL (5 min default)
 */
const EspAeratorCommandSchema = new mongoose.Schema({
  userId:      { type: String, required: true },          // farmer who issued it
  pondId:      { type: String, required: true },
  masterMac:   { type: String, required: true },          // which master should relay this
  targetMac:   { type: String, required: true },          // slave MAC address
  action:      { type: String, enum: ['ON', 'OFF', 'SPEED', 'RESET'], required: true },
  params: {
    speed:           { type: Number, min: 0, max: 100 },  // % for SPEED command
    durationMinutes: { type: Number },                    // optional timed ON
  },
  status:      {
    type: String,
    enum: ['pending', 'sent', 'confirmed', 'failed', 'timeout'],
    default: 'pending',
  },
  issuedAt:    { type: Date, default: Date.now },
  sentAt:      { type: Date },                            // when Master picked it up
  confirmedAt: { type: Date },                            // when Slave acknowledged
  errorMessage: { type: String },                         // for failed status
  notes:       { type: String },                          // optional note from farmer
}, { timestamps: true, collection: 'espcommands' });

// Index for fast pending poll query
EspAeratorCommandSchema.index({ masterMac: 1, status: 1, issuedAt: 1 });
EspAeratorCommandSchema.index({ pondId: 1, createdAt: -1 });

// ─── EspHeartbeat — lightweight ping log (TTL: 2 hours) ─────────────────────
// One document per heartbeat from a Master. Used for uptime analysis.
// The important online/offline signal lives on EspDevice.lastSeen / heartbeatAt.
const EspHeartbeatSchema = new mongoose.Schema({
  deviceId:  { type: String, required: true },
  pondId:    { type: String, required: true },
  mac:       { type: String, required: true },
  at:        { type: Date, default: Date.now },
}, { timestamps: false, collection: 'espheartbeats' });

// TTL: auto-delete heartbeat docs older than 2 hours
EspHeartbeatSchema.index({ at: 1 }, { expireAfterSeconds: 2 * 60 * 60 });
EspHeartbeatSchema.index({ deviceId: 1, at: -1 });

export const EspDevice          = mongoose.model('EspDevice', EspDeviceSchema);
export const EspSensorReading   = mongoose.model('EspSensorReading', EspSensorReadingSchema);
export const EspAeratorCommand  = mongoose.model('EspAeratorCommand', EspAeratorCommandSchema);
export const EspHeartbeat       = mongoose.model('EspHeartbeat', EspHeartbeatSchema);


export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://syamkdoram_db_user:xVMRfYAFMYYZvLzT@ac-k6ux81i-shard-00-00.mongodb.net:27017,ac-k6ux81i-shard-00-01.mongodb.net:27017,ac-k6ux81i-shard-00-02.mongodb.net:27017/aquagrow?ssl=true&replicaSet=atlas-k6ux81i-shard-0&authSource=admin&retryWrites=true&w=majority';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB Connected — Production Mode');
  } catch (error) {
    console.error('❌ CRITICAL: MongoDB connection failed. Exiting process so the host can restart.');
    console.error(error);
    process.exit(1); // Let Render/PM2 restart automatically
  }
};
