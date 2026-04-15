import express, { Request } from 'express';
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
import { User as UserMongo, Subscription as SubscriptionMongo, RefreshToken, connectDB, Pond as PondMongo, FeedLog as FeedLogMongo, MedicineLog as MedicineLogMongo, WaterLog as WaterLogMongo, SOPLog as SOPLogMongo, Expense as ExpenseMongo, HarvestRequest, ROIEntry as ROIEntryMongo, NotificationLog as NotificationLogMongo, AeratorLog as AeratorLogMongo } from './db.js';
import { apiLimiter, authenticate, requireRole, requireSelf } from './middleware/auth.js';
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


// ─── Admin: list all users ────────────────────────────────────────────────────
app.get('/api/admin/users', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const users = await UserMongo.find({}, '-password');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
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

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: { title: `${emoji} ${alertTitle}`, body: alertBody },
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
        notification: {
          channelId:   'aquagrow-premium',
          color,
          icon:        'ic_stat_aquagrow',
          tag:         `weather-${userId}`,
          clickAction: 'OPEN_WEATHER_ALERTS',
          sound:       'default',
          visibility:  'public' as any,
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

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title: `💨 Aerator Check Due — DOC ${doc}`,
        body: `${pondName}: ${stageLabel}. Please update your aerator count, HP & positions.`,
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
        notification: {
          channelId: 'aquagrow-aerator',
          color: '#3B82F6',
          icon: 'ic_stat_aquagrow',
          tag: `aerator-${pondId}`,
          clickAction: 'OPEN_AERATOR',
          sound: 'default',
          visibility: 'public' as any,
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

    const msgPayload: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title: `${meta.emoji} ${meta.title}`,
        body: meta.body(pondName || 'Your Pond'),
      },
      data: {
        type: 'harvest_update',
        pondId: String(pondId || ''),
        pondName: String(pondName || ''),
        requestId: String(requestId || ''),
        status: String(status),
        deepLink: `/ponds/${pondId}/tracking`,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'aquagrow-harvest',
          color: '#10B981',
          icon: 'ic_stat_aquagrow',
          tag: `harvest-${requestId}`,
          clickAction: 'OPEN_HARVEST_TRACKING',
          sound: 'default',
          visibility: 'public' as any,
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

// ─── Firebase Admin Setup (for Push Notification Engine) ────────────────────
// Note: In Production, set FIREBASE_SERVICE_ACCOUNT_KEY in .env
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[FCM Engine] Initialized Successfully');
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
        const DOC_MILESTONES: Record<number, { title: string; body: string }> = {
          15:  { title: '🦐 DOC 15 — First Growth Check!',        body: `${p.name}: Vitamin C spike time! Check feed tray consumption & apply immunity booster.` },
          25:  { title: '⚠️ DOC 25 — Immunity Pulse Due',          body: `${p.name}: Prepare for critical DOC 30. Apply Immunity Pulse in feed now!` },
          30:  { title: '📈 DOC 30 — Risk Transition Stage',       body: `${p.name}: High-risk period begins! Watch for tail redness. Increase water probiotics.` },
          40:  { title: '🔴 DOC 40 — Critical Stage Alert!',       body: `${p.name}: DOC 40 Vit-Min Booster due. Run max aeration 9PM–5AM. Check trays hourly.` },
          45:  { title: '🚨 DOC 45 — WSSV Risk Peak!',            body: `${p.name}: Maximum WSSV risk window. Max aeration. Reduce feed 10% on cloudy days.` },
          50:  { title: '💊 DOC 50 — Liver Tonic Time',           body: `${p.name}: Hepatopancreas protection due. Apply Liver Tonic in feed today.` },
          60:  { title: '🔵 DOC 60 — Growth Spurt Phase',         body: `${p.name}: 1g growth spike expected! Apply Water Probiotic Max every 2 days.` },
          70:  { title: '🟣 DOC 70 — Final Immunity Boost',       body: `${p.name}: Last immunity boost before harvest stage. Follow SOP withdrawal plan.` },
          83:  { title: '⏰ DOC 83 — Harvest Prep Begins',        body: `${p.name}: STOP heavy medicines. Withdrawal period active. Fresh water exchange soon.` },
          90:  { title: '🎉 DOC 90 — Harvest Ready!',             body: `${p.name}: Zero heavy medicines now. Shell quality check. Submit harvest order when ready!` },
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

          const fullMessage: admin.messaging.Message = {
            token: u.fcmToken!,
            // notification key → OS shows system notification in background/killed state ✅
            notification: {
              title: alertTitle,
              body: alertBody,
            },
            // data key → available to app on tap for deep-linking & custom handling ✅
            data: {
              type: alertType,
              pondId: pondIdStr,
              pondName: p.name || '',
              doc: String(doc),
              deepLink: deepLinkUrl,
            },
            android: {
              priority: 'high',   // CRITICAL: delivers even when screen is off ✅
              ttl: 3600000,       // 1 hour TTL — discard stale alert after 1h
              notification: {
                channelId,
                icon: 'ic_stat_aquagrow',
                color,
                tag: `engine-${u._id}-${now.toDateString().replace(/ /g, '_')}`,
                sound: 'alert_sound', // res/raw/alert_sound.mp3
                visibility: 'public' as any,
                clickAction: 'FCM_PLUGIN_ACTIVITY',
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

      const wxMsg: admin.messaging.Message = {
        token: u.fcmToken!,
        notification: {
          title: `${topAlert.type === 'critical' ? '🚨' : '⚠️'} ${topAlert.title}`,
          body: topAlert.body,
        },
        data: {
          type: 'weather_alert',
          alertType:    topAlert.type,
          conditionCode: weatherBrief.conditionCode,
          location:     weatherBrief.location,
          temp:         String(weatherBrief.temp),
          rainPct:      String(weatherBrief.rainPct),
          aqAction:     topAlert.aqAction,
          deepLink:     '/weather',
        },
        android: {
          priority: topAlert.type === 'critical' ? 'high' : 'normal',
          ttl: 3600000,
          notification: {
            channelId: 'aquagrow-premium',
            icon: 'ic_stat_aquagrow',
            color: topAlert.color,
            tag: `weather-${String(u._id)}-${now.toDateString()}`,
            sound: 'default',
            visibility: 'public' as any,
            clickAction: 'OPEN_WEATHER_ALERTS',
          },
        },
        apns: { payload: { aps: { badge: 1, sound: 'default', category: 'WEATHER_ALERT' } } },
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
      console.log(`[Aqua Server] ✅ Farmer MongoDB (aquagrow) connected. AI: ${process.env.GEMINI_API_KEY ? 'READY' : 'MISSING API KEY'}`);

      // Connect to the separate provider database in parallel
      connectProviderDB().then(() => {
        console.log('[Aqua Server] ✅ Provider MongoDB (aquagrow_providers) connected.');
      }).catch(err => {
        console.error('[Aqua Server] ⚠️  Provider DB connection failed (non-fatal):', err.message);
        // Non-fatal: provider routes will return 503 if DB is down
      });

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
    if (req.user.role !== 'provider' && req.user.role !== 'admin')
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
app.patch('/api/shop/orders/:id/assign', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbOffline(res);
    const { providerId, providerName } = req.body;
    if (!providerId) return res.status(400).json({ error: 'providerId is required' });
    const order = await ShopOrder.findByIdAndUpdate(req.params.id, { providerId, providerName: providerName || '' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default app;
