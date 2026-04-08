import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { RefreshToken } from '../db.js';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
export const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

export const signAccess = (p: any) => jwt.sign(p, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
export const signRefresh = (p: any) => jwt.sign(p, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);

export const saveRefreshToken = async (userId: string, token: string) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days refresh
  await new RefreshToken({ userId, token, expiryDate }).save();
};
