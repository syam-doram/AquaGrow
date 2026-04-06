import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { JWT_SECRET } from '../utils/auth.js';
import { Subscription as SubscriptionMongo } from '../db.js';

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

export const requireRole = (...roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ error: 'Access denied. Required role: ' + roles.join('|') });
  next();
};

export const requireSelf = (req: any, res: any, next: any) => {
  const id = req.params.userId || req.body?.userId;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.user.id !== id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Cannot access another user data' });
  next();
};

export const checkFeature = (feature: string) => async (req: any, res: any, next: any) => {
  const sub = await SubscriptionMongo.findOne({ userId: req.user.id });
  if (!sub || sub.status !== 'active' || !sub.features.includes(feature))
    return res.status(403).json({ error: 'Feature requires higher plan: ' + feature });
  next();
};
