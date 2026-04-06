import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';


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
  status: { type: String, enum: ['active', 'harvested', 'archive'], default: 'active' },
  waterType: { type: String, default: 'Borewell' },
  initialSalinity: { type: Number, default: 0 },
}, { timestamps: true });

const FeedLogSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: String },
  time: { type: String },
  brand: { type: String },
  quantity: { type: Number },
}, { timestamps: true });

const MedicineLogSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: String },
  name: { type: String },
  dosage: { type: String },
  doc: { type: Number },
}, { timestamps: true });

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expiryDate: { type: Date, required: true }
}, { timestamps: true });

const WaterLogSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: String, required: true },
  ph: { type: Number },
  do: { type: Number },
  temperature: { type: Number },
  salinity: { type: Number },
  ammonia: { type: Number },
  alkalinity: { type: Number },
  turbidity: { type: Number },
  mortality: { type: Number },
  isSynced: { type: Boolean, default: true }
}, { timestamps: true });

const SOPLogSchema = new mongoose.Schema({
  pondId: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: String, required: true },
  avgWeight: { type: Number },
  feedQty: { type: Number },
  mortality: { type: Number },
  checks: { type: Map, of: Boolean },
  isSynced: { type: Boolean, default: true }
}, { timestamps: true });

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

export const User = mongoose.model('User', UserSchema);
export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export const Pond = mongoose.model('Pond', PondSchema);
export const FeedLog = mongoose.model('FeedLog', FeedLogSchema);
export const MedicineLog = mongoose.model('MedicineLog', MedicineLogSchema);
export const WaterLog = mongoose.model('WaterLog', WaterLogSchema);
export const SOPLog = mongoose.model('SOPLog', SOPLogSchema);
export const Expense = mongoose.model('Expense', ExpenseSchema);
export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);


export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://syamkdoram_db_user:xVMRfYAFMYYZvLzT@ac-k6ux81i-shard-00-00.mongodb.net:27017,ac-k6ux81i-shard-00-01.mongodb.net:27017,ac-k6ux81i-shard-00-02.mongodb.net:27017/aquagrow?ssl=true&replicaSet=atlas-k6ux81i-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB Connected Successfully (Production Mode)');
  } catch (error) {
    console.error('CRITICAL DATABASE ERROR: Online connection failed.');
    console.error('Server will continue to listen but DB routes will fail until connection is fixed.');
    throw error;
  }
};
