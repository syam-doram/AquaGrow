import express, { Request } from 'express';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    [key: string]: any;
  };
}
import mongoose from 'mongoose';
import cors from 'cors';
import { User as UserMongo, AdminUser as AdminUserMongo, Subscription as SubscriptionMongo, RefreshToken, connectDB, Pond as PondMongo, FeedLog as FeedLogMongo, MedicineLog as MedicineLogMongo, WaterLog as WaterLogMongo, SOPLog as SOPLogMongo, Expense as ExpenseMongo, HarvestRequest, ROIEntry as ROIEntryMongo, NotificationLog as NotificationLogMongo, AeratorLog as AeratorLogMongo } from './db.js';
import { apiLimiter, authenticate, requireRole, requireAnyAdmin, requireSuperAdmin, requireSelf, isAdminRole } from './middleware/auth.js';
import { GoogleGenAI } from "@google/genai";
import authRoutes    from './routes/auth.js';
import providerRoutes from './routes/provider.js';
import { connectProviderDB, isProviderDbReady } from './providerDb.js';


const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3005;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const ALLOWED_ORIGINS = [
  'https://aquagrow.onrender.com',
  'https://aqua-grow.vercel.app',
  'https://aquagrow-admin.vercel.app',   // old Vercel URL (keep for safety)
  'https://aquagrowadmin.vercel.app',    // ✅ actual deployed Vercel URL
  'http://localhost:3000',               // Admin panel (Vite dev)
  'http://localhost:5173',              // Admin panel (Vite dev)
  'http://localhost:4173',              // Admin panel (Vite preview)
  'http://localhost:3005',              // Local backend direct
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Always allow Capacitor / Ionic WebView (Android = https://localhost, iOS = capacitor://localhost)
    if (
      origin === 'https://localhost' ||
      origin === 'http://localhost'  ||
      origin.startsWith('capacitor://') ||
      origin.startsWith('ionic://')     ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('https://localhost:')
    ) return callback(null, true);
    // Allow known production domains
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Block everything else
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Use modular routes
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/provider', providerRoutes);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({
    status: 'ok',
    farmerDb:   mongoose.connection.readyState,   // 1 = connected (aquagrow)
    providerDb: isProviderDbReady() ? 1 : 0,      // 1 = connected (aquagrow_providers)
  })
);

// ─── App Version Management ───────────────────────────────────────────────────
// ✅ HOW TO RELEASE A NEW VERSION:
//    1. Bump LATEST_APP_VERSION to the new version string  (e.g., "1.1.0")
//    2. If this is a SECURITY / CRITICAL hotfix, also bump MIN_APP_VERSION
//       so older clients are FORCED to update.
//    3. Add a line to RELEASE_NOTES describing the key changes.
//    4. Update CURRENT_APP_VERSION in src/hooks/useAppUpdate.ts to match the new APK.
//    5. Build & deploy the server. The mobile app will auto-detect on next launch.
// ─────────────────────────────────────────────────────────────────────────────
const LATEST_APP_VERSION = '1.0.0';    // ← bump when you publish a new APK
const MIN_APP_VERSION    = '1.0.0';    // ← bump only for forced/critical updates

const RELEASE_NOTES: string[] = [
  'Initial release — full AquaGrow farm management suite',
  'Feed tray monitoring with DOC 20 activation flow',
  'Medicine SOP scheduler with lunar cycle integration',
  'ROI entry with harvest size validation (min 10g ABW)',
];

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aquagrow.app';

app.get('/api/app-version', (_req, res) => {
  res.json({
    latestVersion: LATEST_APP_VERSION,
    minVersion:    MIN_APP_VERSION,
    releaseNotes:  RELEASE_NOTES,
    updateUrl:     PLAY_STORE_URL,
    publishedAt:   '2026-04-12T00:00:00Z',
  });
});

// ═══════════════════════════════╗
//  SUBSCRIPTION                  ║
// ═══════════════════════════════╝

// ─── DB health guard (used in push routes that must read user) ────────────────
const dbOffline = (res: any) =>
  res.status(503).json({ error: 'Database unavailable. Please try again later.' });

// Plan name → subscriptionStatus mapping
const PLAN_STATUS_MAP: Record<string, string> = {
  free:         'free',
  pro:          'pro',
  pro_silver:   'pro_silver',
  pro_gold:     'pro_gold',
  pro_diamond:  'pro_diamond',
  // Aliases for UI plan names (e.g. 'aqua_9_diamond')
  aqua_1:       'pro',
  aqua_3:       'pro_silver',
  aqua_6:       'pro_gold',
  aqua_9:       'pro_diamond',
  enterprise:   'pro_diamond',
};

const PLAN_FEATURES_MAP: Record<string, string[]> = {
  free:        ['basic_dashboard', 'pond_management'],
  pro:         ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics'],
  pro_silver:  ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics', 'live_monitor'],
  pro_gold:    ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics', 'live_monitor', 'market_trends', 'expert_consultation'],
  pro_diamond: ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics', 'live_monitor', 'market_trends', 'expert_consultation', 'unlimited_scans', 'priority_support'],
  aqua_1:      ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics'],
  aqua_3:      ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics', 'live_monitor'],
  aqua_6:      ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics', 'live_monitor', 'market_trends', 'expert_consultation'],
  aqua_9:      ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics', 'live_monitor', 'market_trends', 'expert_consultation', 'unlimited_scans', 'priority_support'],
  enterprise:  ['basic_dashboard', 'pond_management', 'ai_scans', 'advanced_analytics', 'live_monitor', 'market_trends', 'expert_consultation', 'unlimited_scans', 'priority_support'],
};

app.post('/api/subscription/upgrade', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { planName } = req.body;
    if (!planName) return res.status(400).json({ error: 'planName is required' });
    const userId = req.user.id;

    const subscriptionStatus = PLAN_STATUS_MAP[planName] ?? 'pro';
    const features = PLAN_FEATURES_MAP[planName] ?? PLAN_FEATURES_MAP['pro'];
    const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const sub = await SubscriptionMongo.findOneAndUpdate(
      { userId },
      { planName, features, status: 'active', endDate: end },
      { upsert: true, new: true }
    );
    await UserMongo.findByIdAndUpdate(userId, { subscriptionStatus });
    res.json({ ...sub.toObject(), subscriptionStatus });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/:userId/subscription', authenticate, requireSelf, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    let sub = await SubscriptionMongo.findOne({ userId });
    if (!sub) {
      const defaultSub = { userId, planName: 'free', status: 'active', features: ['basic_dashboard', 'pond_management'], startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) };
      sub = await new SubscriptionMongo(defaultSub).save();
    }
    res.json(sub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  NOTIFICATIONS                 ║
// ═══════════════════════════════╝

app.put('/api/user/:userId/notifications', authenticate, requireSelf, async (req, res) => {
  try {
    const { fcmToken, notifications } = req.body;
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const user = await UserMongo.findByIdAndUpdate(req.params.userId, { fcmToken, notifications }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/user/:userId', authenticate, requireSelf, async (req, res) => {
  try {
    const userId = req.params.userId;
    const updates = req.body;

    // Safety: don't allow password or role updates via this endpoint
    delete updates.password;
    delete updates.role;
    delete updates.phoneNumber; // Phone is fixed for now

    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const user = await UserMongo.findByIdAndUpdate(userId, updates, { new: true });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  PONDS                         ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/ponds', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const ponds = await PondMongo.find({ userId: req.params.userId });
    res.json(ponds);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ponds', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    res.json(await new PondMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/ponds/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const pond = await PondMongo.findById(id);
    if (!pond) return res.status(404).json({ error: 'Pond not found' });
    if (String(pond.userId) !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
    await PondMongo.findByIdAndDelete(id);
    await FeedLogMongo.deleteMany({ pondId: id });
    await MedicineLogMongo.deleteMany({ pondId: id });
    await WaterLogMongo.deleteMany({ pondId: id });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/ponds/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const pond = await PondMongo.findById(id);
    if (!pond) return res.status(404).json({ error: 'Pond not found' });
    if (String(pond.userId) !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
    
    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const updated = await PondMongo.findByIdAndUpdate(id, req.body, { new: true });

    // ── If aerators were updated, also write to AeratorLog collection ────────
    if (req.body.aerators) {
      const a = req.body.aerators;
      // Get the newest log entry (the one just added)
      const latestLog = Array.isArray(a.log) ? a.log[a.log.length - 1] : null;
      if (latestLog) {
        const recommended = Math.ceil((pond.size || 0) * 4);
        await new AeratorLogMongo({
          userId:      req.user.id,
          pondId:      id,
          pondName:    (pond as any).name || '',
          doc:         latestLog.doc,
          date:        latestLog.date || new Date().toISOString(),
          count:       latestLog.count,
          hp:          latestLog.hp,
          positions:   latestLog.positions || [],
          addedNew:    latestLog.addedNew || false,
          notes:       latestLog.notes || '',
          sopMet:      (latestLog.count || 0) >= recommended,
          recommended,
          source:      'pond_detail',
        }).save();
      }
    }

    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});


// ═══════════════════════════════╗
// ═══════════════════════════════╗
//  ROI ENTRIES                   ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/roi-entries', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const filter: any = { userId: req.params.userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;
    const entries = await ROIEntryMongo.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(entries);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/roi-entries', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const entry = await new ROIEntryMongo(data).save();
    res.json(entry);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/roi-entries/:id', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await ROIEntryMongo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  NOTIFICATION HISTORY          ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/notifications', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const logs = await NotificationLogMongo.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notifications', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const log = await new NotificationLogMongo(data).save();
    res.json(log);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/notifications/mark-read', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await NotificationLogMongo.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  AERATOR LOGS                  ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/aerator-logs', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const filter: any = { userId: req.params.userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;
    const logs = await AeratorLogMongo.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/aerator-logs/:id', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await AeratorLogMongo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  WATER LOGS                    ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/water-logs', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const filter: any = { userId: req.params.userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;
    const logs = await WaterLogMongo.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/water-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    res.json(await new WaterLogMongo(data).save());
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/water-logs/:id', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await WaterLogMongo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});;

// ═══════════════════════════════╗
//  HARVEST REQUESTS (MARKET)     ║
// ═══════════════════════════════╝

app.get('/api/harvest-requests', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    
    let query = {};
    if (req.user.role === 'farmer') {
      query = { userId: req.user.id };
    } else if (req.user.role === 'provider') {
      // For now, providers see all pending or their accepted ones
      query = { $or: [{ status: 'pending' }, { providerId: req.user.id }] };
    }
    
    const requests = await HarvestRequest.find(query).sort({ createdAt: -1 });
    res.json(requests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/harvest-requests', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id, status: 'pending' };
    
    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const request = await new HarvestRequest(data).save();
    
    // BROADCAST LOGIC: Notify nearby providers (within 150km)
    // In a real app, we would use $near sphere or a geo-spatial query
    // For now, we broadcast to all active providers as a simulation
    const nearbyProviders = await UserMongo.find({ 
      role: 'provider',
      // location: { $in: ['Bhimavaram', 'Nellore', 'Vizag'] } // Example geo-fence
    });

    console.log(`[Market Broadcast] Notifying ${nearbyProviders.length} providers within 150km about new Harvest Request: ${request._id}`);
    
    // Logic to send push notifications to these providers would go here
    // nearbyProviders.forEach(p => sendPushNotification(p.fcmToken, ...))

    res.json(request);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/harvest-requests/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (req.user.role === 'provider' && !updates.providerId) {
       updates.providerId = req.user.id;
    }

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const updated = await HarvestRequest.findByIdAndUpdate(id, updates, { new: true });
    res.json(updated);
    // NOTE: FCM push is sent by the client via POST /api/push/harvest-update
    // Do NOT send FCM here — that would cause every status change to notify twice.
  } catch (e) { res.status(400).json({ error: e.message }); }
});


// POST a new message to a harvest request chat
app.post('/api/harvest-requests/:id/messages', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { message, proposedPrice } = req.body;
    const newMsg = {
      senderId: req.user.id,
      senderName: req.user.name || 'User',
      senderRole: req.user.role || 'farmer',
      message,
      proposedPrice: proposedPrice || null,
      timestamp: new Date()
    };

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const updated = await HarvestRequest.findByIdAndUpdate(
      id,
      { $push: { chatMessages: newMsg } },
      { new: true }
    );
    const lastMsg = updated?.chatMessages?.slice(-1)[0];
    res.json(lastMsg);
  } catch (e) { res.status(400).json({ error: (e as Error).message }); }
});

// GET all messages for a harvest request
app.get('/api/harvest-requests/:id/messages', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const request = await HarvestRequest.findById(id).select('chatMessages');
    res.json(request?.chatMessages || []);
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});


// ═══════════════════════════════╗
//  SOP LOGS                      ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/sop-logs', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const filter: any = { userId: req.params.userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;
    const logs = await SOPLogMongo.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sop-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    res.json(await new SOPLogMongo(data).save());
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/sop-logs/:id', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await SOPLogMongo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  EXPENSES                      ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/expenses', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const expenses = await ExpenseMongo.find({ userId: req.params.userId });
    res.json(expenses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    res.json(await new ExpenseMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  FEED LOGS                     ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/feed-logs', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const filter: any = { userId: req.params.userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;
    const logs = await FeedLogMongo.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/feed-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    res.json(await new FeedLogMongo(data).save());
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/feed-logs/:id', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await FeedLogMongo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  MEDICINE LOGS                 ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/medicine-logs', authenticate, requireSelf, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const filter: any = { userId: req.params.userId };
    if (req.query.pondId) filter.pondId = req.query.pondId;
    const logs = await MedicineLogMongo.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/medicine-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    res.json(await new MedicineLogMongo(data).save());
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/medicine-logs/:id', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await MedicineLogMongo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ─── AI Routes (Gemini runs server-side — key never exposed to client) ─────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const GEMINI_MODEL = 'gemini-2.5-flash';

// ── Shared AI error normaliser ────────────────────────────────────────────────
const normaliseAIError = (e: any): { status: number; body: object } => {
  const msg: string = e?.message || JSON.stringify(e) || '';
  // 404 — model deprecated / not found
  if (e?.status === 404 || msg.includes('NOT_FOUND') || msg.includes('no longer available') || msg.includes('is not found')) {
    return { status: 503, body: { error: 'AI model unavailable. The server is being updated — please try again shortly.' } };
  }
  // 429 / RESOURCE_EXHAUSTED — quota exceeded
  if (e?.status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    // Try to extract retryDelay from error details
    let retryAfter = 60;
    try {
      const parsed = JSON.parse(msg.substring(msg.indexOf('{')));
      const retryInfo = parsed?.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'));
      if (retryInfo?.retryDelay) retryAfter = parseInt(retryInfo.retryDelay);
    } catch { /* ignore */ }
    return { status: 429, body: {
      error: 'AI quota exhausted',
      message: `You have exceeded the Gemini API free-tier daily limit. Please wait ${retryAfter} seconds and try again, or upgrade your Google AI plan.`,
      retryAfterSeconds: retryAfter,
      code: 'QUOTA_EXCEEDED',
    }};
  }
  // 503 / UNAVAILABLE
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded')) {
    return { status: 503, body: { error: 'AI server overloaded. Please retry in 30 seconds.' } };
  }
  return { status: 500, body: { error: msg || 'AI analysis failed.' } };
};

// ── Disease Detection ───────────────────────────────────────────────────────────
app.post('/api/ai/analyze-health', authenticate, async (req: any, res: any) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured on server.' });
    const { base64Image, language = 'English' } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image is required' });

    const mimeType = base64Image.startsWith('data:') ? base64Image.split(';')[0].split(':')[1] : 'image/jpeg';
    const data     = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const prompt = `You are a certified aquaculture pathologist with 20 years of shrimp disease diagnosis experience.
Analyze this shrimp specimen photo carefully. Return a precise diagnosis using ONLY the visual evidence visible in the image.

1. HEALTHY SHRIMP: Full dark-brown/orange gut line, clear body, normal opacity → disease: "Healthy Shrimp", severity: "Safe"
2. WHITE SPOT DISEASE (WSSV): White calcified spots on shell, reddish body → severity: "Critical"
3. EARLY MORTALITY SYNDROME (EMS/AHPND): Pale shrunken hepatopancreas, empty gut → severity: "Critical"
4. BLACK GILL DISEASE: Dark brown/black gills → severity: "Moderate"
5. WHITE GUT DISEASE (WGD): White gut line, white fecal strings → severity: "Medium"
6. RUNNING MORTALITY SYNDROME (RMS): Soft wrinkled carapace, no spots → severity: "High"
7. EHP: Stunted growth, soft carapace → severity: "High"
8. VIBRIOSIS: Reddish/black necrotic legs/tail, luminescent → severity: "High"
9. IHHNV: Bent rostrum, deformed body → severity: "Moderate"
10. SHELL DISEASE: Black spots on carapace → severity: "Low"
11. FOULING: Fuzzy coating on body → severity: "Low"

RULES: If no shrimp visible → shrimpObserved: false. If blurry → confidence: 0, disease: "Clear Photo Required".
Translate all text values to: ${language}

Return ONLY this JSON (no markdown):
{"shrimpObserved":true,"notObservedReason":"","disease":"string","confidence":number,"severity":"Safe|Low|Medium|Moderate|High|Critical|N/A","affectedPart":"string","reasoning":"string","action":"string"}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ inlineData: { data, mimeType } }, { text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text?.trim() || '';
    const jsonStr = text.startsWith('```') ? text.replace(/^```json?/, '').replace(/```$/, '').trim() : text;
    res.json(JSON.parse(jsonStr));
  } catch (e: any) {
    console.error('[AI-Health Error]', e?.status, e?.message?.substring(0, 120));
    const { status, body } = normaliseAIError(e);
    res.status(status).json(body);
  }
});

// ── Water Test Scanner ─────────────────────────────────────────────────────────
app.post('/api/ai/analyze-water', authenticate, async (req: any, res: any) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured on server.' });
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image is required' });

    const mimeType = base64Image.startsWith('data:') ? base64Image.split(';')[0].split(':')[1] : 'image/jpeg';
    const data     = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const prompt = `You are an expert aquaculture water quality analyst.
Analyze this image — it may show pond water color, test kits, strips, or meters.

Water colors: LIGHT_GREEN=healthy, DARK_GREEN=over-bloom, BROWN=diatoms/organic, BLACK=toxic, BLUE_GREEN=cyanobacteria, CLEAR=no plankton, MURKY_YELLOW=turbidity, REDDISH=iron/flagellate.
Safe ranges (L. vannamei): pH 7.5–8.5, DO >5 mg/L, NH3 <0.1 mg/L, Salinity 10–25 ppt, Temp 23–31°C.

If not pond water or test equipment → imageValid: false.
Return ONLY valid JSON:
{"detectedEquipment":"string","confidence":number,"overallStatus":"excellent|good|warning|critical","summary":"string","urgentAction":"string","ph":{"value":0,"raw":"string","status":"string"},"do_":{"value":0,"raw":"string","status":"string"},"ammonia":{"value":0,"raw":"string","status":"string"},"salinity":{"value":0,"raw":"string","status":"string"},"temperature":{"value":0,"raw":"string","status":"string"},"waterColor":{"detected":"string","label":"string","hex":"string","meaning":"string","status":"string"},"problems":[],"diseaseRisks":[],"imageValid":true,"notDetectedReason":"","recommendations":[]}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ inlineData: { data, mimeType } }, { text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text?.trim() || '';
    const jsonStr = text.startsWith('```') ? text.replace(/^```json?/, '').replace(/```$/, '').trim() : text;
    res.json(JSON.parse(jsonStr));
  } catch (e: any) {
    console.error('[AI-Water Error]', e?.status, e?.message?.substring(0, 120));
    const { status, body } = normaliseAIError(e);
    res.status(status).json(body);
  }
});

// ── Live Stream Frame Analysis ─────────────────────────────────────────────────
app.post('/api/ai/analyze-live', authenticate, async (req: any, res: any) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured.' });
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image is required' });

    const mimeType = base64Image.startsWith('data:') ? base64Image.split(';')[0].split(':')[1] : 'image/jpeg';
    const data     = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ inlineData: { data, mimeType } }, { text: 'Analyze these shrimp post-larvae. Return ONLY JSON: {"activity":number,"health":number,"count":number}' }] }],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text?.trim() || '';
    const jsonStr = text.startsWith('```') ? text.replace(/^```json?/, '').replace(/```$/, '').trim() : text;
    res.json(JSON.parse(jsonStr));
  } catch (e: any) {
    console.error('[AI-Live Error]', e.message);
    res.json({ activity: 0, health: 0, count: 0 });
  }
});


// ─── GET /api/admin/me — current admin's own profile (from adminusers table) ──
app.get('/api/admin/me', authenticate, requireAnyAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const admin = await AdminUserMongo.findById(req.user.id, '-password');
    if (!admin) return res.status(404).json({ error: 'Admin account not found' });
    res.json(admin);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/users — all users (farmers + providers) in User table ─────
app.get('/api/admin/users', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    const users = await UserMongo.find({}, '-password');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN STAFF MANAGEMENT  (adminusers collection)                            
//  Super Admin only for create/update/delete. Any admin can list.             
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/staff — list all admin staff
app.get('/api/admin/staff', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const staff = await AdminUserMongo.find({}, '-password').sort({ createdAt: -1 });
    res.json(staff);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/staff — create new admin user (super_admin only)
app.post('/api/admin/staff', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const { name, phoneNumber, email, password, role, location } = req.body;
    if (!name || !phoneNumber || !password || !role)
      return res.status(400).json({ error: 'name, phoneNumber, password and role are required' });

    const existing = await AdminUserMongo.findOne({ phoneNumber: phoneNumber.replace(/\D/g, '').slice(-10) });
    if (existing) return res.status(409).json({ error: 'An admin with this phone number already exists' });

    const hash = await bcrypt.hash(password, 12);
    const newAdmin = await new AdminUserMongo({
      name,
      phoneNumber: phoneNumber.replace(/\D/g, '').slice(-10),
      email,
      password: hash,
      role,
      location,
      isActive: true,
      createdBy: req.user.id,
    }).save();

    const { password: _, ...safeAdmin } = newAdmin.toObject();
    console.log(`[AdminStaff] Created ${role} account for ${name} by ${req.user.id}`);
    res.status(201).json(safeAdmin);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PATCH /api/admin/staff/:id — update role / status (super_admin only)
app.patch('/api/admin/staff/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const { role, isActive, name, email, location } = req.body;
    const updates: any = {};
    if (role     !== undefined) updates.role     = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (name     !== undefined) updates.name     = name;
    if (email    !== undefined) updates.email    = email;
    if (location !== undefined) updates.location = location;

    const updated = await AdminUserMongo.findByIdAndUpdate(req.params.id, updates, { new: true, select: '-password' });
    if (!updated) return res.status(404).json({ error: 'Admin user not found' });
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/admin/staff/:id — remove admin account (super_admin only)
app.delete('/api/admin/staff/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    const deleted = await AdminUserMongo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Admin user not found' });
    res.json({ success: true, message: `Admin account for ${deleted.name} removed` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/staff/:id/password — reset another admin's password (super_admin only)
app.patch('/api/admin/staff/:id/password', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
    const hash = await bcrypt.hash(newPassword, 12);
    const updated = await AdminUserMongo.findByIdAndUpdate(req.params.id, { password: hash }, { new: true, select: '-password' });
    if (!updated) return res.status(404).json({ error: 'Admin user not found' });
    res.json({ success: true, message: `Password reset for ${updated.name}` });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});


// ══════════════════════════════════════════════════════════════════════════════╗
//  ADMIN INTELLIGENCE ENDPOINTS                                                 ║
//  All require: Authorization: Bearer <admin_jwt>                               ║
// ══════════════════════════════════════════════════════════════════════════════╝

// ─── GET /api/admin/farmers — all farmers with subscription info ──────────────
app.get('/api/admin/farmers', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const farmers = await UserMongo.find({ role: 'farmer' }, '-password').sort({ createdAt: -1 });
    const subs = await SubscriptionMongo.find({});
    const subMap = Object.fromEntries(subs.map(s => [s.userId, s]));
    const result = farmers.map(f => {
      const fObj = f.toObject();
      return { ...fObj, subscription: subMap[String(f._id)] || null };
    });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/ponds — all ponds across all farmers, with computed intel ─
app.get('/api/admin/ponds', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const ponds = await PondMongo.find({}).sort({ createdAt: -1 });
    const now = Date.now();

    const enriched = await Promise.all(ponds.map(async (pond: any) => {
      const pObj = pond.toObject();
      const doc = pond.stockingDate
        ? Math.floor((now - new Date(pond.stockingDate).getTime()) / 86400000)
        : 0;

      // Fetch last 3 water logs for quick health summary
      const recentWater = await WaterLogMongo.find({ pondId: String(pond._id) })
        .sort({ createdAt: -1 }).limit(3).lean();

      // Fetch last 7 feed logs for FCR/consumption trend
      const recentFeed = await FeedLogMongo.find({ pondId: String(pond._id) })
        .sort({ createdAt: -1 }).limit(7).lean();

      const totalFeedKg = recentFeed.reduce((s: number, f: any) => s + (f.quantity || 0), 0);
      const lastWater = recentWater[0] || null;

      // Auto-detect alerts
      const alerts: string[] = [];
      if (lastWater) {
        if ((lastWater as any).do < 4)    alerts.push('CRITICAL_LOW_DO');
        if ((lastWater as any).ph < 7 || (lastWater as any).ph > 9) alerts.push('PH_OUT_OF_RANGE');
        if ((lastWater as any).ammonia > 0.5) alerts.push('HIGH_AMMONIA');
        if ((lastWater as any).mortality > 100) alerts.push('HIGH_MORTALITY');
      }
      if (doc > 83 && pond.status === 'active') alerts.push('HARVEST_READY');
      if (doc > 45 && doc < 55) alerts.push('PEAK_WSSV_RISK');

      // Stage label
      const stage = doc <= 20 ? 'Nursery' : doc <= 40 ? 'Early Growth' : doc <= 60 ? 'Mid Growth' : doc <= 80 ? 'Pre-Harvest' : 'Harvest';

      return {
        ...pObj,
        doc,
        stage,
        alerts,
        lastWaterLog: lastWater,
        feedLast7Days: totalFeedKg,
        feedLogCount: recentFeed.length,
        farmerName: null, // filled by join below
      };
    }));

    // Join farmer names
    const farmerIds = [...new Set(enriched.map(p => p.userId))];
    const farmers = await UserMongo.find({ _id: { $in: farmerIds } }, 'name phoneNumber location').lean();
    const farmerMap = Object.fromEntries(farmers.map(f => [String(f._id), f]));
    const final = enriched.map(p => ({
      ...p,
      farmer: farmerMap[p.userId] || null,
    }));

    res.json(final);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/intelligence — aggregated business intelligence dashboard ─
app.get('/api/admin/intelligence', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const [farmers, ponds, feedLogs, waterLogs, harvestReqs, roiEntries, shopOrders, subs] = await Promise.all([
      UserMongo.find({ role: 'farmer' }, '_id name location subscriptionStatus createdAt').lean(),
      PondMongo.find({}).lean(),
      FeedLogMongo.find({ date: { $gte: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] } }).lean(),
      WaterLogMongo.find({ date: { $gte: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0] } }).lean(),
      HarvestRequest.find({}).lean(),
      ROIEntryMongo.find({}).lean(),
      ((): any => mongoose.models['ShopOrder'] ?? mongoose.model('ShopOrder', new mongoose.Schema({}, { strict: false })))().find({}).lean(),
      SubscriptionMongo.find({}).lean(),
    ]);

    const now = Date.now();
    const activePonds = ponds.filter((p: any) => p.status === 'active');
    const harvestedPonds = ponds.filter((p: any) => p.status === 'harvested');

    // Compute DOC for each active pond
    const pondWithDoc = activePonds.map((p: any) => ({
      ...p,
      doc: p.stockingDate ? Math.floor((now - new Date(p.stockingDate).getTime()) / 86400000) : 0,
    }));

    // Ponds needing harvest (DOC > 83)
    const harvestReady = pondWithDoc.filter((p: any) => p.doc > 83);
    // Ponds in critical window (WSSV risk DOC 40-55)
    const criticalRiskPonds = pondWithDoc.filter((p: any) => p.doc >= 40 && p.doc <= 55);
    // Ponds with low DO alerts
    const lowDoPonds = waterLogs.filter((w: any) => (w as any).do < 4 || (w as any).do < 4);

    // Feed demand in next 7 days (farmers with active ponds consuming high feed)
    const highFeedFarmers = feedLogs.reduce((acc: Record<string, number>, log: any) => {
      acc[log.userId] = (acc[log.userId] || 0) + (log.quantity || 0);
      return acc;
    }, {});

    // Revenue from ROI entries
    const totalRevenue = roiEntries.reduce((s: number, r: any) => s + (r.totalRevenue || 0), 0);
    const totalProfit = roiEntries.reduce((s: number, r: any) => s + (r.netProfit || 0), 0);
    const avgROI = roiEntries.length ? roiEntries.reduce((s: number, r: any) => s + (r.roi || 0), 0) / roiEntries.length : 0;

    // Subscription breakdown
    const subBreakdown = subs.reduce((acc: Record<string, number>, s: any) => {
      acc[s.planName] = (acc[s.planName] || 0) + 1;
      return acc;
    }, {});

    // Stage distribution
    const stageDistribution = pondWithDoc.reduce((acc: Record<string, number>, p: any) => {
      const stage = p.doc <= 20 ? 'Nursery' : p.doc <= 40 ? 'Early Growth' : p.doc <= 60 ? 'Mid Growth' : p.doc <= 80 ? 'Pre-Harvest' : 'Harvest Ready';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    // Pending harvest requests
    const pendingHarvests = harvestReqs.filter((h: any) => h.status === 'pending');
    const completedHarvests = harvestReqs.filter((h: any) => h.status === 'completed' || h.status === 'paid');
    const totalHarvestBiomass = completedHarvests.reduce((s: number, h: any) => s + (h.finalWeight || h.biomass || 0), 0);

    // Shop orders
    const pendingShopOrders = (shopOrders as any[]).filter((o: any) => ['assigned', 'confirmed'].includes(o.status));

    // Alerts severity list
    const systemAlerts: { type: string; severity: string; message: string; pondId?: string; farmerId?: string }[] = [];
    harvestReady.forEach((p: any) => systemAlerts.push({ type: 'HARVEST_READY', severity: 'HIGH', message: `Pond "${p.name}" is DOC ${p.doc} — harvest window open`, pondId: String(p._id), farmerId: p.userId }));
    criticalRiskPonds.forEach((p: any) => systemAlerts.push({ type: 'WSSV_RISK', severity: 'CRITICAL', message: `Pond "${p.name}" in peak WSSV window (DOC ${p.doc})`, pondId: String(p._id), farmerId: p.userId }));

    res.json({
      summary: {
        totalFarmers: farmers.length,
        activePonds: activePonds.length,
        harvestedPonds: harvestedPonds.length,
        totalPonds: ponds.length,
        harvestReadyCount: harvestReady.length,
        criticalRiskCount: criticalRiskPonds.length,
        pendingHarvestRequests: pendingHarvests.length,
        pendingShopOrders: pendingShopOrders.length,
        totalFeedKgLast7Days: Object.values(highFeedFarmers).reduce((s: number, v) => s + (v as number), 0),
        totalRevenue,
        totalProfit,
        avgROI: Math.round(avgROI * 10) / 10,
        totalHarvestBiomassKg: totalHarvestBiomass,
      },
      stageDistribution,
      subscriptionBreakdown: subBreakdown,
      systemAlerts: systemAlerts.slice(0, 50),
      harvestReady: harvestReady.slice(0, 20),
      criticalRiskPonds: criticalRiskPonds.slice(0, 20),
      pendingHarvestRequests: pendingHarvests.slice(0, 20),
      topFeedConsumers: Object.entries(highFeedFarmers)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([id, kg]) => ({ farmerId: id, feedKg: kg })),
      recentROI: roiEntries.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/water-alerts — cross-pond water quality alerts ────────────
app.get('/api/admin/water-alerts', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const cutoff = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const logs = await WaterLogMongo.find({ date: { $gte: cutoff } }).sort({ createdAt: -1 }).lean();
    const alerts = logs.filter((l: any) =>
      (l as any).do < 4 || (l as any).ph < 7 || (l as any).ph > 9 ||
      (l as any).ammonia > 0.5 || (l as any).mortality > 50
    );
    // Join pond names
    const pondIds = [...new Set(alerts.map((a: any) => a.pondId))];
    const ponds = await PondMongo.find({ _id: { $in: pondIds } }, 'name userId').lean();
    const pondMap = Object.fromEntries(ponds.map(p => [String(p._id), p]));
    const enriched = alerts.map((a: any) => ({ ...a, pond: pondMap[(a as any).pondId] }));
    res.json(enriched);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/shop-orders — all shop orders with farmer info ─────────────
app.get('/api/admin/shop-orders', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const ShopOrderModel = mongoose.models['ShopOrder'];
    if (!ShopOrderModel) return res.json([]);
    const orders = await ShopOrderModel.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json(orders);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/all-orders — UNIFIED view: ShopOrders + ProviderOrders ────
// Both collections now live in the same `aquagrow` DB so this is a simple
// fan-out query — no cross-DB joins needed.
app.get('/api/admin/all-orders', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const ShopOrderModel    = mongoose.models['ShopOrder'];
    const ProviderOrderModel = mongoose.models['ProviderOrder'];

    const [shopOrders, providerOrders] = await Promise.all([
      ShopOrderModel    ? ShopOrderModel.find({}).sort({ createdAt: -1 }).limit(500).lean()    : [],
      ProviderOrderModel ? ProviderOrderModel.find({}).sort({ createdAt: -1 }).limit(500).lean() : [],
    ]);

    // Tag each order with its source so the admin UI can distinguish them
    const tagged = [
      ...(shopOrders    as any[]).map(o => ({ ...o, _source: 'shop' })),
      ...(providerOrders as any[]).map(o => ({ ...o, _source: 'provider' })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(tagged);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/providers — all providers from the unified DB ─────────────
app.get('/api/admin/providers', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    // Providers register in the users collection with role:'provider'
    const providers = await UserMongo.find({ role: 'provider' }, '-password').sort({ createdAt: -1 }).lean();
    // Enrich with their extended profile if available
    const ProviderProfileModel = mongoose.models['ProviderProfile'];
    if (ProviderProfileModel) {
      const profiles = await ProviderProfileModel.find({}).lean();
      const profileMap = Object.fromEntries((profiles as any[]).map(p => [p.userId, p]));
      const enriched = providers.map(p => ({ ...p, profile: profileMap[String((p as any)._id)] || null }));
      return res.json(enriched);
    }
    res.json(providers);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/admin/roi — all ROI/harvest entries for revenue analytics ────────
app.get('/api/admin/roi', authenticate, requireAnyAdmin, async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const entries = await ROIEntryMongo.find({}).sort({ createdAt: -1 }).limit(500).lean();
    // Join farmer names
    const farmerIds = [...new Set(entries.map((e: any) => e.userId))];
    const farmers = await UserMongo.find({ _id: { $in: farmerIds } }, 'name location').lean();
    const fMap = Object.fromEntries(farmers.map(f => [String(f._id), f]));
    const result = entries.map((e: any) => ({ ...e, farmer: fMap[e.userId] || null }));
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── FCM Helper ───────────────────────────────────────────────────────────────
const sendFCM = async (token: string, payload: admin.messaging.Message): Promise<boolean> => {
  if (!token) return false;
  if (admin.apps.length > 0) {
    try {
      await admin.messaging().send(payload);
      return true;
    } catch (err: any) {
      console.warn('[FCM-ERROR]', err.message);
      return false;
    }
  }
  console.log('[SIMULATED-PUSH]', JSON.stringify(payload.notification));
  return false;
};

// ─── OWM Server-side Weather Fetch ────────────────────────────────────────────
// Used by the push daemon to fetch real weather every 15 min and alert farmers.
const OWM_API_KEY = '02eb92440f84d48b0d5df34e44540cb1';
const OWM_BASE    = 'https://api.openweathermap.org/data/2.5';

interface OWMWeatherBrief {
  temp: number; rainPct: number; humidity: number; windKmh: number;
  weatherId: number; location: string; hour: number; conditionCode: string;
}

const fetchWeatherBrief = async (city: string): Promise<OWMWeatherBrief | null> => {
  try {
    const url = `${OWM_BASE}/weather?q=${encodeURIComponent(city)}&appid=${OWM_API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    const temp      = Math.round(d.main?.temp ?? 0);
    const humidity  = d.main?.humidity ?? 0;
    const windKmh   = Math.round((d.wind?.speed ?? 0) * 3.6);
    const weatherId = d.weather?.[0]?.id ?? 800;
    let conditionCode = 'sunny';
    if (weatherId >= 200 && weatherId < 300) conditionCode = 'storm';
    else if (weatherId >= 300 && weatherId < 600) conditionCode = 'rain';
    else if (weatherId >= 700 && weatherId < 800) conditionCode = 'fog';
    else if (weatherId > 800) conditionCode = 'cloudy';
    else if (temp >= 36) conditionCode = 'hot';
    const rainPct = conditionCode === 'storm' ? 85 : conditionCode === 'rain' ? 60 : conditionCode === 'cloudy' ? 20 : 5;
    return { temp, rainPct, humidity, windKmh, weatherId, location: `${d.name}, ${d.sys?.country ?? 'IN'}`, hour: new Date().getHours(), conditionCode };
  } catch { return null; }
};

// Build weather alerts for aquaculture from a weather brief
const buildWeatherAlerts = (w: OWMWeatherBrief): { title: string; body: string; aqAction: string; type: 'critical' | 'warning' | 'info'; color: string }[] => {
  const out: { title: string; body: string; aqAction: string; type: 'critical' | 'warning' | 'info'; color: string }[] = [];
  if (w.temp >= 36)        out.push({ title: `🌡️ Extreme Heat — ${w.temp}°C`, body: `High temp at ${w.location} causing DO drop risk. Shrimp metabolism slows above 33°C.`, aqAction: 'Skip noon feed (12–2 PM). Apply Vitamin C. Add aeration at 3 PM.', type: 'critical', color: '#EF4444' });
  else if (w.temp >= 33)   out.push({ title: `🌡️ High Temp — ${w.temp}°C`, body: `Temperature above optimal range (26–30°C) at ${w.location}. Increase aeration.`, aqAction: 'Reduce noon feed by 15%. Check DO at 3 PM.', type: 'warning', color: '#F59E0B' });
  if (w.rainPct > 70)      out.push({ title: `🌧️ Heavy Rain Warning`, body: `Heavy rainfall likely at ${w.location}. Salinity drop risk. Check drainage.`, aqAction: 'Reduce feed 20%. Run all aerators. Check salinity after rain.', type: 'critical', color: '#3B82F6' });
  else if (w.rainPct > 40) out.push({ title: `🌦️ Rain Expected`, body: `Moderate rain at ${w.location}. Monitor pond salinity and DO.`, aqAction: 'Reduce feed 10%. Check DO and pH after rainfall.', type: 'warning', color: '#60A5FA' });
  if (w.windKmh > 40)      out.push({ title: `💨 High Wind — ${w.windKmh} km/h`, body: `Strong winds at ${w.location} can disturb pond surface and stress shrimp.`, aqAction: 'Reduce feeding in windy slots. Increase aerator coverage.', type: 'warning', color: '#8B5CF6' });
  if (w.hour >= 3 && w.hour <= 6) out.push({ title: `⚠️ Pre-Dawn DO Risk Window`, body: `3–6 AM critical zone at ${w.location}. Photosynthesis stopped.`, aqAction: 'Ensure all aerators running. Check DO immediately.', type: 'warning', color: '#F97316' });
  if (w.conditionCode === 'storm') out.push({ title: `⛈️ Storm / Lightning Alert`, body: `Thunderstorm conditions at ${w.location}. Avoid pond-side work. Danger to equipment.`, aqAction: 'Secure aerator cables. Keep farmer away from pond edges during lightning.', type: 'critical', color: '#6366F1' });
  return out;
};

// ─── WEATHER ALERT PUSH ───────────────────────────────────────────────────────
// POST /api/push/weather-alert
// Client calls this after fetching OWM data when critical/warning conditions arise.
// Body: { alertTitle, alertBody, aqAction, alertType, location, conditionCode, temp, rainPct }
app.post('/api/push/weather-alert', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { alertTitle, alertBody, aqAction, alertType, location, conditionCode, temp, rainPct } = req.body;
    const userId = req.user.id;

    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const user = await UserMongo.findById(userId);
    if (!user?.fcmToken) return res.json({ sent: false, reason: 'No FCM token' });

    const emoji   = alertType === 'critical' ? '🚨' : alertType === 'warning' ? '⚠️' : 'ℹ️';
    const color   = alertType === 'critical' ? '#EF4444' : alertType === 'warning' ? '#F59E0B' : '#10B981';
    const condImg = conditionCode === 'storm'
      ? 'https://aquagrow.onrender.com/assets/push/storm.png'
      : conditionCode === 'rain'
      ? 'https://aquagrow.onrender.com/assets/push/rain.png'
      : conditionCode === 'hot'
      ? 'https://aquagrow.onrender.com/assets/push/hot.png'
      : 'https://aquagrow.onrender.com/assets/push/sunny.png';

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title: `${emoji} ${alertTitle}`,
        body:  alertBody,
        imageUrl: condImg,
      },
      data: {
        type: 'weather_alert',
        alertType:    String(alertType || 'info'),
        conditionCode: String(conditionCode || ''),
        location:     String(location || ''),
        temp:         String(temp ?? ''),
        rainPct:      String(rainPct ?? ''),
        aqAction:     String(aqAction || ''),
        deepLink:     '/weather',
      },
      android: {
        priority: alertType === 'critical' ? 'high' : 'normal',
        ttl: 3600000,
        notification: {
          channelId:   'aquagrow-premium',
          color,
          icon:        'ic_stat_aquagrow',
          tag:         `weather-${userId}`,
          ticker:      `AquaGrow Weather: ${alertTitle}`,
          notificationCount: 1,
          clickAction: 'OPEN_WEATHER_ALERTS',
          sound:       'alert_sound',
          visibility:  'public' as any,
          // BigText expanded view — shows full aqAction guidance
          body:        `${alertBody}\n\n🌾 Action: ${aqAction}`,
          imageUrl:    condImg,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
          // Inline action buttons
          // (defined in Android Notification Channel in MainActivity)
        },
      },
      apns: { payload: { aps: { badge: 1, sound: 'default', category: 'WEATHER_ALERT' } } },
    };

    const sent = await sendFCM(user.fcmToken, message);
    console.log(`[WEATHER-PUSH] ${sent ? 'Sent' : 'Simulated'} | ${alertType} | ${alertTitle} → ${user.name || userId}`);
    res.json({ sent, simulated: !sent });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── AERATOR CHECK PUSH ───────────────────────────────────────────────────────
// POST /api/push/aerator-check
// Sends FCM to farmer with Android action buttons (Update Now / Remind Tomorrow)
app.post('/api/push/aerator-check', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { pondId, pondName, doc, stageLabel } = req.body;
    const userId = req.user.id;

    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const user = await UserMongo.findById(userId);

    if (!user?.fcmToken) {
      return res.json({ sent: false, reason: 'No FCM token registered for this user' });
    }

    const docStage = Number(doc) <= 20 ? 'Nursery' : Number(doc) <= 40 ? 'Early Growth' : Number(doc) <= 60 ? 'Mid Growth' : 'Pre-Harvest';
    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title: `💨 Aerator Check Required — DOC ${doc}`,
        body:  `${pondName} | ${docStage} Stage`,
        imageUrl: 'https://aquagrow.onrender.com/assets/push/aerator_banner.png',
      },
      data: {
        type: 'aerator_check',
        pondId: String(pondId),
        pondName: String(pondName),
        doc: String(doc),
        deepLink: `/ponds/${pondId}?tab=aerators`,
      },
      android: {
        priority: 'high',
        ttl: 7200000,
        notification: {
          channelId: 'aquagrow-aerator',
          color: '#3B82F6',
          icon:  'ic_stat_aquagrow',
          tag:   `aerator-${pondId}`,
          ticker: `AquaGrow: Aerator check due for ${pondName}`,
          notificationCount: 1,
          clickAction: 'OPEN_AERATOR',
          sound: 'alert_sound',
          visibility: 'public' as any,
          body: `📍 Pond: ${pondName}\n🌿 Stage: ${docStage} (DOC ${doc})\n📋 ${stageLabel}\n\nPlease update aerator count, HP & positions to meet SOP.`,
          imageUrl: 'https://aquagrow.onrender.com/assets/push/aerator_banner.png',
          defaultVibrateTimings: true,
          defaultLightSettings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
            category: 'AERATOR_CHECK',
          },
        },
      },
    };

    const sent = await sendFCM(user.fcmToken, message);
    console.log(`[AERATOR-PUSH] ${sent ? 'Sent' : 'Simulated'} to ${user.name || userId} for pond ${pondName} at DOC ${doc}`);
    res.json({ sent, simulated: !sent });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── AERATOR QUICK CONFIRM (from notification tap) ────────────────────────────
// POST /api/ponds/:id/aerator-confirm
// Called when farmer taps "Confirm Current Setup" action button from notification
app.post('/api/ponds/:id/aerator-confirm', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { count, hp, positions, addedNew, doc, notes } = req.body;

    const now = new Date().toISOString();
    const aeratorUpdate = {
      aerators: {
        count: Number(count) || 0,
        hp: Number(hp) || 1,
        positions: positions || [],
        addedNew: Boolean(addedNew),
        lastUpdated: now,
        lastDoc: Number(doc),
        log: [{ doc: Number(doc), date: now, count: Number(count) || 0, hp: Number(hp) || 1, positions: positions || [], addedNew: Boolean(addedNew), notes: notes || '' }],
      },
    };

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    // Merge log with existing entries
    const pond = await PondMongo.findById(id);
    if (!pond) return res.status(404).json({ error: 'Pond not found' });
    const existingLog = (pond as any).aerators?.log || [];
    aeratorUpdate.aerators.log = [...existingLog, aeratorUpdate.aerators.log[0]];

    const updated = await PondMongo.findByIdAndUpdate(id, { aerators: aeratorUpdate.aerators }, { new: true });

    // ── Also record in AeratorLog for history/analytics ──────────────────────
    const recommended = Math.ceil(((pond as any).size || 0) * 4);
    await new AeratorLogMongo({
      userId:      req.user.id,
      pondId:      id,
      pondName:    (pond as any).name || '',
      doc:         Number(doc),
      date:        now,
      count:       Number(count) || 0,
      hp:          Number(hp) || 1,
      positions:   positions || [],
      addedNew:    Boolean(addedNew),
      notes:       notes || '',
      sopMet:      (Number(count) || 0) >= recommended,
      recommended,
      source:      'alert_confirm',
    }).save();

    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});


// ─── AERATOR SNOOZE (remind tomorrow) ────────────────────────────────────────
// POST /api/ponds/:id/aerator-snooze
app.post('/api/ponds/:id/aerator-snooze', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const snoozeUpdate = { aeratorSnoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };

    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    await PondMongo.findByIdAndUpdate(id, snoozeUpdate);
    res.json({ snoozed: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ─── IoT DEVICE ALERT PUSH ────────────────────────────────────────────────────
// POST /api/push/iot-alert
// Called client-side when polling detects offline/warning device or aerator issue.
// Sends high-priority FCM push with step-by-step guidance for the farmer.
//
// Body: { alertType, deviceId, deviceName, deviceType, pondId, pondName, signal, guidance }
// alertType: 'connection_lost' | 'aerator_fault' | 'sensor_offline' | 'signal_weak' | 'reconnected'
app.post('/api/push/iot-alert', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { alertType, deviceId, deviceName, deviceType, pondId, pondName, signal, guidance } = req.body;
    const userId = req.user.id;

    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const user = await UserMongo.findById(userId);

    if (!user?.fcmToken) {
      return res.json({ sent: false, reason: 'No FCM token registered' });
    }

    // ── Build alert content based on alert type ──────────────────────────────
    const ALERT_META: Record<string, { emoji: string; title: string; body: (dn: string, pn: string, sig?: number) => string; color: string; channelId: string }> = {
      connection_lost: {
        emoji: '📡',
        title: '⚠️ IoT Device Offline',
        body: (dn, pn) => `${dn} on ${pn} lost connection. Check power supply and Wi-Fi. Tap to troubleshoot.`,
        color: '#EF4444',
        channelId: 'aquagrow-premium',
      },
      aerator_fault: {
        emoji: '💨',
        title: '🚨 Aerator Fault Detected',
        body: (dn, pn) => `${dn} on ${pn} appears to have stopped. Check motor, relay board and power. Immediate action needed.`,
        color: '#F97316',
        channelId: 'aquagrow-premium',
      },
      sensor_offline: {
        emoji: '🔌',
        title: '📡 Water Sensor Offline',
        body: (dn, pn) => `${dn} on ${pn} disconnected. DO and pH readings are unavailable. Check probe and cable.`,
        color: '#F59E0B',
        channelId: 'aquagrow-premium',
      },
      signal_weak: {
        emoji: '📶',
        title: '📶 Weak IoT Signal',
        body: (dn, pn, sig) => `${dn} on ${pn} has low signal (${sig ?? '?'}%). Move router closer or check antenna to prevent data loss.`,
        color: '#8B5CF6',
        channelId: 'aquagrow-premium',
      },
      reconnected: {
        emoji: '✅',
        title: '✅ Device Reconnected',
        body: (dn, pn) => `${dn} on ${pn} is back online. Live monitoring resumed.`,
        color: '#10B981',
        channelId: 'aquagrow-premium',
      },
    };

    const meta = ALERT_META[alertType] || ALERT_META['connection_lost'];

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title: `${meta.emoji} ${meta.title}`,
        body: meta.body(deviceName || 'Device', pondName || 'Pond', signal),
      },
      data: {
        type: 'iot_alert',
        alertType:  String(alertType || ''),
        deviceId:   String(deviceId  || ''),
        deviceName: String(deviceName || ''),
        deviceType: String(deviceType || ''),
        pondId:     String(pondId    || ''),
        pondName:   String(pondName  || ''),
        signal:     String(signal    ?? ''),
        guidance:   String(guidance  || ''),
        deepLink:   '/smart-farm?tab=iot',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: meta.channelId,
          color:     meta.color,
          icon:      'ic_stat_aquagrow',
          tag:       `iot-${deviceId}`,
          clickAction: 'OPEN_SMART_FARM',
          sound:     'default',
          visibility: 'public' as any,
        },
      },
      apns: {
        payload: { aps: { badge: 1, sound: 'default', category: 'IOT_ALERT' } },
      },
    };

    const sent = await sendFCM(user.fcmToken, message);
    console.log(`[IOT-PUSH] ${sent ? 'Sent' : 'Simulated'} | ${alertType} | ${deviceName} on ${pondName}`);
    res.json({ sent, simulated: !sent, alertType });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IoT DEVICE STATUS QUERY ──────────────────────────────────────────────────
// GET /api/iot/status/:userId
// Returns connection health snapshot for all devices belonging to this user's ponds.
// In production, this would query a real IoT broker (MQTT / Firebase RTDB).
// Currently derives status from pond.sensorId presence + simulated signal decay.
app.get('/api/iot/status/:userId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const ponds = await PondMongo.find({ userId: req.user.id, status: 'active' });

    const devices = ponds.flatMap((pond: any) => {
      const doc = Math.floor((Date.now() - new Date(pond.stockingDate || Date.now()).getTime()) / 86400000);
      const aerCount = pond.aerators?.count ?? (doc > 60 ? 5 : doc > 40 ? 3 : doc > 20 ? 2 : 1);
      const hp       = pond.aerators?.hp ?? 1;
      const positions = pond.aerators?.positions ?? [];

      // Sensor device
      const sensor = {
        id:        `sensor-${pond._id}`,
        pondId:    String(pond._id),
        pondName:  pond.name,
        type:      'sensor',
        name:      pond.sensorId ? `Sensor #${pond.sensorId}` : 'Water Sensor',
        sensorId:  pond.sensorId || null,
        signal:    pond.sensorId ? 88 : 0,
        status:    pond.sensorId ? 'online' : 'offline',
        isOn:      !!pond.sensorId,
        power:     5,
        lastSeen:  pond.sensorId ? new Date().toISOString() : null,
      };

      // Aerator devices
      const aerators = Array.from({ length: aerCount }).map((_, ai) => ({
        id:       `aer-${pond._id}-${ai}`,
        pondId:   String(pond._id),
        pondName: pond.name,
        type:     'aerator',
        name:     positions[ai] ? `Aerator – ${positions[ai]}` : `Aerator ${ai + 1}`,
        signal:   pond.sensorId ? 80 + Math.floor(Math.random() * 15) : 60,
        status:   'online',
        isOn:     true,
        power:    hp <= 1 ? 750 : hp <= 2 ? 1100 : hp <= 3 ? 2200 : 3700,
        lastSeen: new Date().toISOString(),
      }));

      return [sensor, ...aerators];
    });

    res.json({ devices, timestamp: new Date().toISOString(), total: devices.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── HARVEST STAGE PUSH NOTIFICATION ─────────────────────────────────────────
// POST /api/push/harvest-update
// Fires an FCM push to the farmer on every harvest status change
const HARVEST_STAGE_META: Record<string, { emoji: string; title: string; body: (pn: string) => string }> = {
  pending:        { emoji: '📋', title: 'Harvest Request Submitted',        body: (p) => `${p}: Your request is live. Waiting for a buyer to accept.` },
  accepted:       { emoji: '🤝', title: 'Buyer Accepted Your Order!',       body: (p) => `${p}: A buyer accepted your harvest. Prepare for quality inspection.` },
  quality_checked:{ emoji: '🔬', title: 'Quality Check Completed ✓',       body: (p) => `${p}: Quality passed! Buyer is proceeding to weigh your harvest.` },
  weighed:        { emoji: '⚖️', title: 'Weighing Done — Rate Check Next',  body: (p) => `${p}: Harvest weighed. Buyer is confirming the final rate per kg.` },
  rate_confirmed: { emoji: '💰', title: 'Rate Confirmed — Harvest Starting!',body: (p) => `${p}: Final rate confirmed. Physical harvest is now beginning!` },
  harvested:      { emoji: '🎣', title: 'Harvest Complete! Payment Soon',   body: (p) => `${p}: Harvest is done! Payment is being processed now.` },
  paid:           { emoji: '💸', title: '💸 Payment Released!',             body: (p) => `${p}: Your payment has been released. Check your wallet!` },
  completed:      { emoji: '🏆', title: 'Harvest Cycle Completed',          body: (p) => `${p}: Cycle archived. Excellent work this season!` },
  cancelled:      { emoji: '❌', title: 'Harvest Order Cancelled',          body: (p) => `${p}: Your harvest order was cancelled. You may submit a new request.` },
};

app.post('/api/push/harvest-update', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { pondId, pondName, requestId, status } = req.body;
    const userId = req.user.id;

    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const user = await UserMongo.findById(userId);

    if (!user?.fcmToken) {
      return res.json({ sent: false, reason: 'No FCM token' });
    }

    const meta = HARVEST_STAGE_META[status];
    if (!meta) return res.json({ sent: false, reason: 'Unknown status' });

    // Rich harvest stage image per status
    const stageImages: Record<string, string> = {
      pending:         'https://aquagrow.onrender.com/assets/push/harvest_pending.png',
      accepted:        'https://aquagrow.onrender.com/assets/push/harvest_accepted.png',
      quality_checked: 'https://aquagrow.onrender.com/assets/push/harvest_quality.png',
      weighed:         'https://aquagrow.onrender.com/assets/push/harvest_weighed.png',
      rate_confirmed:  'https://aquagrow.onrender.com/assets/push/harvest_rate.png',
      harvested:       'https://aquagrow.onrender.com/assets/push/harvest_done.png',
      paid:            'https://aquagrow.onrender.com/assets/push/harvest_paid.png',
      completed:       'https://aquagrow.onrender.com/assets/push/harvest_complete.png',
      cancelled:       'https://aquagrow.onrender.com/assets/push/harvest_cancelled.png',
    };
    const harvestStageColors: Record<string, string> = {
      pending: '#6366F1', accepted: '#10B981', quality_checked: '#0EA5E9',
      weighed: '#F59E0B', rate_confirmed: '#8B5CF6', harvested: '#EC4899',
      paid: '#22C55E', completed: '#64748B', cancelled: '#EF4444',
    };
    const stageImg   = stageImages[status] ?? 'https://aquagrow.onrender.com/assets/push/harvest_done.png';
    const stageColor = harvestStageColors[status] ?? '#10B981';
    const msgBody    = meta.body(pondName || 'Your Pond');

    const msgPayload: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title:    `${meta.emoji} ${meta.title}`,
        body:     msgBody,
        imageUrl: stageImg,
      },
      data: {
        type: 'harvest_update',
        pondId:    String(pondId || ''),
        pondName:  String(pondName || ''),
        requestId: String(requestId || ''),
        status:    String(status),
        deepLink:  `/ponds/${pondId}/tracking`,
      },
      android: {
        priority: 'high',
        ttl: 86400000,  // 24h — harvest is time-sensitive
        notification: {
          channelId: 'aquagrow-harvest',
          color:     stageColor,
          icon:      'ic_stat_aquagrow',
          tag:       `harvest-${requestId}`,
          ticker:    `AquaGrow Harvest: ${meta.title}`,
          notificationCount: 1,
          clickAction: 'OPEN_HARVEST_TRACKING',
          sound:     status === 'paid' || status === 'harvested' ? 'success_chime' : 'alert_sound',
          visibility: 'public' as any,
          body:      `${msgBody}\n\n🐟 Pond: ${pondName || 'Your Pond'}\nTap to track your harvest live →`,
          imageUrl:  stageImg,
          defaultVibrateTimings: true,
          defaultLightSettings:  true,
        },
      },
      apns: {
        payload: { aps: { badge: 1, sound: 'default', category: 'HARVEST_UPDATE' } },
      },
    };

    const sent = await sendFCM(user.fcmToken, msgPayload);
    console.log(`[HARVEST-PUSH] ${sent ? 'Sent' : 'Simulated'} → ${user.name || userId} | ${pondName} | ${status}`);
    res.json({ sent, simulated: !sent });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


import admin from 'firebase-admin';

let adminStorage: ReturnType<typeof admin.storage> | null = null;

// ─── Firebase Admin Setup (for Push Notifications + Storage uploads) ─────────
// Note: In Production, set FIREBASE_SERVICE_ACCOUNT_KEY in .env
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'aquagrow-37a3e.firebasestorage.app',
    });
    adminStorage = admin.storage();
    console.log('[FCM Engine] Initialized Successfully');
    console.log('[Storage] Admin Storage ready for community image uploads');
  } else {
    console.warn('[FCM Engine] No service account found. Push notifications will be simulated/logged only.');
  }
} catch (e) {
  console.warn('[FCM Engine] Initialization skipped (service account invalid or missing)');
}

// ─── Push daemon (Auto-Alert Engine) ──────────────────────────────────────────
const runPushEngine = async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();

    // Simulate Amavasya check (Simplified logic for demonstration)
    // Real logic would use a lunar calendar library
    const isAmavasya = now.getDate() === 1 || now.getDate() === 29;

    console.log(`[Push Engine] Scanning active ponds at ${now.toLocaleTimeString()}...`);

    const users = await UserMongo.find({});
    for (const u of users) {
      if (!u.fcmToken || !u.notifications) continue;

      const ponds = await PondMongo.find({ userId: u._id || u.id });

      for (const p of ponds) {
        if (p.status !== 'active' || !p.stockingDate) continue;

        // Calculate DOC (Days of Culture)
        const stocking = new Date(p.stockingDate);
        const diffMs = Math.abs(now.getTime() - stocking.getTime());
        const doc = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let alertTitle = '';
        let alertBody = '';

        // ─── AERATOR STAGE CHECK (Every 20 DOC) ─────────────────────────────
        const stage = Math.ceil(doc / 20);
        const stageStartDoc = (stage - 1) * 20 + 1;
        const isAeratorDue = doc >= stageStartDoc && doc <= stageStartDoc + 2;
        const pondAeratorLastDoc = (p as any).aerators?.lastDoc ?? 0;
        const lastStage = Math.ceil(pondAeratorLastDoc / 20);
        const aeratorNotUpdated = lastStage < stage;
        const snoozedUntil = (p as any).aeratorSnoozedUntil;
        const isSnoozed = snoozedUntil && new Date(snoozedUntil) > now;

        if (isAeratorDue && aeratorNotUpdated && !isSnoozed && doc > 0) {
          const stageLabel = doc <= 20 ? 'Nursery Stage' : doc <= 40 ? 'Early Growth Stage' : doc <= 60 ? 'Mid Growth Stage' : 'Pre-Harvest Stage';
          const aeratorMsg: admin.messaging.Message = {
            token: u.fcmToken!,
            notification: {
              title: `💨 Aerator Check Due — DOC ${doc}`,
              body: `${p.name}: ${stageLabel}. Update aerator count & positions for SOP compliance.`,
            },
            data: {
              type: 'aerator_check',
              pondId: String((p as any)._id || (p as any).id),
              pondName: p.name,
              doc: String(doc),
              deepLink: `/ponds/${(p as any)._id || (p as any).id}?tab=aerators`,
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'aquagrow-aerator',
                color: '#3B82F6',
                icon: 'ic_stat_aquagrow',
                tag: `aerator-${(p as any)._id || (p as any).id}`,
                clickAction: 'OPEN_AERATOR',
                sound: 'default',
                visibility: 'public' as any,
              },
            },
          };
          await sendFCM(u.fcmToken!, aeratorMsg);
          console.log(`[AERATOR-PUSH] Sent stage check to ${u.name || ''} for ${p.name} DOC ${doc}`);
        }

        // ─── CONDITION 1: Rich DOC Milestones ──────────────────────────────────
        const DOC_MILESTONES: Record<number, { title: string; body: string; bigBody: string; img: string; color: string }> = {
          15: {
            title:   '🦐 Day 15 Growth Check — Action Required!',
            body:    `${p.name}: Vitamin C spike time! Check trays & apply immunity booster.`,
            bigBody: `📍 Pond: ${p.name}\n\n✅ Action: Apply Vitamin C (1g/kg feed)\n🌡️ Check feed tray consumption\n💉 Start Immunity Pulse booster today\n\n💪 Your shrimp are in the crucial early window!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc15.png',
            color:   '#22C55E',
          },
          25: {
            title:   '⚠️ DOC 25 — Prepare for Critical Stage!',
            body:    `${p.name}: Apply Immunity Pulse now before DOC 30 risk window opens.`,
            bigBody: `📍 Pond: ${p.name}\n\n⚡ DOC 30 is 5 days away — act now:\n✅ Apply Immunity Pulse in feed\n🔬 Check for tail redness or white spots\n💊 Start probiotic dosing cycle\n\n🎯 Preparation now = higher survival!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc25.png',
            color:   '#F59E0B',
          },
          30: {
            title:   '📈 DOC 30 — Risk Window Starts Now!',
            body:    `${p.name}: High-risk period. Watch for tail redness. Probiotics essential.`,
            bigBody: `📍 Pond: ${p.name}\n\n🚨 Critical transition stage (DOC 30–45):\n🔴 Watch for tail redness / abnormal behavior\n💧 Increase water probiotic frequency\n💨 Run aerators 100% during 3–6 AM\n⚖️ Cross-check FCR and feed consumption\n\n⚠️ Do NOT miss tray checks this week!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc30.png',
            color:   '#EF4444',
          },
          40: {
            title:   '🔴 DOC 40 — Critical Stage Alert!',
            body:    `${p.name}: DOC 40 Vit-Min Booster due. Max aeration 9PM–5AM.`,
            bigBody: `📍 Pond: ${p.name}\n\n💊 Apply Vit-Min Booster in feed (2g/kg)\n💨 Run ALL aerators from 9 PM to 5 AM\n🔍 Check trays every hour during peak\n🧪 Log water quality — pH, DO, Ammonia\n\n🏅 DOC 40 is the make-or-break week. Stay sharp!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc40.png',
            color:   '#EF4444',
          },
          45: {
            title:   '🚨 DOC 45 — Peak WSSV Risk Window!',
            body:    `${p.name}: Maximum virus risk. Max aeration. Reduce feed on cloudy days.`,
            bigBody: `📍 Pond: ${p.name}\n\n🦠 WSSV Risk at MAXIMUM — Act Now:\n💨 Max aeration 24/7 for next 5 days\n⏬ Reduce feed by 10% on cloudy/rainy days\n🔬 Check for white spots on carapace\n📞 Any mortality spike? Call expert immediately!\n\n🛡️ Your vigilance is the vaccine. Don't relax!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc45.png',
            color:   '#EF4444',
          },
          50: {
            title:   '💊 DOC 50 — Liver Tonic Time',
            body:    `${p.name}: Hepatopancreas protection due. Apply Liver Tonic in feed today.`,
            bigBody: `📍 Pond: ${p.name}\n\n💊 Today's Protocol:\n🟡 Apply Liver Tonic (2ml/kg feed)\n⚖️ Check ABW — shrimp should be 5–7g\n💧 Partial water exchange if DO drops\n📋 Record medicine log in AquaGrow\n\n🌱 DOC 50: Hepatopancreas strength = harvest yield!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc50.png',
            color:   '#8B5CF6',
          },
          60: {
            title:   '🔵 DOC 60 — Growth Spurt Phase',
            body:    `${p.name}: 1g growth spike expected! Double Water Probiotic application.`,
            bigBody: `📍 Pond: ${p.name}\n\n🚀 Growth Acceleration Week:\n💧 Apply Water Probiotic Max every 2 days\n🍤 Increase feed ration by 10% if trays are clean\n📏 ABW target: 8–10g by DOC 65\n💨 Night aeration critical — DO must stay above 5\n\n🏆 You're 30 days from a record harvest!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc60.png',
            color:   '#3B82F6',
          },
          70: {
            title:   '🟣 DOC 70 — Final Immunity Boost',
            body:    `${p.name}: Last immunity protocol before harvest prep. Follow SOP.`,
            bigBody: `📍 Pond: ${p.name}\n\n🎯 Final Immunity Protocol:\n💉 Apply final Vit-C + Mineral mix (3g/kg feed)\n⚖️ ABW check — should be 12–15g for Vannamei\n📋 Plan withdrawal schedule (no heavy meds after DOC 80)\n🏪 Check market rates in AquaGrow → Market\n\n🌟 Finish strong. You're almost there!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc70.png',
            color:   '#8B5CF6',
          },
          83: {
            title:   '⏰ DOC 83 — Harvest Prep Has Begun!',
            body:    `${p.name}: STOP heavy medicines. Withdrawal period active.`,
            bigBody: `📍 Pond: ${p.name}\n\n🚫 STOP all heavy medicines now!\n✅ Only Vitamin C + probiotics allowed\n💧 Fresh water exchange: 20–30% today\n⚖️ ABW target: 15–18g before harvest\n📲 Open AquaGrow → Harvest to submit your order\n\n🎣 1 week to go. Prepare your team and buyer!`,
            img:     'https://aquagrow.onrender.com/assets/push/doc83.png',
            color:   '#EC4899',
          },
          90: {
            title:   '🎉 DOC 90 — HARVEST READY! Submit Now!',
            body:    `${p.name}: Zero medicines. Shell quality check done. Submit harvest order!`,
            bigBody: `📍 Pond: ${p.name}\n\n🏆 YOUR SHRIMP ARE HARVEST-READY!\n\n✅ Zero heavy medicines for 7+ days\n🔬 Shell quality: firm & dark\n⚖️ Estimated yield: check ABW × survival%\n📲 AquaGrow → Harvest → New Request\n💰 Check live market rates before pricing\n\n🎊 Congratulations! Another successful cycle!`,
            img:     'https://aquagrow.onrender.com/assets/push/harvest_done.png',
            color:   '#22C55E',
          },
        };

        if (DOC_MILESTONES[doc]) {
          alertTitle = DOC_MILESTONES[doc].title;
          alertBody  = DOC_MILESTONES[doc].body;
        }

        // ─── CONDITION 2: Amavasya / Purnima Lunar Alert ───────────────────────
        else if (isAmavasya && u.notifications.water) {
          alertTitle = `🌑 Amavasya High Molt Risk Tonight!`;
          alertBody  = `${p.name}: Mass molting + DO drop risk. Run 100% aerators. Reduce feed by 25%. Stay alert!`;
        }

        // ─── CONDITION 3: 6 AM Morning Feed Reminder ───────────────────────────
        else if (currentHour === 6 && u.notifications.feed) {
          alertTitle = `🦐 Time to Feed Your Shrimp – Don't Miss It!`;
          alertBody  = `Good morning! First feed time for ${p.name} (DOC ${doc}). Apply 4-5 balanced meals today. Check trays.`;
        }

        // ─── CONDITION 4: 9 PM DO / Aeration Alert ─────────────────────────────
        else if (currentHour === 21 && u.notifications.water && !isAmavasya) {
          alertTitle = `💨 9 PM Aeration Check — ${p.name}`;
          alertBody  = `Night aeration window (9PM–5AM). Maintain DO above 4.5 mg/L. DOC ${doc} — check all aerators now.`;
        }

        // --- DELIVERY LOGIC ---
        if (alertTitle && alertBody) {
          console.log(`[FCM-TRIGGER] Condition Met for ${u.name}: ${alertTitle}`);

          // Determine channel + color + deepLink per alert type
          const isLunar     = alertTitle.includes('Amavasya') || alertTitle.includes('Purnima');
          const isFeed      = alertTitle.includes('Feeding') || alertTitle.includes('Feed');
          const pondIdStr   = String((p as any)._id || (p as any).id || '');
          const channelId   = isLunar ? 'aquagrow-premium' : isFeed ? 'aquagrow-aerator' : 'aquagrow-premium';
          const color       = isLunar ? '#6366F1' : isFeed ? '#F59E0B' : '#10B981';
          const deepLinkUrl = `/ponds/${pondIdStr}`;
          const alertType   = isLunar ? 'lunar' : isFeed ? 'feed_reminder' : 'milestone';

          // Pull rich content from the milestone map if available
          const milestoneData = DOC_MILESTONES[doc] || null;
          const richBody    = milestoneData?.bigBody  || alertBody;
          const richImg     = milestoneData?.img       || (isLunar
            ? 'https://aquagrow.onrender.com/assets/push/lunar_alert.png'
            : isFeed
            ? 'https://aquagrow.onrender.com/assets/push/feed_reminder.png'
            : 'https://aquagrow.onrender.com/assets/push/milestone.png');
          const richColor   = milestoneData?.color || color;

          const fullMessage: admin.messaging.Message = {
            token: u.fcmToken!,
            notification: {
              title:    alertTitle,
              body:     alertBody,
              imageUrl: richImg,
            },
            data: {
              type:     alertType,
              pondId:   pondIdStr,
              pondName: p.name || '',
              doc:      String(doc),
              deepLink: deepLinkUrl,
            },
            android: {
              priority: 'high',
              ttl: 3600000,
              notification: {
                channelId,
                icon:    'ic_stat_aquagrow',
                color:   richColor,
                tag:     `engine-${u._id}-${now.toDateString().replace(/ /g, '_')}`,
                ticker:  `AquaGrow: ${alertTitle}`,
                notificationCount: 1,
                sound:   'alert_sound',
                visibility: 'public' as any,
                clickAction: 'FCM_PLUGIN_ACTIVITY',
                // BigText: expanded notification shows full farming guide
                body:    richBody,
                imageUrl: richImg,
                defaultVibrateTimings: true,
                defaultLightSettings:  true,
              },
            },
            apns: {
              payload: {
                aps: {
                  badge: 1,
                  sound: 'default',
                  category: isLunar ? 'LUNAR_ALERT' : isFeed ? 'FEED_REMINDER' : 'MILESTONE',
                },
              },
            },
          };

          if (admin.apps.length > 0) {
            try {
              await admin.messaging().send(fullMessage);
              console.log(`[FCM-SUCCESS] ✅ Sent to ${u.name} | ${p.name} | ${alertTitle}`);
            } catch (err: any) {
              console.warn('[FCM-ERROR]', err.message);
            }
          } else {
            console.log(`[SIMULATED-PUSH] ${alertTitle}: ${alertBody}`);
          }
        }
      }
    }

    // ─── WEATHER CHECK: per-user, once per daemon cycle ──────────────────────
    // Fetch real OWM weather for each user's location. Send FCM for critical /
    // warning conditions. Suppress if the same alert was already sent in last 3h.
    const weatherSuppressMap = new Map<string, number>(); // userId → last alert timestamp

    for (const u of users) {
      if (!u.fcmToken || !u.notifications) continue;

      const city = (u as any).location || 'Nellore';
      const suppressed = weatherSuppressMap.get(String(u._id));
      if (suppressed && (Date.now() - suppressed) < 3 * 60 * 60 * 1000) continue;

      const weatherBrief = await fetchWeatherBrief(city);
      if (!weatherBrief) continue;

      const wxAlerts = buildWeatherAlerts(weatherBrief);
      // Only push the most severe alert per cycle (avoid notification flood)
      const topAlert = wxAlerts.find(a => a.type === 'critical') ?? wxAlerts.find(a => a.type === 'warning');
      if (!topAlert) continue;

      const wxEmoji = topAlert.type === 'critical' ? '🚨' : '⚠️';
      const wxCondImg = weatherBrief.conditionCode === 'storm'
        ? 'https://aquagrow.onrender.com/assets/push/storm.png'
        : weatherBrief.conditionCode === 'rain'
        ? 'https://aquagrow.onrender.com/assets/push/rain.png'
        : weatherBrief.conditionCode === 'hot'
        ? 'https://aquagrow.onrender.com/assets/push/hot.png'
        : 'https://aquagrow.onrender.com/assets/push/sunny.png';

      const wxMsg: admin.messaging.Message = {
        token: u.fcmToken!,
        notification: {
          title:    `${wxEmoji} ${topAlert.title}`,
          body:     topAlert.body,
          imageUrl: wxCondImg,
        },
        data: {
          type: 'weather_alert',
          alertType:     topAlert.type,
          conditionCode: weatherBrief.conditionCode,
          location:      weatherBrief.location,
          temp:          String(weatherBrief.temp),
          rainPct:       String(weatherBrief.rainPct),
          aqAction:      topAlert.aqAction,
          deepLink:      '/weather',
        },
        android: {
          // ALWAYS high — 'normal' priority messages are NOT delivered to killed apps
          priority: 'high',
          ttl: 3600000,
          notification: {
            channelId: 'aquagrow-premium',
            icon:      'ic_stat_aquagrow',
            color:     topAlert.color,
            tag:       `weather-${String(u._id)}-${now.toDateString()}`,
            ticker:    `AquaGrow Weather: ${topAlert.title}`,
            notificationCount: 1,
            sound:     'alert_sound',
            visibility: 'public' as any,
            clickAction: 'OPEN_WEATHER_ALERTS',
            // BigText expanded — shows full aquaculture action
            body:      `${topAlert.body}\n\n🌾 AQ Action: ${topAlert.aqAction}\n📍 ${weatherBrief.location} | 🌡️ ${weatherBrief.temp}°C | 🌧️ ${weatherBrief.rainPct}%`,
            imageUrl:  wxCondImg,
            defaultVibrateTimings: true,
            defaultLightSettings:  true,
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',          // 10 = immediate, 5 = power-efficient
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
              category: 'WEATHER_ALERT',
              'content-available': 1,       // wake iOS background process
            },
          },
        },
      };

      const wxSent = await sendFCM(u.fcmToken!, wxMsg);
      console.log(`[WEATHER-DAEMON] ${wxSent ? 'Sent' : 'Simulated'} | ${topAlert.type} | ${topAlert.title} → ${u.name || String(u._id)} | ${city}`);
      if (wxSent) weatherSuppressMap.set(String(u._id), Date.now());
    }

  } catch (e) { console.error('[Push Engine Error]', e); }
};

// ─── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aqua Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Aqua Server] Port ${PORT} claimed.`);

    connectDB().then(async () => {
      console.log(`[Aqua Server] ✅ UNIFIED MongoDB (aquagrow) connected — farmers, providers, orders all in ONE DB. AI: ${process.env.GEMINI_API_KEY ? 'READY' : 'MISSING API KEY'}`);

      // connectProviderDB is now a no-op — all provider models use the shared aquagrow DB.
      // Calling it here just fires the info log and returns immediately.
      connectProviderDB().catch(() => {});


      // ── Push engine: every 15 min is sufficient — 2 min caused duplicate engine-alerts
      setInterval(runPushEngine, 15 * 60 * 1000);

      // ── Keep-alive ping: prevents Render free tier from sleeping ──────────
      // Pings own /api/health every 14 minutes so the server never cold-starts
      setInterval(async () => {
        try {
          await fetch(`http://localhost:${PORT}/api/health`);
          console.log('[Keep-Alive] Self-ping OK');
        } catch (e) {
          console.warn('[Keep-Alive] Self-ping failed:', (e as Error).message);
        }
      }, 14 * 60 * 1000);
    }).catch(err => {
      // connectDB already calls process.exit(1) on failure — this catch won't be reached
      console.error('[Aqua Server] Startup DB error:', err.message);
    });
  });
}

// ════════════════════════════════╗
//  SHOP ORDERS                   ║
// ════════════════════════════════╝

// ── Schema ────────────────────────────────────────────────────────────────────
const ShopOrderSchema = new mongoose.Schema({
  farmerId:     { type: String, required: true },
  farmerName:   { type: String, default: '' },
  farmerPhone:  { type: String, default: '' },
  providerId:   { type: String, default: null },   // assigned by backend
  providerName: { type: String, default: '' },
  items: [{
    productId:   String,
    productName: String,
    unit:        String,
    qty:         Number,
    unitPrice:   Number,
    subtotal:    Number,
  }],
  subtotal:     { type: Number, default: 0 },
  deliveryFee:  { type: Number, default: 0 },
  totalAmount:  { type: Number, default: 0 },
  deliveryNote: { type: String, default: '' },
  location:     { lat: Number, lng: Number },      // farmer's GPS at order time
  status:       { type: String, default: 'assigned', enum: ['assigned','confirmed','shipped','delivered','cancelled'] },
  source:       { type: String, default: 'aqua_shop' },
}, { timestamps: true });

const ShopOrder = (mongoose.models['ShopOrder'] ?? mongoose.model('ShopOrder', ShopOrderSchema)) as mongoose.Model<any>;

// ── Helper: find nearest active provider ──────────────────────────────────────
// Simple version: picks first available provider. Extend with geo-query when needed.
const assignNearestProvider = async (lat?: number, lng?: number): Promise<{ id: string; name: string } | null> => {
  try {
    const providers = await UserMongo.find({ role: 'provider' }).select('_id name location').limit(20);
    if (!providers.length) return null;
    if (!lat || !lng) return { id: String(providers[0]._id), name: providers[0].name || 'Provider' };

    // Haversine distance sort
    const withDist = providers.map(p => {
      const pLat = (p as any).location?.lat;
      const pLng = (p as any).location?.lng;
      if (!pLat || !pLng) return { p, dist: 99999 };
      const R = 6371;
      const dLat = (pLat - lat) * Math.PI / 180;
      const dLng = (pLng - lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(pLat*Math.PI/180)*Math.sin(dLng/2)**2;
      return { p, dist: R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) };
    });
    withDist.sort((a, b) => a.dist - b.dist);
    const nearest = withDist[0].p;
    return { id: String(nearest._id), name: nearest.name || 'Provider' };
  } catch { return null; }
};

// ── POST /api/shop/orders — farmer places order ────────────────────────────────
app.post('/api/shop/orders', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const { farmerId, farmerName, farmerPhone, items, subtotal, deliveryFee, totalAmount, deliveryNote, location, source } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // Find nearest provider based on farmer's GPS location
    const provider = await assignNearestProvider(location?.lat, location?.lng);

    const order = await new ShopOrder({
      farmerId:    farmerId || req.user.id,
      farmerName:  farmerName || '',
      farmerPhone: farmerPhone || '',
      providerId:  provider?.id || null,
      providerName:provider?.name || '',
      items,
      subtotal:    subtotal || 0,
      deliveryFee: deliveryFee || 0,
      totalAmount: totalAmount || 0,
      deliveryNote:deliveryNote || '',
      location:    location || {},
      source:      source || 'aqua_shop',
      status:      'assigned',
    }).save();

    console.log(`[ShopOrder] New order ${order._id} assigned to provider ${provider?.name || 'none'}`);
    res.status(201).json({ orderId: order._id, providerId: provider?.id, providerName: provider?.name, status: 'assigned' });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ── GET /api/shop/orders — list orders (role-scoped) ──────────────────────────
app.get('/api/shop/orders', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    let filter: any = {};
    if (req.user.role === 'farmer') {
      filter.farmerId = req.user.id;
    } else if (req.user.role === 'provider') {
      // Provider sees: orders assigned to them OR unassigned (so they can claim)
      filter = {
        $or: [
          { providerId: req.user.id },
          { providerId: null },
          { providerId: { $exists: false } },
        ]
      };
    }
    // admin sees everything (no filter)
    const orders = await ShopOrder.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(orders);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── PATCH /api/shop/orders/:id/claim — provider self-assigns an unassigned order
app.patch('/api/shop/orders/:id/claim', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    if (req.user.role !== 'provider' && !isAdminRole(req.user.role))
      return res.status(403).json({ error: 'Only providers can claim orders' });
    const order = await ShopOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.providerId && order.providerId !== req.user.id)
      return res.status(409).json({ error: 'Order already claimed by another provider' });
    const user = await UserMongo.findById(req.user.id).select('name');
    const updated = await ShopOrder.findByIdAndUpdate(
      req.params.id,
      { providerId: req.user.id, providerName: (user as any)?.name || 'Provider', status: 'confirmed' },
      { new: true }
    );
    console.log(`[ShopOrder] ${req.params.id} claimed by provider ${req.user.id}`);
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/shop/orders/:id — single order ────────────────────────────────────
app.get('/api/shop/orders/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const order = await ShopOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── PATCH /api/shop/orders/:id/status — provider/admin updates delivery stage ─
app.patch('/api/shop/orders/:id/status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const { status } = req.body;
    const allowed = ['assigned','confirmed','shipped','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });

    const order = await ShopOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    console.log(`[ShopOrder] ${order._id} → ${status} by ${req.user.id}`);
    res.json(order);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── PATCH /api/shop/orders/:id/assign — admin reassigns to different provider ──
app.patch('/api/shop/orders/:id/assign', authenticate, requireAnyAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const { providerId, providerName } = req.body;
    if (!providerId) return res.status(400).json({ error: 'providerId is required' });
    const order = await ShopOrder.findByIdAndUpdate(req.params.id, { providerId, providerName: providerName || '' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Community Image Upload Proxy ──────────────────────────────────────────────
// Client sends base64 → server uploads to Firebase Storage → returns public URL.
// This BYPASSES the CORS issue entirely since the upload happens server-to-server.
app.post('/api/community/upload-image', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { base64Image, channel = 'general', mimeType = 'image/jpeg' } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image is required' });

    // Strip data URL prefix if present
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max 8 MB)' });
    }

    // Use Firebase Admin Storage to upload
    const bucket = adminStorage.bucket();
    const ext = mimeType.split('/')[1] || 'jpg';
    const fileName = `community_images/${channel}/${Date.now()}_${req.user.id}.${ext}`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      resumable: false,
    });

    // Make the file publicly readable and get the URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    res.json({ url: publicUrl });
  } catch (e: any) {
    console.error('[CommunityUpload] Error:', e.message);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
});

export default app;
