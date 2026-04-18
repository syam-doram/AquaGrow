import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { JWT_SECRET } from '../utils/auth.js';
import { Subscription as SubscriptionMongo } from '../db.js';

// ─── All role values that count as "an admin" ─────────────────────────────────
export const ADMIN_ROLES = new Set([
  'admin',            // legacy super-admin
  'super_admin',
  'finance_admin',
  'operations_admin',
  'sales_admin',
  'support_admin',
  'inventory_admin',
  'technical_admin',
  'hr_admin',
]);

export const isAdminRole = (role: string) => ADMIN_ROLES.has(role);

export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many attempts. Try again in 15 minutes.' }, standardHeaders: true, legacyHeaders: false });
export const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, message: { error: 'Rate limit exceeded.' }, standardHeaders: true, legacyHeaders: false });

export const authenticate = (req: any, res: any, next: any) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/** requireRole('finance_admin', 'super_admin') — exact role match */
export const requireRole = (...roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ error: 'Access denied. Required role: ' + roles.join(' | ') });
  next();
};

/**
 * requireAnyAdmin — passes if the user has ANY admin-variant role.
 * Use this on endpoints that all admins should reach regardless of sub-role.
 */
export const requireAnyAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !isAdminRole(req.user.role))
    return res.status(403).json({ error: 'Admin access required.' });
  next();
};

/**
 * requireSuperAdmin — passes only for super_admin or legacy admin.
 */
export const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Super Admin access required.' });
  next();
};

export const requireSelf = (req: any, res: any, next: any) => {
  const id = req.params.userId || req.body?.userId;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // Any admin variant can access any user's data
  if (req.user.id !== id && !isAdminRole(req.user.role))
    return res.status(403).json({ error: 'Cannot access another user data' });
  next();
};

export const checkFeature = (feature: string) => async (req: any, res: any, next: any) => {
  const sub = await SubscriptionMongo.findOne({ userId: req.user.id });
  if (!sub || sub.status !== 'active' || !sub.features.includes(feature))
    return res.status(403).json({ error: 'Feature requires higher plan: ' + feature });
  next();
};

