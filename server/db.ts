import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// --- MOCK DATABASE FALLBACK ---
const MOCK_DB_PATH = path.join(process.cwd(), 'server', 'db.json');

const loadMockDB = () => {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify({ users: [], subscriptions: [], ponds: [], feedLogs: [], medicineLogs: [], refreshTokens: [] }, null, 2));
  }
  const db = JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8'));
  if (!db.feedLogs) db.feedLogs = [];
  if (!db.medicineLogs) db.medicineLogs = [];
  if (!db.waterLogs) db.waterLogs = [];
  if (!db.sopLogs) db.sopLogs = [];
  if (!db.expenses) db.expenses = [];
  if (!db.refreshTokens) db.refreshTokens = [];
  return db;
};

const saveMockDB = (data: any) => {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
};

let isUsingMock = false;

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
  }
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

// --- MOCK WRAPPERS ---
export const MockDB = {
  findOne: async (collection: string, query: any) => {
    const db = loadMockDB();
    const result = db[collection].find((item: any) => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
    return result;
  },
  find: async (collection: string, query: any) => {
    const db = loadMockDB();
    return db[collection].filter((item: any) => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  },
  save: async (collection: string, data: any) => {
    const db = loadMockDB();
    const newItem = { ...data, _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: new Date() };
    db[collection].push(newItem);
    saveMockDB(db);
    return newItem;
  },
  findOneAndUpdate: async (collection: string, query: any, update: any) => {
    const db = loadMockDB();
    const index = db[collection].findIndex((item: any) => {
      return Object.keys(query).every(key => item[key] == query[key]);
    });
    if (index === -1) {
       // Optional: Insert if upsert? For now just return null
       return null;
    }
    db[collection][index] = { ...db[collection][index], ...update, updatedAt: new Date() };
    saveMockDB(db);
    return db[collection][index];
  },
  delete: async (collection: string, query: any) => {
    const db = loadMockDB();
    const initialLength = db[collection].length;
    db[collection] = db[collection].filter((item: any) => {
      // Logic for delete: remove items matching the query
      return !Object.keys(query).every(key => item[key] == query[key]);
    });
    saveMockDB(db);
    return db[collection].length < initialLength;
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://syamkdoram_db_user:xVMRfYAFMYYZvLzT@ac-k6ux81i-shard-00-00.mongodb.net:27017,ac-k6ux81i-shard-00-01.mongodb.net:27017,ac-k6ux81i-shard-00-02.mongodb.net:27017/aquagrow?ssl=true&replicaSet=atlas-k6ux81i-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB Connected Successfully');
    isUsingMock = false;
  } catch (error) {
    console.error('CRITICAL MONGODB ERROR: Failed to connect to your Database!');
    console.error('Make sure your computer IP address is whitelisted in MongoDB Atlas and the password is correct.');
    console.warn('Falling back to local mock DB temporarily to keep server alive.');
    isUsingMock = true;
  }
};

export const isMock = () => isUsingMock;
