import express from 'express';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';
import {
  staffLogin,
  getStaffMe,
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  deactivateStaff,
  resetStaffPassword,
} from '../controllers/staffController.js';

const router = express.Router();

// ── Public: staff portal login (no token required) ───────────────────────────
router.post('/login', staffLogin);

// ── Authenticated: get own profile ───────────────────────────────────────────
router.get('/me', authenticate, getStaffMe);

// ── Admin CRUD — any admin role may manage staff ─────────────────────────────
router.post('/',             authenticate, requireAnyAdmin, createStaff);
router.get('/',              authenticate, requireAnyAdmin, listStaff);
router.get('/:id',           authenticate, requireAnyAdmin, getStaff);
router.put('/:id',           authenticate, requireAnyAdmin, updateStaff);
router.delete('/:id',        authenticate, requireAnyAdmin, deactivateStaff);
router.post('/:id/reset-password', authenticate, requireAnyAdmin, resetStaffPassword);

export default router;
