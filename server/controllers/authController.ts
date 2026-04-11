import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User as UserMongo, Subscription as SubscriptionMongo, RefreshToken } from '../db.js';
import { signAccess, signRefresh, saveRefreshToken, REFRESH_SECRET } from '../utils/auth.js';
import { isProviderDbReady, ProviderProfile } from '../providerDb.js';

const normalizePhone = (p: string) => p ? p.replace(/\D/g, '').slice(-10) : '';

const dbOffline = (res: any) =>
  res.status(503).json({ error: 'Database unavailable. Please try again later.' });

export const checkIdentity = async (req: any, res: any) => {
  try {
    // role: 'farmer' | 'provider' — scopes the uniqueness check per portal
    const { mobile, email, role } = req.body;
    const targetRole = role || 'farmer';

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    // Check phone uniqueness within this specific role only
    if (mobile) {
      const normPhone = mobile.replace(/\D/g, '').slice(-10);
      const existing = await UserMongo.findOne({ phoneNumber: normPhone, role: targetRole });
      if (existing)
        return res.status(409).json({
          error: `Phone already registered as a ${targetRole}. Use a different number or login to your ${targetRole} account.`
        });
    }

    // Email check is also role-scoped (optional field, skip if blank)
    if (email) {
      const existing = await UserMongo.findOne({ email, role: targetRole });
      if (existing)
        return res.status(409).json({ error: 'Email address already registered for this role' });
    }

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

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const hash = await bcrypt.hash(password, 12);

    const normMobile = normalizePhone(mobile);
    const targetRole = role || 'farmer';

    // Role-scoped duplicate check — same phone OK across different roles
    if (await UserMongo.findOne({ phoneNumber: normMobile, role: targetRole }))
      return res.status(409).json({ error: `Phone already registered as a ${targetRole}. Login instead or use a different number.` });

    const user = await new UserMongo({
      name, phoneNumber: normMobile, email, password: hash,
      location, role: role || 'farmer', farmSize: farmSize || 0,
      language: language || 'English', subscriptionStatus: 'free',
    }).save();

    const sub = await new SubscriptionMongo({
      userId: user._id, planName: 'free', status: 'active',
      features: ['basic_dashboard', 'pond_management'],
    }).save();

    // ── Auto-create ProviderProfile in aquagrow_providers DB ──────────────────
    // Without this, providers register but never appear in the provider system.
    if ((role || 'farmer') === 'provider' && isProviderDbReady()) {
      try {
        await new ProviderProfile({
          userId:      user._id.toString(),
          companyName: name,
          ownerName:   name,
          phone:       normMobile,
          email:       email,
          location:    location || '',
          isVerified:  false,
        }).save();
        console.log(`[REGISTER] Provider profile auto-created for ${name} (${normMobile})`);
      } catch (provErr: any) {
        // Non-fatal: log but don't block registration
        console.warn('[REGISTER] Provider profile creation failed:', provErr.message);
      }
    }

    const access = signAccess({ id: user._id.toString(), role: user.role, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id: user._id.toString() });
    await saveRefreshToken(user._id.toString(), refresh);

    res.status(201).json({ user, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const login = async (req: any, res: any) => {
  try {
    const { mobile, password, role } = req.body;
    if (!mobile || !password)
      return res.status(400).json({ error: 'identifier and password are required' });

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const normMobile = normalizePhone(mobile);
    const targetRole = role || 'farmer';

    // Find EXACTLY the account for this portal (farmer vs provider)
    // Without role scoping, findOne returns the first match which is always
    // whichever account was created first — causing wrong portal access.
    const user = await UserMongo.findOne({
      $or: [{ phoneNumber: normMobile }, { email: mobile }],
      role: targetRole,
    });

    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: `Invalid credentials for ${targetRole} account` });

    const sub = await SubscriptionMongo.findOne({ userId: user._id });
    const id = user._id.toString();
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

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const storedToken = await RefreshToken.findOne({ token: refresh_token });
    if (!storedToken) return res.status(401).json({ error: 'Refresh token not recognized' });

    const user = await UserMongo.findById(p.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccess = signAccess({ id: user._id.toString(), role: user.role, subscriptionStatus: user.subscriptionStatus });
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
    if (mongoose.connection.readyState === 1 && token) {
      await RefreshToken.deleteMany({ token });
    }
  } catch (e) {
    console.warn('[Logout Error]', e.message);
  }
  res.json({ message: 'Logged out successfully' });
};

export const loginWithOtp = async (req: any, res: any) => {
  try {
    const { mobile, otp, role } = req.body;
    if (!mobile || !otp)
      return res.status(400).json({ error: 'Mobile and OTP are required' });

    // Stub OTP verification (replace with real SMS OTP service)
    if (otp !== '1234')
      return res.status(401).json({ error: 'Invalid OTP' });

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const normMobile = normalizePhone(mobile);
    const targetRole = role || 'farmer';

    // Role-scoped lookup — OTP login must also land in the correct portal
    const user = await UserMongo.findOne({ phoneNumber: normMobile, role: targetRole });
    if (!user)
      return res.status(404).json({ error: `No ${targetRole} account found for this number. Please register first.` });

    const sub = await SubscriptionMongo.findOne({ userId: user._id });
    const id = user._id.toString();
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

    // Stub OTP verification (replace with real SMS OTP service)
    if (otp !== '1234')
      return res.status(401).json({ error: 'Invalid OTP' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const user = await UserMongo.findOne({ phoneNumber: mobile });
    if (!user)
      return res.status(404).json({ error: 'Account not found' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    console.error('[Reset Error]', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
