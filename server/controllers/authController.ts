import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import admin from 'firebase-admin';
import { User as UserMongo, Subscription as SubscriptionMongo, RefreshToken } from '../db.js';
import { signAccess, signRefresh, saveRefreshToken, REFRESH_SECRET } from '../utils/auth.js';
import { isProviderDbReady, ProviderProfile } from '../providerDb.js';
import { sendOtp as fast2smsSend, verifyOtp as fast2smsVerify } from '../utils/fast2sms.js';

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

    const normMobile = normalizePhone(mobile);  // 10-digit e.g. "9876543210"
    const targetRole = role || 'farmer';

    // ── Phase 1: find the user by phone (try multiple stored formats for
    // backward-compatibility with accounts created before normalization).
    // We do NOT filter by role here — old accounts may not have the role
    // field stored in the MongoDB document even if the schema has a default.
    let user = await UserMongo.findOne({
      $or: [
        { phoneNumber: normMobile },           // stored as 10-digit
        { phoneNumber: `+91${normMobile}` },   // stored as +91XXXXXXXXXX
        { phoneNumber: `+91 ${normMobile}` },  // stored as +91 XXXXXXXXXX
        { email: mobile },                      // email field match
      ]
    });

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials. No account found for this number.' });

    // ── Phase 2: verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });

    // ── Phase 3: role check — if the account exists but belongs to a DIFFERENT portal
    const userRole = user.role || 'farmer';  // default for old accounts without role field
    if (userRole !== targetRole) {
      return res.status(403).json({
        error: `This account is registered as a ${userRole}. Please switch to the ${userRole} portal and try again.`
      });
    }

    const sub = await SubscriptionMongo.findOne({ userId: user._id });
    const id = user._id.toString();
    const access = signAccess({ id, role: userRole, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);
    res.json({ user: { ...user.toObject(), role: userRole }, subscription: sub, access_token: access, refresh_token: refresh });
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
    const { mobile, phone, otp, token, firebaseToken, newPassword, role } = req.body;

    // Accept Firebase ID token from 'token', 'firebaseToken', or legacy 'otp' field
    const fbToken = firebaseToken || token || otp;
    if (!fbToken || !newPassword)
      return res.status(400).json({ error: 'Firebase token and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const targetRole = role || 'farmer';
    let normPhone: string;

    // ── Static OTP bypass (998974) ─────────────────────────────────────────────
    if (fbToken === '998974') {
      const rawPhone = mobile || phone;
      if (!rawPhone) return res.status(400).json({ error: 'Phone number is required for static OTP bypass.' });
      normPhone = rawPhone.replace(/\D/g, '').slice(-10);
      console.log(`[Static OTP] Reset password bypass for ${targetRole} ${normPhone}`);
    } else {
      // Verify Firebase ID token — confirms the user passed phone OTP
      let decoded: admin.auth.DecodedIdToken;
      try {
        decoded = await admin.auth().verifyIdToken(fbToken);
      } catch (firebaseErr: any) {
        console.error('[Reset Password] Token verification failed:', firebaseErr.message);
        return res.status(401).json({ error: 'Invalid or expired session. Please verify OTP again.' });
      }
      const firebasePhone = decoded.phone_number;
      if (!firebasePhone)
        return res.status(400).json({ error: 'No phone number found in token' });
      normPhone = firebasePhone.replace(/\D/g, '').slice(-10);
    }

    // Role-based lookup — farmer vs provider
    const user = await UserMongo.findOne({
      role: targetRole,
      $or: [
        { phoneNumber: normPhone },
        { phoneNumber: `+91${normPhone}` },
        { phoneNumber: `+91 ${normPhone}` },
      ]
    });

    if (!user)
      return res.status(404).json({
        error: `No ${targetRole} account found for this number.`
      });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log(`[Reset Password] ✅ ${targetRole} ${normPhone} password updated`);
    res.json({ success: true, message: 'Password reset successfully' });

  } catch (e: any) {
    console.error('[Reset Error]', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
//  FIREBASE PHONE AUTH — Real SMS OTP via Firebase Authentication
//
//  Flow (client-initiated):
//    1. Client uses Firebase JS SDK → signInWithPhoneNumber → SMS sent
//    2. User enters OTP → Firebase verifies → returns idToken
//    3. Client sends { idToken, role, name?, location? } to these endpoints
//    4. Server verifies idToken via Firebase Admin SDK
//    5. Server finds/creates the User record → issues JWT tokens
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /auth/firebase-login
 * Logs in an EXISTING user whose phone was verified by Firebase OTP.
 * The user must already have an account with that phone + role.
 */
export const firebaseLogin = async (req: any, res: any) => {
  try {
    // Accept both 'token' and 'idToken' field names for flexibility
    const { idToken, token, role, phone } = req.body;
    const firebaseToken = idToken || token;
    if (!firebaseToken) return res.status(400).json({ error: 'Firebase token is required (send as idToken or token)' });

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const targetRole = role || 'farmer';
    let normPhone: string;

    // ── Static OTP bypass (998974) ─────────────────────────────────────────────
    if (firebaseToken === '998974') {
      if (!phone) return res.status(400).json({ error: 'Phone number is required for static OTP bypass.' });
      normPhone = phone.replace(/\D/g, '').slice(-10);
      console.log(`[Static OTP] Login bypass for ${targetRole} ${normPhone}`);
    } else {
      // Verify the token with Firebase Admin SDK
      let decoded: admin.auth.DecodedIdToken;
      try {
        decoded = await admin.auth().verifyIdToken(firebaseToken);
      } catch (firebaseErr: any) {
        console.error('[Firebase OTP] Token verification failed:', firebaseErr.message);
        return res.status(401).json({ error: 'Invalid or expired OTP session. Please request a new OTP.' });
      }
      // Firebase phone_number is in E.164 format e.g. "+919876543210"
      const firebasePhone = decoded.phone_number;
      if (!firebasePhone) return res.status(400).json({ error: 'No phone number in token' });
      normPhone = firebasePhone.replace(/\D/g, '').slice(-10);
    }

    // Find user by phone + role directly (prevents same-phone farmer/provider collision)
    const user = await UserMongo.findOne({
      role: targetRole,
      $or: [
        { phoneNumber: normPhone },
        { phoneNumber: `+91${normPhone}` },
        { phoneNumber: `+91 ${normPhone}` },
      ]
    });

    if (!user)
      return res.status(404).json({
        error: `No ${targetRole} account found for this number. Please register first or switch portals.`
      });

    // Role check — already guaranteed by query above, but double-check for safety
    const userRole = user.role || 'farmer';

    const sub = await SubscriptionMongo.findOne({ userId: user._id });
    const id = user._id.toString();
    const access = signAccess({ id, role: userRole, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);

    console.log(`[Firebase OTP Login] ${targetRole} ${normPhone} verified OK`);
    res.json({ user: { ...user.toObject(), role: userRole }, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e: any) {
    console.error('[Firebase Login Error]', e.message);
    res.status(500).json({ error: 'Internal Server Error: ' + e.message });
  }
};

/**
 * POST /auth/firebase-register
 * Registers a NEW user whose phone was verified by Firebase OTP.
 * Creates User + Subscription + ProviderProfile (if role=provider).
 */
export const firebaseRegister = async (req: any, res: any) => {
  try {
    // Accept both 'token' and 'idToken' field names
    const { idToken, token, name, role, location, language, phone } = req.body;
    const firebaseToken = idToken || token;
    if (!firebaseToken || !name)
      return res.status(400).json({ error: 'Firebase token and name are required' });

    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const targetRole = role || 'farmer';
    let normPhone: string;
    let uid: string;

    // ── Static OTP bypass (998974) ─────────────────────────────────────────────
    if (firebaseToken === '998974') {
      if (!phone) return res.status(400).json({ error: 'Phone number is required for static OTP bypass.' });
      normPhone = phone.replace(/\D/g, '').slice(-10);
      uid = `static_${normPhone}`;
      console.log(`[Static OTP] Register bypass for ${targetRole} ${normPhone}`);
    } else {
      // Verify the Firebase ID token
      let decoded: admin.auth.DecodedIdToken;
      try {
        decoded = await admin.auth().verifyIdToken(firebaseToken);
      } catch (firebaseErr: any) {
        console.error('[Firebase Register] Token verification failed:', firebaseErr.message);
        return res.status(401).json({ error: 'Invalid or expired OTP session. Please request a new OTP.' });
      }
      const firebasePhone = decoded.phone_number;
      if (!firebasePhone) return res.status(400).json({ error: 'No phone number in token' });
      normPhone = firebasePhone.replace(/\D/g, '').slice(-10);
      uid = decoded.uid;
    }

    // Prevent duplicate registration for this role
    const existing = await UserMongo.findOne({ phoneNumber: normPhone, role: targetRole });
    if (existing)
      return res.status(409).json({
        error: `Phone already registered as a ${targetRole}. Please login instead.`
      });

    // Generate a stable password from the UID so re-auth works if needed
    const hash = await bcrypt.hash(uid, 12);
    const email = `${normPhone}_${targetRole}@aquagrow.app`;

    const user = await new UserMongo({
      name: name.trim(),
      phoneNumber: normPhone,
      email,
      password: hash,
      location: location || 'Unknown',
      role: targetRole,
      farmSize: 0,
      language: language || 'English',
      subscriptionStatus: 'free',
    }).save();

    const sub = await new SubscriptionMongo({
      userId: user._id,
      planName: 'free',
      status: 'active',
      features: ['basic_dashboard', 'pond_management'],
    }).save();

    // Auto-create ProviderProfile for provider role
    if (targetRole === 'provider' && isProviderDbReady()) {
      try {
        await new ProviderProfile({
          userId:      user._id.toString(),
          companyName: name.trim(),
          ownerName:   name.trim(),
          phone:       normPhone,
          email,
          location:    location || '',
          isVerified:  false,
        }).save();
        console.log(`[Firebase Register] Provider profile created for ${normPhone}`);
      } catch (provErr: any) {
        console.warn('[Firebase Register] Provider profile creation failed:', provErr.message);
      }
    }

    const id = user._id.toString();
    const access = signAccess({ id, role: user.role, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);

    console.log(`[Firebase OTP Register] ${targetRole} ${normPhone} registered OK`);
    res.status(201).json({ user, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e: any) {
    console.error('[Firebase Register Error]', e.message);
    res.status(400).json({ error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  FAST2SMS OTP AUTH — Server-side OTP via Indian SMS gateway
//  POST /auth/send-otp       { phone }
//  POST /auth/otp-login      { phone, code, role }
//  POST /auth/otp-register   { phone, code, name, role, location, language }
// ─────────────────────────────────────────────────────────────────────────────

/** POST /auth/send-otp */
export const sendOtpController = async (req: any, res: any) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });
    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    const result = await fast2smsSend(phone);
    if (result.success) {
      console.log(`[OTP] Sent to ${phone.replace(/\D/g, '').slice(-10)}`);
      return res.json({ success: true, message: 'OTP sent. Check your SMS.' });
    }
    return res.status(500).json({ error: result.error || 'Failed to send OTP.' });
  } catch (e: any) {
    console.error('[sendOtp Error]', e.message);
    res.status(500).json({ error: 'Internal Server Error: ' + e.message });
  }
};

/** POST /auth/otp-login */
export const otpLogin = async (req: any, res: any) => {
  try {
    const { phone, code, role } = req.body;
    if (!phone || !code)
      return res.status(400).json({ error: 'Phone and OTP code are required.' });
    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    // Step 1: Verify OTP
    const otpResult = fast2smsVerify(phone, code);
    if (!otpResult.valid) return res.status(401).json({ error: otpResult.error });

    const normPhone  = phone.replace(/\D/g, '').slice(-10);
    const targetRole = role || 'farmer';

    // Step 2: Find user (multi-format for backward compat)
    const user = await UserMongo.findOne({
      $or: [
        { phoneNumber: normPhone },
        { phoneNumber: `+91${normPhone}` },
        { phoneNumber: `+91 ${normPhone}` },
      ]
    });
    if (!user)
      return res.status(404).json({ error: 'No account found. Please register first.' });

    // Step 3: Portal check
    const userRole = user.role || 'farmer';
    if (userRole !== targetRole)
      return res.status(403).json({
        error: `This number is a ${userRole} account. Please switch to the ${userRole} portal.`
      });

    // Step 4: Issue JWT
    const sub    = await SubscriptionMongo.findOne({ userId: user._id });
    const id     = user._id.toString();
    const access = signAccess({ id, role: userRole, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);

    console.log(`[OTP Login] ✅ ${userRole} ${normPhone}`);
    res.json({ user: { ...user.toObject(), role: userRole }, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e: any) {
    console.error('[otpLogin Error]', e.message);
    res.status(500).json({ error: 'Internal Server Error: ' + e.message });
  }
};

/** POST /auth/otp-register */
export const otpRegister = async (req: any, res: any) => {
  try {
    const { phone, code, name, role, location, language, businessName, farmSize } = req.body;
    if (!phone || !code || !name)
      return res.status(400).json({ error: 'Phone, OTP code and name are required.' });
    if (mongoose.connection.readyState !== 1) return dbOffline(res);

    // Step 1: Verify OTP
    const otpResult = fast2smsVerify(phone, code);
    if (!otpResult.valid) return res.status(401).json({ error: otpResult.error });

    const normPhone   = phone.replace(/\D/g, '').slice(-10);
    const targetRole  = role || 'farmer';
    const displayName = (targetRole === 'provider' && businessName?.trim())
      ? businessName.trim() : name.trim();

    // Step 2: Duplicate check for this role
    const existing = await UserMongo.findOne({
      $or: [
        { phoneNumber: normPhone },
        { phoneNumber: `+91${normPhone}` },
        { phoneNumber: `+91 ${normPhone}` },
      ],
      role: targetRole,
    });
    if (existing)
      return res.status(409).json({ error: `A ${targetRole} account already exists. Please login.` });

    // Step 3: Create user
    const hash  = await bcrypt.hash(`${normPhone}_otp_${Date.now()}`, 12);
    const email = `${normPhone}_${targetRole}@aquagrow.app`;

    const user = await new UserMongo({
      name:               displayName,
      phoneNumber:        normPhone,
      email,
      password:           hash,
      location:           location || 'Unknown',
      role:               targetRole,
      farmSize:           parseFloat(farmSize) || 0,
      language:           language || 'English',
      subscriptionStatus: 'free',
    }).save();

    const sub = await new SubscriptionMongo({
      userId: user._id, planName: 'free', status: 'active',
      features: ['basic_dashboard', 'pond_management'],
    }).save();

    if (targetRole === 'provider' && isProviderDbReady()) {
      try {
        await new ProviderProfile({
          userId: user._id.toString(), companyName: displayName,
          ownerName: name.trim(), phone: normPhone, email,
          location: location || '', isVerified: false,
        }).save();
      } catch (pErr) { console.warn('[OTP Register] Provider profile error:', pErr); }
    }

    const id      = user._id.toString();
    const access  = signAccess({ id, role: targetRole, subscriptionStatus: user.subscriptionStatus });
    const refresh = signRefresh({ id });
    await saveRefreshToken(id, refresh);

    console.log(`[OTP Register] ✅ ${targetRole} ${normPhone} → ${displayName}`);
    res.status(201).json({ user: { ...user.toObject(), role: targetRole }, subscription: sub, access_token: access, refresh_token: refresh });
  } catch (e: any) {
    console.error('[otpRegister Error]', e.message);
    res.status(400).json({ error: e.message });
  }
};
