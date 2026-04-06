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
import fs from 'fs';
import path from 'path';
import { User as UserMongo, Subscription as SubscriptionMongo, RefreshToken, connectDB, Pond as PondMongo, FeedLog as FeedLogMongo, MedicineLog as MedicineLogMongo, WaterLog as WaterLogMongo, SOPLog as SOPLogMongo, Expense as ExpenseMongo } from './db.js';
import { apiLimiter, authenticate, requireRole, requireSelf } from './middleware/auth.js';
import { GoogleGenAI } from "@google/genai";
import authRoutes from './routes/auth.js';

// --- MOCK PERSISTENCE LOGIC ---
const DB_FILE = path.join(process.cwd(), 'server', 'db.json');
const getMockData = () => {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { users: [], ponds: [], subscriptions: [], waterLogs: [], feedLogs: [], medicineLogs: [], sopLogs: [], expenses: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};
const saveMockData = (data: any) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3005;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors({
  origin: [
    'https://aquagrow.onrender.com',
    'https://aqua-grow.vercel.app'
  ],
  credentials: true
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

app.post('/api/subscription/upgrade', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { planName } = req.body;
    const userId = req.user.id;
    const features = planName === 'pro'
      ? ['basic_dashboard', 'pond_management', 'advanced_analytics', 'agent_access']
      : planName === 'enterprise'
        ? ['basic_dashboard', 'pond_management', 'advanced_analytics', 'agent_access', 'expert_consultation', 'market_trends']
        : ['basic_dashboard', 'pond_management'];
    const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const sub = await SubscriptionMongo.findOneAndUpdate({ userId }, { planName, features, status: 'active', endDate: end }, { upsert: true, new: true });
    await UserMongo.findByIdAndUpdate(userId, { subscriptionStatus: planName === 'free' ? 'free' : 'pro' });
    res.json(sub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/:userId/subscription', authenticate, requireSelf, async (req, res) => {
  try {
    const userId = req.params.userId;
    let sub = await SubscriptionMongo.findOne({ userId });

    // Auto-create or return default free plan if missing
    if (!sub) {
      const defaultSub = {
        userId,
        planName: 'free',
        status: 'active',
        features: ['basic_dashboard', 'pond_management'],
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

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
    const ponds = await PondMongo.find({ userId: req.params.userId });
    res.json(ponds);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ponds', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
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

// ═══════════════════════════════╗
//  WATER LOGS                    ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/water-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = await WaterLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/water-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    res.json(await new WaterLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  SOP LOGS                      ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/sop-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = await SOPLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sop-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    res.json(await new SOPLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  EXPENSES                      ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/expenses', authenticate, requireSelf, async (req, res) => {
  try {
    const expenses = await ExpenseMongo.find({ userId: req.params.userId });
    res.json(expenses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    res.json(await new ExpenseMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  FEED LOGS                     ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/feed-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = await FeedLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/feed-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    res.json(await new FeedLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  MEDICINE LOGS                 ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/medicine-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = await MedicineLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/medicine-logs', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    res.json(await new MedicineLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// AI Client Instance
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

app.post('/api/ai/analyze-health', authenticate, async (req, res) => {
  try {
    const { base64Image, language } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'Image is required' });

    const prompt = `
      As a world-class Aquatic Veterinarian specializing in Vannamei Shrimp, analyze this image.
      Look for:
      1. White gut syndrome (WGD) or White fecal strings (WFD).
      2. Shrunken or pale hepatopancreas (Signs of EHP).
      3. White spots on carapace (WSSV).
      4. Redness or deformities (Vibriosis).
      
      Respond only in a strict JSON format:
      {
        "disease": "string (localized in ${language})",
        "confidence": number (0-100),
        "severity": "Safe | Warning | Critical",
        "markerAnalysis": "brief description of what you see",
        "reasoning": "Scientific explanation of clinical symptoms (localized in ${language})",
        "action": "immediate treatment steps (localized in ${language})"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType: 'image/jpeg'
              }
            }
          ]
        }
      ]
    });

    const text = response.text;

    // Final check for valid JSON in response
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    const diagnosis = JSON.parse(jsonStr);

    res.json(diagnosis);
  } catch (e) {
    console.error("AI Analysis Backend Error:", e);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// ─── Admin: list all users ────────────────────────────────────────────────────
app.get('/api/admin/users', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const users = await UserMongo.find({}, '-password');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
      console.log(`[Aqua Server] Database: MONGODB (Online Mode Connect Success)`);
      console.log(`[Aqua Server] AI SDK: ${process.env.GEMINI_API_KEY ? 'READY' : 'MISSING API KEY'}`);
      setInterval(runPushEngine, 120000);
    }).catch(err => {
      console.warn("[Aqua Server] ONLINE DB FAILED. Defaulting to LOCAL MOCK DB (db.json)");
      console.warn("[Reason]:", err.message);
      
      // Seed initial mock file if missing
      getMockData();
    });
  });
}

export default app;
