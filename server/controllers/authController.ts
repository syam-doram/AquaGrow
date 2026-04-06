import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User as UserMongo, Subscription as SubscriptionMongo, RefreshToken } from '../db.js';
import { signAccess, signRefresh, saveRefreshToken, REFRESH_SECRET } from '../utils/auth.js';

export const checkIdentity = async (req: any, res: any) => {
  try {
    const { mobile, email } = req.body;
    if (mobile && await UserMongo.findOne({ phoneNumber: mobile }))
      return res.status(409).json({ error: 'Phone number already registered' });
    if (email && await UserMongo.findOne({ email }))
      return res.status(409).json({ error: 'Email address already registered' });
    res.json({ success: true });
  } catch (e) {
    console.error('[Check Error]', e.message);
    res.status(500).json({ error: 'Check failed' });
  }
};

export const register = async (req: any, res: any) => {
  try {
    const { name, mobile, email, password, location, role, farmSize, language } = req.body;
    if (!name || !mobile || !email || !password)
      return res.status(400).json({ error: 'name, mobile, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(password, 12);
    let user, sub;

    if (mongoose.connection.readyState !== 1) throw new Error('DB not ready');
    if (await UserMongo.findOne({ phoneNumber: mobile }))
      return res.status(409).json({ error: 'Phone number already registered' });
    if (await UserMongo.findOne({ email }))
      return res.status(409).json({ error: 'Email address already registered' });

    user = await new UserMongo({ 
      name, 
      phoneNumber: mobile, 
      email, 
      password: hash, 
      location, 
      role: role || 'farmer', 
      farmSize: farmSize || 0, 
      language: language || 'English', 
      subscriptionStatus: 'free' 
    }).save();
    
    sub = await new SubscriptionMongo({ 
      userId: user._id, 
      planName: 'free', 
      status: 'active', 
      features: ['basic_dashboard', 'pond_management'] 
    }).save();

    const access = signAccess({ id: user._id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id: user._id });
    await saveRefreshToken(user._id, refresh);
    res.status(201).json({ user, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const login = async (req: any, res: any) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password)
      return res.status(400).json({ error: 'identifier and password are required' });

    let user, sub;
    if (mongoose.connection.readyState !== 1) {
       return res.status(503).json({ error: 'Database connection not ready. Please check if your IP is whitelisted in MongoDB Atlas.' });
    }
    user = await UserMongo.findOne({ $or: [{ phoneNumber: mobile }, { email: mobile }] });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    sub = await SubscriptionMongo.findOne({ userId: user._id });

    const id = user._id || user.id;
    const access = signAccess({ id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);
    res.json({ user, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e) { 
    console.error('[Login Error Detail]', e.message);
    res.status(500).json({ error: 'Internal Server Error: ' + e.message }); 
  }
};

export const refreshToken = async (req: any, res: any) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(401).json({ error: 'Missing refresh token' });

  try {
    const p = jwt.verify(refresh_token, REFRESH_SECRET) as any;
    const storedToken = await RefreshToken.findOne({ token: refresh_token });

    if (!storedToken) return res.status(401).json({ error: 'Refresh token not recognized' });

    const user = await UserMongo.findById(p.id);

    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccess = signAccess({ id: user._id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    res.json({ access_token: newAccess });
  } catch (e) {
    await RefreshToken.deleteMany({ token: refresh_token });
    res.status(401).json({ error: 'Refresh token expired or invalid. Please login again.' });
  }
};

export const logout = async (req: any, res: any) => {
  if (req.body?.refresh_token) {
    await RefreshToken.deleteMany({ token: req.body.refresh_token });
  }
  res.json({ message: 'Logged out successfully' });
};
