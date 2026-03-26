import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { User as UserMongo, Subscription as SubscriptionMongo, Pond as PondMongo, FeedLog as FeedLogMongo, MedicineLog as MedicineLogMongo, connectDB, isMock, MockDB } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState, mock: isMock() });
});

// --- AUTHENTICATION ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, mobile, password, location, role, farmSize, language } = req.body;
    
    let user;
    if (isMock()) {
       user = await MockDB.save('users', { name, phoneNumber: mobile, password, location, role, farmSize: Number(farmSize), language, subscriptionStatus: 'free' });
       const sub = await MockDB.save('subscriptions', { userId: user._id, planName: 'free', status: 'active', features: ['basic_dashboard', 'pond_management'] });
       return res.json({ user, subscription: sub });
    } else {
       if (mongoose.connection.readyState !== 1) throw new Error('DB not ready');
       user = new UserMongo({ name, phoneNumber: mobile, password, location, role, farmSize: farmSize || 0, language: language || 'English', subscriptionStatus: 'free' });
       await user.save();
       const subscription = new SubscriptionMongo({ userId: user._id, planName: 'free', status: 'active', features: ['basic_dashboard', 'pond_management'] });
       await subscription.save();
       return res.json({ user, subscription });
    }
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    let user;
    let subscription;

    if (isMock()) {
      user = await MockDB.findOne('users', { phoneNumber: mobile, password });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      subscription = await MockDB.findOne('subscriptions', { userId: user._id });
    } else {
      user = await UserMongo.findOne({ phoneNumber: mobile, password });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      subscription = await SubscriptionMongo.findOne({ userId: user._id });
    }
    
    res.json({ user, subscription });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// --- SUBSCRIPTION MANAGEMENT ---

app.post('/api/subscription/upgrade', async (req, res) => {
  try {
    const { userId, planName } = req.body;
    const features = planName === 'pro' 
      ? ['basic_dashboard', 'pond_management', 'advanced_analytics', 'agent_access']
      : planName === 'enterprise'
      ? ['basic_dashboard', 'pond_management', 'advanced_analytics', 'agent_access', 'expert_consultation', 'market_trends']
      : ['basic_dashboard', 'pond_management'];

    let sub;
    if (isMock()) {
      sub = await MockDB.findOneAndUpdate('subscriptions', { userId }, { planName, features, status: 'active', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
      await MockDB.findOneAndUpdate('users', { _id: userId }, { subscriptionStatus: planName === 'free' ? 'free' : 'pro' });
    } else {
      sub = await SubscriptionMongo.findOneAndUpdate({ userId }, { planName, features, status: 'active', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, { upsert: true, new: true });
      await UserMongo.findByIdAndUpdate(userId, { subscriptionStatus: planName === 'free' ? 'free' : 'pro' });
    }
    res.json(sub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:userId/subscription', async (req, res) => {
  try {
    const { userId } = req.params;
    const sub = isMock() 
      ? await MockDB.findOne('subscriptions', { userId })
      : await SubscriptionMongo.findOne({ userId });
    
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json(sub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOTIFICATIONS SYNC API ---
app.put('/api/user/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fcmToken, notifications } = req.body;
    let user;
    if (isMock()) {
       user = await MockDB.findOneAndUpdate('users', { _id: userId }, { fcmToken, notifications });
    } else {
       user = await UserMongo.findByIdAndUpdate(userId, { fcmToken, notifications }, { new: true });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to check if user has access to a specific feature
const checkFeature = (feature: string) => async (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'User ID missing in headers' });

  const sub = isMock()
      ? await MockDB.findOne('subscriptions', { userId })
      : await SubscriptionMongo.findOne({ userId });

  if (!sub || sub.status !== 'active' || !sub.features.includes(feature)) {
    return res.status(403).json({ error: `Feature '${feature}' requires a higher subscription plan.` });
  }
  next();
};

// --- POND MANAGEMENT ---

app.get('/api/user/:userId/ponds', async (req, res) => {
  try {
    const { userId } = req.params;
    const ponds = isMock()
        ? await MockDB.find('ponds', { userId })
        : await PondMongo.find({ userId });
    res.json(ponds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ponds', async (req, res) => {
  try {
    if (isMock()) {
      const pond = await MockDB.save('ponds', req.body);
      res.json(pond);
    } else {
      const pond = new PondMongo(req.body);
      await pond.save();
      res.json(pond);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/ponds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMock()) {
      const deleted = await (MockDB as any).delete('ponds', { _id: id });
      if (!deleted) return res.status(404).json({ error: 'Pond not found' });
      
      // Cascading Cleanups for orphaned db.json records
      await (MockDB as any).delete('feedLogs', { pondId: id });
      await (MockDB as any).delete('medicineLogs', { pondId: id });
      // Note: Water quality records could also be added to db.ts if needed later

      res.status(204).send();
    } else {
      const pond = await PondMongo.findByIdAndDelete(id);
      if (!pond) return res.status(404).json({ error: 'Pond not found' });
      
      // Cascading cleanups for orphaned MongoDB documents
      await FeedLogMongo.deleteMany({ pondId: id });
      await MedicineLogMongo.deleteMany({ pondId: id });

      res.status(204).send();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- FEED & MEDICINE LOGS ---

app.get('/api/user/:userId/feed-logs', async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = isMock()
        ? await MockDB.find('feedLogs', { userId })
        : await FeedLogMongo.find({ userId });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/feed-logs', async (req, res) => {
  try {
    if (isMock()) {
      const log = await MockDB.save('feedLogs', req.body);
      res.json(log);
    } else {
      const log = new FeedLogMongo(req.body);
      await log.save();
      res.json(log);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/user/:userId/medicine-logs', async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = isMock()
        ? await MockDB.find('medicineLogs', { userId })
        : await MedicineLogMongo.find({ userId });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/medicine-logs', async (req, res) => {
  try {
    if (isMock()) {
      const log = await MockDB.save('medicineLogs', req.body);
      res.json(log);
    } else {
      const log = new MedicineLogMongo(req.body);
      await log.save();
      res.json(log);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- BACKGROUND AUTO-SCHEDULE DAEMON ---
const runPushEngine = async () => {
  console.log('[Push Engine] Scanning Ponds for critical state triggers...');
  try {
    const users = isMock() ? await MockDB.find('users', {}) : await UserMongo.find({});
    
    for (const user of users) {
       // Only process if user granted FCM token and explicitly toggled Notifications on
       if (!user.fcmToken || !user.notifications) continue;

       const userPonds = isMock() ? await MockDB.find('ponds', { userId: user._id || user.id }) : await PondMongo.find({ userId: user._id || user.id });
       
       for (const pond of userPonds) {
          if (pond.status !== 'active') continue; // Stop processing harvested/archived
          
          let alertTriggered = null;

          // Artificial Engine Checks evaluating conditions (Could be abstracted identically to scheduleEngine.ts logic)
          // Evaluate Water (DO Drops, Temp Spikes)
          if (user.notifications.water === true && Math.random() > 0.95) { // Example condition triggering
              alertTriggered = { title: "Oxygen Plunge", body: `${pond.name} requires immediate emergency aerators! DO dropped below 4.` };
          } 
          // Evaluate Feed Schedules (DOC milestones)
          else if (user.notifications.feed === true && Math.random() > 0.95) {
              alertTriggered = { title: "Routine Feeding Window", body: `Administer Daily Ration for ${pond.name} according to schedule.` };
          }

          if (alertTriggered) {
             console.log(`[FCM PUSH] 🚀 Targeting Device (${user.fcmToken.substring(0, 15)}...): ${alertTriggered.title} - ${alertTriggered.body} [Lang: ${user.language}]`);
             // TODO: To make this absolutely native: admin.messaging().send({ token: user.fcmToken, notification: alertTriggered })
          }
       }
    }
  } catch (error) {
     console.error('[Push Engine] Daemon Fault:', error);
  }
};

// Start Server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      // Launch Background Daemon Every 1 Min
      setInterval(runPushEngine, 60000);
    });
  });
}

export default app;
