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
import { User as UserMongo, Subscription as SubscriptionMongo, RefreshToken, connectDB, Pond as PondMongo, FeedLog as FeedLogMongo, MedicineLog as MedicineLogMongo, WaterLog as WaterLogMongo, SOPLog as SOPLogMongo, Expense as ExpenseMongo, HarvestRequest } from './db.js';
import { apiLimiter, authenticate, requireRole, requireSelf } from './middleware/auth.js';
import { GoogleGenAI } from "@google/genai";
import authRoutes from './routes/auth.js';


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

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', db: mongoose.connection.readyState })
);

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
    res.json(updated);
  } catch (e) { res.status(400).json({ error: e.message }); }
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

    // ── Auto-push to farmer when status changes (provider action) ──────────
    if (updates.status && updated) {
      try {
        const farmerUserId = updated.userId?.toString();
        if (!farmerUserId) return;

        const farmer = await UserMongo.findById(farmerUserId);
        if (!farmer?.fcmToken) return;

        // Fetch pond name
        const pond = await PondMongo.findById(updated.pondId);
        const pondName = pond?.name || 'Your Pond';

        const STAGE: Record<string, { emoji: string; title: string; body: string }> = {
          accepted:        { emoji: '🤝', title: 'Buyer Accepted Your Order!',         body: `${pondName}: A buyer accepted. Prepare for quality inspection.` },
          quality_checked: { emoji: '🔬', title: 'Quality Check Done ✓',              body: `${pondName}: Quality passed! Weighing is next.` },
          weighed:         { emoji: '⚖️', title: 'Weighing Complete',                  body: `${pondName}: Harvest weighed. Rate confirmation in progress.` },
          rate_confirmed:  { emoji: '💰', title: 'Rate Confirmed — Harvest Starting!', body: `${pondName}: Final rate agreed. Harvest is starting now!` },
          harvested:       { emoji: '🎣', title: 'Harvest Done! Payment Pending',      body: `${pondName}: Harvest is complete! Your payment is being processed.` },
          paid:            { emoji: '💸', title: '💸 Payment Released!',               body: `${pondName}: Payment has been released to your account!` },
          completed:       { emoji: '🏆', title: 'Harvest Cycle Archived',             body: `${pondName}: Cycle complete. Well done this season!` },
          cancelled:       { emoji: '❌', title: 'Order Cancelled by Buyer',           body: `${pondName}: Your harvest order was cancelled. You may relist.` },
        };

        const meta = STAGE[updates.status];
        if (meta) {
          await sendFCM(farmer.fcmToken, {
            token: farmer.fcmToken,
            notification: { title: `${meta.emoji} ${meta.title}`, body: meta.body },
            data: {
              type: 'harvest_update',
              pondId: String(updated.pondId || ''),
              pondName,
              requestId: String(updated._id || id),
              status: updates.status,
              deepLink: `/ponds/${updated.pondId}/tracking`,
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'aquagrow-harvest',
                color: '#10B981',
                icon: 'ic_launcher',
                tag: `harvest-${id}`,
                clickAction: 'OPEN_HARVEST_TRACKING',
              },
            },
          });
          console.log(`[HARVEST-PUSH] Auto-sent → ${farmer.name || farmerUserId} | ${pondName} | ${updates.status}`);
        }
      } catch (pushErr: any) {
        console.warn('[HARVEST-PUSH] Auto-push failed:', pushErr.message);
      }
    }
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
const GEMINI_MODEL = 'gemini-2.0-flash';

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
    console.error('[AI-Health Error]', e.message);
    const is503 = e.message?.includes('503') || e.message?.includes('UNAVAILABLE');
    res.status(is503 ? 503 : 500).json({ error: is503 ? 'AI server overloaded. Please retry.' : e.message });
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
    console.error('[AI-Water Error]', e.message);
    res.status(500).json({ error: e.message });
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
          icon: 'ic_launcher',
          tag: `aerator-${pondId}`,
          // Android 13+ action buttons
          clickAction: 'OPEN_AERATOR',
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
    const { count, hp, positions, addedNew, doc } = req.body;

    const now = new Date().toISOString();
    const aeratorUpdate = {
      aerators: {
        count: Number(count) || 0,
        hp: Number(hp) || 1,
        positions: positions || [],
        addedNew: Boolean(addedNew),
        lastUpdated: now,
        lastDoc: Number(doc),
        log: [{ doc: Number(doc), date: now, count: Number(count) || 0, hp: Number(hp) || 1, positions: positions || [], addedNew: Boolean(addedNew) }],
      },
    };

    if (mongoose.connection.readyState !== 1) return dbOffline(res);


    // With MongoDB — merge log
    const pond = await PondMongo.findById(id);
    if (!pond) return res.status(404).json({ error: 'Pond not found' });
    const existingLog = (pond as any).aerators?.log || [];
    aeratorUpdate.aerators.log = [...existingLog, aeratorUpdate.aerators.log[0]];

    const updated = await PondMongo.findByIdAndUpdate(id, { aerators: aeratorUpdate.aerators }, { new: true });
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
          icon: 'ic_launcher',
          tag: `harvest-${requestId}`,
          clickAction: 'OPEN_HARVEST_TRACKING',
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
                icon: 'ic_launcher',
                tag: `aerator-${(p as any)._id || (p as any).id}`,
                clickAction: 'OPEN_AERATOR',
              },
            },
          };
          await sendFCM(u.fcmToken!, aeratorMsg);
          console.log(`[AERATOR-PUSH] Sent stage check to ${u.name || ''} for ${p.name} DOC ${doc}`);
        }

        // ─── CONDITION 1: DOC Milestone (e.g. DOC 30) ───
        if (doc === 30) {
          alertTitle = `Milestone: DOC 30! 📈`;
          alertBody = `Your prawns in ${p.name} have reached 30 days. Time for a transition to mineral-rich feed.`;
        }

        // ─── CONDITION 2: Amavasya Lunar Alert ───
        else if (isAmavasya && u.notifications.water) {
          alertTitle = `Amavasya Risk Alert 🌑`;
          alertBody = `High risk of mass molting and DO drop tonight in ${p.name}. Ensure all aerators are functional.`;
        }

        // ─── CONDITION 3: 6 AM Feeding Reminder ───
        else if (currentHour === 6 && u.notifications.feed) {
          alertTitle = `Feeding Reminder 🥣`;
          alertBody = `Good morning! It's 6:00 AM. Time for the first feed in ${p.name}.`;
        }

        // --- DELIVERY LOGIC ---
        if (alertTitle && alertBody) {
          console.log(`[FCM-TRIGGER] Condition Met for ${u.name}: ${alertTitle}`);

          if (admin.apps.length > 0) {
            const message = {
              notification: { title: alertTitle, body: alertBody },
              token: u.fcmToken,
              android: {
                priority: 'high' as any,
                notification: {
                  channelId: 'aquagrow-premium',
                  icon: 'ic_launcher',
                  color: '#10B981',
                  clickAction: 'FCM_PLUGIN_ACTIVITY',
                  visibility: 'public' as any
                }
              }
            };

            try {
              await admin.messaging().send(message);
              console.log(`[FCM-SUCCESS] Alert sent to ${u.name} for ${p.name}`);
            } catch (err) {
              console.warn('[FCM-ERROR] Peer failure:', err.message);
            }
          } else {
            console.log(`[SIMULATED-PUSH] ${alertTitle}: ${alertBody}`);
          }
        }
      }
    }
  } catch (e) { console.error('[Push Engine Error]', e); }
};

// ─── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aqua Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Aqua Server] Port ${PORT} claimed.`);

    connectDB().then(() => {
      console.log(`[Aqua Server] ✅ MongoDB connected. AI: ${process.env.GEMINI_API_KEY ? 'READY' : 'MISSING API KEY'}`);
      setInterval(runPushEngine, 120000);
    }).catch(err => {
      // connectDB already calls process.exit(1) on failure — this catch won't be reached
      console.error('[Aqua Server] Startup DB error:', err.message);
    });
  });
}

export default app;
