import express from 'express';
import { checkIdentity, register, login, refreshToken, logout, loginWithOtp, resetPassword, firebaseLogin, firebaseRegister, sendOtpController, otpLogin, otpRegister } from '../controllers/authController.js';
import { authLimiter, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/check',               authLimiter, checkIdentity);
router.post('/register',            authLimiter, register);
router.post('/login',               authLimiter, login);
router.post('/login-otp',           authLimiter, loginWithOtp);
router.post('/refresh',             authLimiter, refreshToken);
router.post('/logout',              authenticate, logout);
router.post('/reset-password',      authLimiter, resetPassword);

// ── Firebase Phone OTP ────────────────────────────────────────────────────────
router.post('/firebase-login',      authLimiter, firebaseLogin);
router.post('/firebase-register',   authLimiter, firebaseRegister);

// ── Fast2SMS OTP (server-side, no reCAPTCHA, no rate limits) ─────────────────
router.post('/send-otp',            authLimiter, sendOtpController);
router.post('/otp-login',           authLimiter, otpLogin);
router.post('/otp-register',        authLimiter, otpRegister);

export default router;
