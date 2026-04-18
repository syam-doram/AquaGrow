/**
 * providerDb.ts — UNIFIED DATABASE BRIDGE
 * ─────────────────────────────────────────
 * All provider collections now live in the SAME `aquagrow` database as
 * farmers, ponds, orders, etc. There is ONE database, ONE connection.
 *
 * This file registers provider models on the default mongoose connection
 * (shared with db.ts) so every collection is in the same DB and instantly
 * visible to both the mobile app and the admin panel.
 *
 * Migration note: if you previously had an `aquagrow_providers` database,
 * any existing documents in those collections will need to be migrated into
 * the main `aquagrow` database (one-time Atlas Data Migration or mongodump/restore).
 */

import mongoose from 'mongoose';

// ── Schemas ───────────────────────────────────────────────────────────────────

/** Extended profile for providers — now in the MAIN aquagrow DB */
const ProviderProfileSchema = new mongoose.Schema({
  userId:       { type: String, required: true, unique: true }, // mirrors User._id
  companyName:  { type: String, required: true },
  ownerName:    { type: String },
  phone:        { type: String },
  email:        { type: String },
  location:     { type: String },
  address:      { type: String },
  gstNumber:    { type: String },
  categories:   [{ type: String }],          // ['seed', 'feed', 'medicine', 'utility']
  coverageArea: { type: String },
  isVerified:   { type: Boolean, default: false },
  rating:       { type: Number, default: 0 },
  fcmToken:     { type: String },
  theme:        { type: String, enum: ['light', 'dark', 'midnight'], default: 'dark' },
  language:     { type: String, default: 'English' },
}, { timestamps: true, collection: 'providerprofiles' });

/** Inventory items owned by a provider */
const ProviderInventorySchema = new mongoose.Schema({
  providerId:  { type: String, required: true, index: true },
  name:        { type: String, required: true },
  category:    { type: String, enum: ['seed', 'feed', 'medicine', 'utility'], required: true },
  sku:         { type: String },
  price:       { type: Number, required: true },
  unit:        { type: String, default: 'per unit' },
  stock:       { type: Number, default: 0 },
  minStock:    { type: Number, default: 0 },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true, collection: 'providerinventories' });

/**
 * ProviderOrder — orders placed by farmers directly to a provider.
 * Stored in the SAME database as ShopOrder so admin sees ALL orders in one place.
 */
const ProviderOrderSchema = new mongoose.Schema({
  providerId:  { type: String, required: true, index: true },
  farmerId:    { type: String, required: true },
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
}, { timestamps: true, collection: 'providerorders' });

/** Market rate cards posted by a provider */
const ProviderRateCardSchema = new mongoose.Schema({
  providerId:  { type: String, required: true, index: true },
  inventoryId: { type: String },
  item:        { type: String, required: true },
  category:    { type: String, enum: ['seed', 'feed', 'medicine', 'utility'], required: true },
  price:       { type: Number, required: true },
  prevPrice:   { type: Number },
  unit:        { type: String, default: 'per unit' },
  note:        { type: String },
  effectiveDate: { type: String },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, { timestamps: true, collection: 'providerratecards' });

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
}, { timestamps: true, collection: 'providerchats' });

/** Financial ledger entries for a provider */
const ProviderLedgerSchema = new mongoose.Schema({
  providerId: { type: String, required: true, index: true },
  type:       { type: String, enum: ['credit', 'debit'], required: true },
  desc:       { type: String, required: true },
  amount:     { type: Number, required: true },
  date:       { type: String, required: true },
  mode:       { type: String, enum: ['UPI', 'Bank', 'Cash', 'COD', 'NEFT', 'Cheque', 'Other'], default: 'UPI' },
  category:   { type: String },
  orderId:    { type: String },
  status:     { type: String, enum: ['pending', 'settled'], default: 'pending' },
  notes:      { type: String },
}, { timestamps: true, collection: 'providerledgers' });

/** CRM: tracked farmers linked to a provider */
const ProviderFarmerLinkSchema = new mongoose.Schema({
  providerId: { type: String, required: true, index: true },
  farmerId:   { type: String, required: true },
  farmerName: { type: String },
  phone:      { type: String },
  location:   { type: String },
  notes:      { type: String },
  tags:       [String],
  totalOrders:{ type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  addedAt:    { type: Date, default: Date.now },
}, { timestamps: true, collection: 'providerfarmerlinks' });

// ── Register models on the DEFAULT mongoose connection (shared aquagrow DB) ───
// Using mongoose.models guard to prevent "Cannot overwrite model" errors on hot-reload.

export const ProviderProfile    = mongoose.models['ProviderProfile']
  ?? mongoose.model('ProviderProfile',    ProviderProfileSchema);

export const ProviderInventory  = mongoose.models['ProviderInventory']
  ?? mongoose.model('ProviderInventory',  ProviderInventorySchema);

export const ProviderOrder      = mongoose.models['ProviderOrder']
  ?? mongoose.model('ProviderOrder',      ProviderOrderSchema);

export const ProviderRateCard   = mongoose.models['ProviderRateCard']
  ?? mongoose.model('ProviderRateCard',   ProviderRateCardSchema);

export const ProviderChat       = mongoose.models['ProviderChat']
  ?? mongoose.model('ProviderChat',       ProviderChatSchema);

export const ProviderLedger     = mongoose.models['ProviderLedger']
  ?? mongoose.model('ProviderLedger',     ProviderLedgerSchema);

export const ProviderFarmerLink = mongoose.models['ProviderFarmerLink']
  ?? mongoose.model('ProviderFarmerLink', ProviderFarmerLinkSchema);

// ── Compatibility shims ───────────────────────────────────────────────────────
// connectProviderDB is no longer needed (we use the shared mongoose connection)
// but is kept as a no-op so existing import sites don't break.
export const connectProviderDB = async () => {
  // No-op: provider models now use the default mongoose connection (aquagrow DB).
  // The connection is established by connectDB() in db.ts at server startup.
  console.log('[ProviderDB] Using shared aquagrow DB — no separate connection needed.');
  return mongoose.connection;
};

/** Always returns true when main DB is connected */
export const isProviderDbReady = () =>
  mongoose.connection.readyState === 1;
