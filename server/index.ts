import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User as UserMongo, Subscription as SubscriptionMongo, Pond as PondMongo, FeedLog as FeedLogMongo, MedicineLog as MedicineLogMongo, WaterLog as WaterLogMongo, SOPLog as SOPLogMongo, Expense as ExpenseMongo, RefreshToken, connectDB, isMock, MockDB } from './db.js';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

dotenv.config();
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

app.use(express.json({ limit: '50kb' }));
app.use(cors({ origin: true, credentials: true }));

// ─── Refresh token persistence logic ─────────────────────────────────────────
const saveRefreshToken = async (userId: string, token: string) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days refresh
  if (isMock()) {
    await MockDB.save('refreshTokens', { userId: String(userId), token, expiryDate });
  } else {
    await new RefreshToken({ userId, token, expiryDate }).save();
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const signAccess  = (p: any) => jwt.sign(p, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
const signRefresh = (p: any) => jwt.sign(p, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);

// ─── Rate limiters ────────────────────────────────────────────────────────────
// Auth: 10 req / 15 min  — brute-force protection
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { error: 'Too many attempts. Try again in 15 minutes.' }, standardHeaders: true, legacyHeaders: false });
// General API: 120 req / min per IP
const apiLimiter  = rateLimit({ windowMs: 60*1000, max: 120, message: { error: 'Rate limit exceeded.' }, standardHeaders: true, legacyHeaders: false });

app.use('/api', apiLimiter);

// ─── JWT Auth middleware ──────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (isMock() && authHeader && authHeader.split(' ')[1] === 'mock_access_token') {
    req.user = { id: 'preview_user', role: 'farmer', subscriptionStatus: 'pro_gold' };
    return next();
  }
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
};

// ─── Role guard ───────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ error: 'Access denied. Required role: ' + roles.join('|') });
  next();
};

// Own-resource guard — user can only access their own data (admin bypasses)
const requireSelf = (req, res, next) => {
  const id = req.params.userId || req.body?.userId;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  if (isMock() && (req.user.id === 'preview_user' || (req.user.id && req.user.id.startsWith('id_')))) {
    return next();
  }

  if (req.user.id !== id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Cannot access another user data' });
  next();
};

// ─── Feature / subscription guard ────────────────────────────────────────────
const checkFeature = (feature) => async (req, res, next) => {
  const sub = isMock()
    ? await MockDB.findOne('subscriptions', { userId: req.user.id })
    : await SubscriptionMongo.findOne({ userId: req.user.id });
  if (!sub || sub.status !== 'active' || !sub.features.includes(feature))
    return res.status(403).json({ error: 'Feature requires higher plan: ' + feature });
  next();
};

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', db: mongoose.connection.readyState, mock: isMock() })
);

// ═══════════════════════════════╗
//  AUTH                          ║
// ═══════════════════════════════╝

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, mobile, password, location, role, farmSize, language } = req.body;
    if (!name || !mobile || !password)
      return res.status(400).json({ error: 'name, mobile and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(password, 12);
    let user, sub;

    if (isMock()) {
      if (await MockDB.findOne('users', { phoneNumber: mobile }))
        return res.status(409).json({ error: 'Phone number already registered' });
      user = await MockDB.save('users', { name, phoneNumber: mobile, password: hash, location, role: role||'farmer', farmSize: +farmSize||0, language: language||'English', subscriptionStatus: 'free' });
      sub  = await MockDB.save('subscriptions', { userId: user._id, planName: 'free', status: 'active', features: ['basic_dashboard','pond_management'] });
    } else {
      if (mongoose.connection.readyState !== 1) throw new Error('DB not ready');
      if (await UserMongo.findOne({ phoneNumber: mobile }))
        return res.status(409).json({ error: 'Phone number already registered' });
      user = await new UserMongo({ name, phoneNumber: mobile, password: hash, location, role: role||'farmer', farmSize: farmSize||0, language: language||'English', subscriptionStatus: 'free' }).save();
      sub  = await new SubscriptionMongo({ userId: user._id, planName: 'free', status: 'active', features: ['basic_dashboard','pond_management'] }).save();
    }

    const access  = signAccess({ id: user._id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id: user._id });
    await saveRefreshToken(user._id, refresh);
    res.status(201).json({ user, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password)
      return res.status(400).json({ error: 'mobile and password are required' });

    let user, sub;
    if (isMock()) {
      user = await MockDB.findOne('users', { phoneNumber: mobile });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      // Support legacy plain-text passwords (migration path to hashed)
      const ok = user.password?.startsWith('$2')
        ? await bcrypt.compare(password, user.password)
        : password === user.password;
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      sub = await MockDB.findOne('subscriptions', { userId: user._id });
    } else {
      user = await UserMongo.findOne({ phoneNumber: mobile });
      if (!user || !await bcrypt.compare(password, user.password))
        return res.status(401).json({ error: 'Invalid credentials' });
      sub = await SubscriptionMongo.findOne({ userId: user._id });
    }

    const id      = user._id || user.id;
    const access  = signAccess({ id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);
    res.json({ user, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e) { res.status(500).json({ error: 'Internal Server Error' }); }
});

// Rotate access token using refresh token
app.post('/api/auth/refresh', authLimiter, async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(401).json({ error: 'Missing refresh token' });
  
  try {
    const p = jwt.verify(refresh_token, REFRESH_SECRET) as any;
    const storedToken = isMock() 
      ? await MockDB.findOne('refreshTokens', { token: refresh_token })
      : await RefreshToken.findOne({ token: refresh_token });

    if (!storedToken) return res.status(401).json({ error: 'Refresh token not recognized' });
    
    const user = isMock()
      ? await MockDB.findOne('users', { _id: p.id })
      : await UserMongo.findById(p.id);

    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccess = signAccess({ id: user._id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    res.json({ access_token: newAccess });
  } catch (e) {
    if (isMock()) {
      await MockDB.delete('refreshTokens', { token: refresh_token });
    } else {
      await RefreshToken.deleteMany({ token: refresh_token });
    }
    res.status(401).json({ error: 'Refresh token expired or invalid. Please login again.' });
  }
});

// Revoke refresh token on logout
app.post('/api/auth/logout', authenticate, async (req, res) => {
  if (req.body?.refresh_token) {
    if (isMock()) {
      await MockDB.delete('refreshTokens', { token: req.body.refresh_token });
    } else {
      await RefreshToken.deleteMany({ token: req.body.refresh_token });
    }
  }
  res.json({ message: 'Logged out successfully' });
});

// ═══════════════════════════════╗
//  SUBSCRIPTION                  ║
// ═══════════════════════════════╝

app.post('/api/subscription/upgrade', authenticate, async (req, res) => {
  try {
    const { planName } = req.body;
    const userId = req.user.id;
    const features = planName === 'pro'
      ? ['basic_dashboard','pond_management','advanced_analytics','agent_access']
      : planName === 'enterprise'
      ? ['basic_dashboard','pond_management','advanced_analytics','agent_access','expert_consultation','market_trends']
      : ['basic_dashboard','pond_management'];
    const end = new Date(Date.now() + 365*24*60*60*1000);
    let sub;
    if (isMock()) {
      sub = await MockDB.findOneAndUpdate('subscriptions', { userId }, { planName, features, status: 'active', endDate: end });
      await MockDB.findOneAndUpdate('users', { _id: userId }, { subscriptionStatus: planName === 'free' ? 'free' : 'pro' });
    } else {
      sub = await SubscriptionMongo.findOneAndUpdate({ userId }, { planName, features, status: 'active', endDate: end }, { upsert: true, new: true });
      await UserMongo.findByIdAndUpdate(userId, { subscriptionStatus: planName === 'free' ? 'free' : 'pro' });
    }
    res.json(sub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/:userId/subscription', authenticate, requireSelf, async (req, res) => {
  try {
    const sub = isMock()
      ? await MockDB.findOne('subscriptions', { userId: req.params.userId })
      : await SubscriptionMongo.findOne({ userId: req.params.userId });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json(sub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  NOTIFICATIONS                 ║
// ═══════════════════════════════╝

app.put('/api/user/:userId/notifications', authenticate, requireSelf, async (req, res) => {
  try {
    const { fcmToken, notifications } = req.body;
    const user = isMock()
      ? await MockDB.findOneAndUpdate('users', { _id: req.params.userId }, { fcmToken, notifications })
      : await UserMongo.findByIdAndUpdate(req.params.userId, { fcmToken, notifications }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  PONDS                         ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/ponds', authenticate, requireSelf, async (req, res) => {
  try {
    const ponds = isMock()
      ? await MockDB.find('ponds', { userId: req.params.userId })
      : await PondMongo.find({ userId: req.params.userId });
    res.json(ponds);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ponds', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (isMock()) return res.json(await MockDB.save('ponds', data));
    res.json(await new PondMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/ponds/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (isMock()) {
      const pond = await MockDB.findOne('ponds', { _id: id });
      if (!pond) return res.status(404).json({ error: 'Pond not found' });
      if (pond.userId !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({ error: 'Access denied' });
      await MockDB.delete('ponds', { _id: id });
      await MockDB.delete('feedLogs', { pondId: id });
      await MockDB.delete('medicineLogs', { pondId: id });
    } else {
      const pond = await PondMongo.findById(id);
      if (!pond) return res.status(404).json({ error: 'Pond not found' });
      if (String(pond.userId) !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({ error: 'Access denied' });
      await PondMongo.findByIdAndDelete(id);
      await FeedLogMongo.deleteMany({ pondId: id });
      await MedicineLogMongo.deleteMany({ pondId: id });
      await WaterLogMongo.deleteMany({ pondId: id });
    }
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  WATER LOGS                    ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/water-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = isMock()
      ? await MockDB.find('waterLogs', { userId: req.params.userId })
      : await WaterLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/water-logs', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (isMock()) return res.json(await MockDB.save('waterLogs', data));
    res.json(await new WaterLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  SOP LOGS                      ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/sop-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = isMock()
      ? await MockDB.find('sopLogs', { userId: req.params.userId })
      : await SOPLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sop-logs', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (isMock()) return res.json(await MockDB.save('sopLogs', data));
    res.json(await new SOPLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  EXPENSES                      ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/expenses', authenticate, requireSelf, async (req, res) => {
  try {
    const expenses = isMock()
      ? await MockDB.find('expenses', { userId: req.params.userId })
      : await ExpenseMongo.find({ userId: req.params.userId });
    res.json(expenses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (isMock()) return res.json(await MockDB.save('expenses', data));
    res.json(await new ExpenseMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  FEED LOGS                     ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/feed-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = isMock()
      ? await MockDB.find('feedLogs', { userId: req.params.userId })
      : await FeedLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/feed-logs', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (isMock()) return res.json(await MockDB.save('feedLogs', data));
    res.json(await new FeedLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════╗
//  MEDICINE LOGS                 ║
// ═══════════════════════════════╝

app.get('/api/user/:userId/medicine-logs', authenticate, requireSelf, async (req, res) => {
  try {
    const logs = isMock()
      ? await MockDB.find('medicineLogs', { userId: req.params.userId })
      : await MedicineLogMongo.find({ userId: req.params.userId });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/medicine-logs', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (isMock()) return res.json(await MockDB.save('medicineLogs', data));
    res.json(await new MedicineLogMongo(data).save());
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Admin: list all users ────────────────────────────────────────────────────
app.get('/api/admin/users', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const users = isMock()
      ? await MockDB.find('users', {})
      : await UserMongo.find({}, '-password');
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

    const users = isMock() ? await MockDB.find('users', {}) : await UserMongo.find({});
    for (const u of users) {
      if (!u.fcmToken || !u.notifications) continue;
      
      const ponds = isMock()
        ? await MockDB.find('ponds', { userId: u._id||u.id })
        : await PondMongo.find({ userId: u._id||u.id });

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
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log('Server is running and listening on port ' + PORT);
      // Run the engine every 2 minutes for check-conditions
      setInterval(runPushEngine, 120000);
    });
  });
}

export default app;
