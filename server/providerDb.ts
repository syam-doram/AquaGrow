import mongoose, { Connection } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
//  PROVIDER DATABASE — aquagrow_providers
//  A completely separate MongoDB database from the farmer DB (aquagrow).
//  Uses the same Atlas cluster but a different database name so collections
//  are fully isolated. The only shared identity is the userId (ObjectId string)
//  which links a ProviderProfile back to the shared User auth record.
// ─────────────────────────────────────────────────────────────────────────────

let providerConn: Connection | null = null;

// ── Schemas ──────────────────────────────────────────────────────────────────

/** Extended profile for providers — stored in providers DB, not farmer DB */
const ProviderProfileSchema = new mongoose.Schema({
  userId:       { type: String, required: true, unique: true }, // mirrors User._id from farmer DB
  companyName:  { type: String, required: true },
  ownerName:    { type: String },
  phone:        { type: String },
  email:        { type: String },
  location:     { type: String },
  address:      { type: String },
  gstNumber:    { type: String },
  categories:   [{ type: String }],          // ['seed', 'feed', 'medicine', 'utility']
  coverageArea: { type: String },            // e.g. "Nellore, Bhimavaram"
  isVerified:   { type: Boolean, default: false },
  rating:       { type: Number, default: 0 },
  fcmToken:     { type: String },
  theme:        { type: String, enum: ['light', 'dark', 'midnight'], default: 'dark' },
  language:     { type: String, default: 'English' },
}, { timestamps: true });

/** Inventory items owned by provider */
const ProviderInventorySchema = new mongoose.Schema({
  providerId:  { type: String, required: true, index: true },
  name:        { type: String, required: true },
  category:    { type: String, enum: ['seed', 'feed', 'medicine', 'utility'], required: true },
  sku:         { type: String },
  price:       { type: Number, required: true },
  unit:        { type: String, default: 'per unit' },   // 'per PL' | 'per bag' | 'per kit'
  stock:       { type: Number, default: 0 },
  minStock:    { type: Number, default: 0 },            // low-stock threshold
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

/** Orders placed by farmers (linked to provider) */
const ProviderOrderSchema = new mongoose.Schema({
  providerId:  { type: String, required: true, index: true },
  farmerId:    { type: String, required: true },          // User._id of the farmer
  farmerName:  { type: String },
  farmerPhone: { type: String },
  location:    { type: String },
  items: [{
    inventoryId: String,
    name:     String,
    category: String,
    qty:      String,
    price:    Number,
    subtotal: Number,
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  note:        { type: String },
  deliveredAt: { type: Date },
  cancelReason:{ type: String },
}, { timestamps: true });

/** Market rate cards posted by provider */
const ProviderRateCardSchema = new mongoose.Schema({
  providerId:  { type: String, required: true, index: true },
  inventoryId: { type: String },              // optional link to inventory item
  item:        { type: String, required: true },
  category:    { type: String, enum: ['seed', 'feed', 'medicine', 'utility'], required: true },
  price:       { type: Number, required: true },
  prevPrice:   { type: Number },
  unit:        { type: String, default: 'per unit' },
  note:        { type: String },
  effectiveDate: { type: String },            // ISO date string
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, { timestamps: true });

/** Chat threads between provider and individual farmers */
const ProviderChatSchema = new mongoose.Schema({
  providerId: { type: String, required: true, index: true },
  farmerId:   { type: String, required: true },
  farmerName: { type: String },
  farmerPhone:{ type: String },
  messages: [{
    from:     { type: String, enum: ['provider', 'farmer'], required: true },
    text:     { type: String, required: true },
    sentAt:   { type: Date, default: Date.now },
    isRead:   { type: Boolean, default: false },
  }],
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

/** Financial ledger entries for provider */
const ProviderLedgerSchema = new mongoose.Schema({
  providerId: { type: String, required: true, index: true },
  type:       { type: String, enum: ['credit', 'debit'], required: true },
  desc:       { type: String, required: true },
  amount:     { type: Number, required: true },
  date:       { type: String, required: true },   // ISO date string
  mode:       { type: String, enum: ['UPI', 'Bank', 'Cash', 'COD', 'NEFT', 'Cheque', 'Other'], default: 'UPI' },
  category:   { type: String },                   // 'seed' | 'feed' | 'medicine' | 'expense' | 'purchase'
  orderId:    { type: String },                   // link to ProviderOrder if applicable
  status:     { type: String, enum: ['pending', 'settled'], default: 'pending' },
  notes:      { type: String },
}, { timestamps: true });

/** Tracked farmers (CRM) linked to provider */
const ProviderFarmerLinkSchema = new mongoose.Schema({
  providerId: { type: String, required: true, index: true },
  farmerId:   { type: String, required: true },
  farmerName: { type: String },
  phone:      { type: String },
  location:   { type: String },
  notes:      { type: String },
  tags:       [String],       // e.g. ['bulk-buyer', 'seed-only']
  totalOrders:{ type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  addedAt:    { type: Date, default: Date.now },
}, { timestamps: true });

// ── Model factories bound to provider connection ──────────────────────────────
// We use connection.model() instead of mongoose.model() so models are
// registered on the provider connection (aquagrow_providers DB), not default.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ProviderProfile:     mongoose.Model<any>;
let ProviderInventory:   mongoose.Model<any>;
let ProviderOrder:       mongoose.Model<any>;
let ProviderRateCard:    mongoose.Model<any>;
let ProviderChat:        mongoose.Model<any>;
let ProviderLedger:      mongoose.Model<any>;
let ProviderFarmerLink:  mongoose.Model<any>;

// ── Connection ────────────────────────────────────────────────────────────────

/**
 * Connect to the separate provider database (aquagrow_providers).
 * Uses the same Atlas cluster as the farmer DB but a different database name.
 * Call this once at server startup alongside connectDB().
 */
export const connectProviderDB = async (): Promise<Connection> => {
  if (providerConn && providerConn.readyState === 1) return providerConn;

  // Derive provider DB URI: replace '/aquagrow?' with '/aquagrow_providers?'
  const farmerUri =
    process.env.MONGODB_URI ||
    'mongodb://syamkdoram_db_user:xVMRfYAFMYYZvLzT@ac-k6ux81i-shard-00-00.mongodb.net:27017,ac-k6ux81i-shard-00-01.mongodb.net:27017,ac-k6ux81i-shard-00-02.mongodb.net:27017/aquagrow?ssl=true&replicaSet=atlas-k6ux81i-shard-0&authSource=admin&retryWrites=true&w=majority';

  // Override the DB name in the URI
  const providerUri = farmerUri.replace(/\/aquagrow(\?|$)/, '/aquagrow_providers$1');

  // Use a separate mongoose connection (not the default) so collections don't bleed
  providerConn = mongoose.createConnection(providerUri, {
    serverSelectionTimeoutMS: 8000,
  });

  await providerConn.asPromise();
  console.log('✅ Provider DB Connected — aquagrow_providers');

  // Register models on this connection
  ProviderProfile    = providerConn.model('ProviderProfile',    ProviderProfileSchema);
  ProviderInventory  = providerConn.model('ProviderInventory',  ProviderInventorySchema);
  ProviderOrder      = providerConn.model('ProviderOrder',      ProviderOrderSchema);
  ProviderRateCard   = providerConn.model('ProviderRateCard',   ProviderRateCardSchema);
  ProviderChat       = providerConn.model('ProviderChat',       ProviderChatSchema);
  ProviderLedger     = providerConn.model('ProviderLedger',     ProviderLedgerSchema);
  ProviderFarmerLink = providerConn.model('ProviderFarmerLink', ProviderFarmerLinkSchema);

  return providerConn;
};

/** Guard: returns true if provider DB is online */
export const isProviderDbReady = () =>
  providerConn !== null && providerConn.readyState === 1;

// Named exports for use in routes
export {
  ProviderProfile,
  ProviderInventory,
  ProviderOrder,
  ProviderRateCard,
  ProviderChat,
  ProviderLedger,
  ProviderFarmerLink,
};
