import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User as UserMongo, Subscription as SubscriptionMongo, RefreshToken } from '../db.js';
import { signAccess, signRefresh, saveRefreshToken, REFRESH_SECRET } from '../utils/auth.js';
import { getMockData, saveMockData } from '../mockDbWrapper.js';

const normalizePhone = (p: string) => p ? p.replace(/\D/g, '').slice(-10) : '';

export const checkIdentity = async (req: any, res: any) => {
  try {
    const { mobile, email } = req.body;
    
    // --- OFFLINE MOCK FALLBACK ---
    if (mongoose.connection.readyState !== 1) {
       const db = getMockData();
       const normMobile = normalizePhone(mobile);
       if (mobile && db.users.some((u: any) => normalizePhone(u.phoneNumber) === normMobile))
         return res.status(409).json({ error: 'Phone number already registered (Offline Mode)' });
       if (email && db.users.some((u: any) => u.email === email))
         return res.status(409).json({ error: 'Email address already registered (Offline Mode)' });
       return res.json({ success: true });
    }

    if (mobile && await UserMongo.findOne({ phoneNumber: mobile }))
      return res.status(409).json({ error: 'Phone number already registered' });
    if (email && await UserMongo.findOne({ email }))
      return res.status(409).json({ error: 'Email address already registered' });
    res.json({ success: true });
  } catch (e) {
    console.error('[Check Error]', e.message);
    res.status(500).json({ error: 'Check failed: ' + e.message });
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

    // --- OFFLINE MOCK FALLBACK ---
    if (mongoose.connection.readyState !== 1) {
       console.log('[Auth] Entering Offline Registration Mode');
       const db = getMockData();
       
       const normMobile = normalizePhone(mobile);
       if (db.users.some((u: any) => normalizePhone(u.phoneNumber) === normMobile))
         return res.status(409).json({ error: 'Phone number already registered (Offline Mode)' });
       
       const userId = 'mock_' + Date.now();
       user = { 
         id: userId,
         _id: userId,
         name, 
         phoneNumber: mobile, 
         email, 
         password: hash, 
         location, 
         role: role || 'farmer', 
         farmSize: farmSize || 0, 
         language: language || 'English', 
         subscriptionStatus: 'free' 
       };
       
       sub = { 
         userId, 
         planName: 'free', 
         status: 'active', 
         features: ['basic_dashboard', 'pond_management'] 
       };
       
       db.users.push(user);
       db.subscriptions.push(sub);
       saveMockData(db);
       
       const access = signAccess({ id: userId, role: user.role, subscriptionStatus: user.subscriptionStatus });
       const refresh = signRefresh({ id: userId });
       
       if (!db.refreshTokens) db.refreshTokens = [];
       db.refreshTokens.push({ token: refresh, userId, expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
       saveMockData(db);
       
       return res.status(201).json({ user, subscription: sub, access_token: access, refresh_token: refresh });
    }

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
    
    // --- OFFLINE MOCK FALLBACK ---
    if (mongoose.connection.readyState !== 1) {
       console.log('[Auth] Entering Offline Mock Mode');
       const db = getMockData();
       const normMobile = normalizePhone(mobile);
       user = db.users.find((u: any) => normalizePhone(u.phoneNumber) === normMobile || u.email === mobile);
       
       if (!user || !await bcrypt.compare(password, user.password))
         return res.status(401).json({ error: 'Invalid credentials (Offline Mode)' });
         
       sub = db.subscriptions.find((s: any) => s.userId === user._id || s.userId === user.id);
       
       const id = user._id || user.id;
       const access = signAccess({ id, role: user.role, subscriptionStatus: user.subscriptionStatus });
       const refresh = signRefresh({ id });
       
       // Save refresh token to mock db
       if (!db.refreshTokens) db.refreshTokens = [];
       db.refreshTokens.push({ token: refresh, userId: id, expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
       saveMockData(db);
       
       return res.json({ user, subscription: sub, access_token: access, refresh_token: refresh });
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
    
    // --- OFFLINE MOCK FALLBACK ---
    if (mongoose.connection.readyState !== 1) {
       const db = getMockData();
       const storedToken = (db.refreshTokens || []).find((t: any) => t.token === refresh_token);
       if (!storedToken) return res.status(401).json({ error: 'Refresh token not recognized (Offline Mode)' });
       
       const user = db.users.find((u: any) => (u._id || u.id) === p.id);
       if (!user) return res.status(401).json({ error: 'User not found (Offline Mode)' });

       const id = user._id || user.id;
       const access = signAccess({ id, role: user.role, subscriptionStatus: user.subscriptionStatus });
       return res.json({ access_token: access });
    }

    const storedToken = await RefreshToken.findOne({ token: refresh_token });
    if (!storedToken) return res.status(401).json({ error: 'Refresh token not recognized' });

    const user = await UserMongo.findById(p.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccess = signAccess({ id: user._id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    res.json({ access_token: newAccess });
  } catch (e) {
    if (mongoose.connection.readyState === 1) {
       await RefreshToken.deleteMany({ token: refresh_token });
    }
    res.status(401).json({ error: 'Refresh token expired or invalid. Please login again.' });
  }
};

export const logout = async (req: any, res: any) => {
  const token = req.body?.refresh_token;

  try {
    if (mongoose.connection.readyState !== 1) {
       const db = getMockData();
       if (db.refreshTokens) {
         db.refreshTokens = db.refreshTokens.filter((t: any) => t.token !== token);
         saveMockData(db);
       }
    } else if (token) {
       await RefreshToken.deleteMany({ token });
    }
  } catch (e) {
    console.warn('[Logout Error]', e.message);
  }
  res.json({ message: 'Logged out successfully' });
};
export const loginWithOtp = async (req: any, res: any) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp)
      return res.status(400).json({ error: 'Mobile and OTP are required' });

    // Mock OTP verification
    if (otp !== '1234')
      return res.status(401).json({ error: 'Invalid OTP' });

    let user, sub;
    // --- OFFLINE MOCK FALLBACK ---
    if (mongoose.connection.readyState !== 1) {
       console.log('[Auth-OTP] Entering Offline Mode');
       const db = getMockData();
       const normMobile = normalizePhone(mobile);
       user = db.users.find((u: any) => normalizePhone(u.phoneNumber) === normMobile);
       
       if (!user)
         return res.status(404).json({ error: 'Account not found (Offline Mode)' });
       
       sub = db.subscriptions.find((s: any) => s.userId === user._id || s.userId === user.id);
       
       const id = user._id || user.id;
       const access = signAccess({ id, role: user.role, subscriptionStatus: user.subscriptionStatus });
       const refresh = signRefresh({ id });
       
       if (!db.refreshTokens) db.refreshTokens = [];
       db.refreshTokens.push({ token: refresh, userId: id, expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
       saveMockData(db);
       
       return res.json({ user, subscription: sub, access_token: access, refresh_token: refresh });
    }
    user = await UserMongo.findOne({ phoneNumber: mobile });
    if (!user)
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    
    sub = await SubscriptionMongo.findOne({ userId: user._id });

    const id = user._id || user.id;
    const access = signAccess({ id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);
    res.json({ user, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e) { 
    console.error('[OTP Login Error]', e.message);
    res.status(500).json({ error: 'Internal Server Error' }); 
  }
};

export const resetPassword = async (req: any, res: any) => {
  try {
    const { mobile, otp, newPassword } = req.body;
    if (!mobile || !otp || !newPassword)
      return res.status(400).json({ error: 'Mobile, OTP and new password are required' });

    // Mock OTP verification
    if (otp !== '1234')
      return res.status(401).json({ error: 'Invalid OTP' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    // --- OFFLINE MOCK FALLBACK ---
    if (mongoose.connection.readyState !== 1) {
       const db = getMockData();
       const normMobile = normalizePhone(mobile);
       const uIdx = db.users.findIndex((u: any) => normalizePhone(u.phoneNumber) === normMobile);
       if (uIdx === -1)
         return res.status(404).json({ error: 'Account not found (Offline Mode)' });
       
       const hash = await bcrypt.hash(newPassword, 12);
       db.users[uIdx].password = hash;
       saveMockData(db);
       return res.json({ success: true, message: 'Password reset successfully (Offline Mode)' });
    }

    const user = await UserMongo.findOne({ phoneNumber: mobile });
    if (!user)
      return res.status(404).json({ error: 'Account not found' });

    const hash = await bcrypt.hash(newPassword, 12);
    user.password = hash;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    console.error('[Reset Error]', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
