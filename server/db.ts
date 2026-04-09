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
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  location: { type: String },
  farmSize: { type: Number, default: 0 },
  language: { type: String, default: 'English' },
  role: { type: String, enum: ['farmer', 'admin', 'provider'], default: 'farmer' },
  subscriptionStatus: { type: String, enum: ['free', 'pro'], default: 'free' },
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

export const User = mongoose.model('User', UserSchema);
export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export const Pond = mongoose.model('Pond', PondSchema);
export const FeedLog = mongoose.model('FeedLog', FeedLogSchema);
export const MedicineLog = mongoose.model('MedicineLog', MedicineLogSchema);
export const WaterLog = mongoose.model('WaterLog', WaterLogSchema);
export const SOPLog = mongoose.model('SOPLog', SOPLogSchema);
export const Expense = mongoose.model('Expense', ExpenseSchema);
export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
export const HarvestRequest = mongoose.model('HarvestRequest', HarvestRequestSchema);


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
