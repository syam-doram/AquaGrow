import express from 'express';
import { checkIdentity, register, login, refreshToken, logout, loginWithOtp, resetPassword } from '../controllers/authController.js';
import { authLimiter, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/check', authLimiter, checkIdentity);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/login-otp', authLimiter, loginWithOtp);
router.post('/refresh', authLimiter, refreshToken);
router.post('/logout', authenticate, logout);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
