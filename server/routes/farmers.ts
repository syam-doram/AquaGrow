/**
 * Farmers Route (staff access)
 * Mounted at /api/farmers
 *
 * GET /api/farmers         — list farmers (name, phone, _id) for dropdowns
 * GET /api/farmers/:id     — get single farmer
 */
import express from 'express';
import mongoose from 'mongoose';
import { User as UserMongo } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── GET / — farmer list for billing dropdowns ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter: any = { role: 'farmer' };
    if (req.query.q) {
      const q = new RegExp(String(req.query.q).trim(), 'i');
      filter.$or = [{ name: q }, { phoneNumber: q }];
    }
    const farmers = await (UserMongo as any).find(filter)
      .select('name phoneNumber location farmSize')
      .sort({ name: 1 })
      .limit(Number(req.query.limit) || 100);
    res.json(farmers);
  } catch (e: any) {
    console.error('[farmers GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const farmer = await (UserMongo as any).findOne({ _id: req.params.id, role: 'farmer' })
      .select('name phoneNumber location farmSize');
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json(farmer);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
