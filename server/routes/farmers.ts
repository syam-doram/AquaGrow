/**
 * Farmers Route (staff + admin access)
 * Mounted at /api/farmers
 *
 * GET  /api/farmers         — list farmers (name, phone, _id) for dropdowns
 * GET  /api/farmers/:id     — get single farmer
 * POST /api/farmers         — register new farmer (staff + admin)
 * PUT  /api/farmers/:id     — update farmer details (admin only)
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import { User as UserMongo } from '../db.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

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
      .select('name phoneNumber email location farmSize createdAt')
      .sort({ name: 1 })
      .limit(Number(req.query.limit) || 200);
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
      .select('name phoneNumber email location farmSize createdAt');
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json(farmer);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST / — register new farmer (staff + admin) ──────────────────────────────
router.post('/', async (req: any, res) => {
  try {
    const { name, phoneNumber, email, location, farmSize, password } = req.body;
    if (!name?.trim())        return res.status(400).json({ error: 'Name is required' });
    if (!phoneNumber?.trim()) return res.status(400).json({ error: 'Phone number is required' });

    // Check duplicate phone+role
    const exists = await (UserMongo as any).findOne({ phoneNumber: phoneNumber.trim(), role: 'farmer' });
    if (exists) return res.status(409).json({ error: 'A farmer with this phone number already exists' });

    // Default password = phone number if not provided
    const hashed = await bcrypt.hash(password?.trim() || phoneNumber.trim(), 10);
    const farmer = await (UserMongo as any).create({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email?.trim() || undefined,
      location: location?.trim() || undefined,
      farmSize: farmSize ? Number(farmSize) : 0,
      password: hashed,
      role: 'farmer',
      subscriptionStatus: 'free',
    });

    res.status(201).json({
      _id: farmer._id,
      name: farmer.name,
      phoneNumber: farmer.phoneNumber,
      email: farmer.email,
      location: farmer.location,
      farmSize: farmer.farmSize,
      createdAt: farmer.createdAt,
    });
  } catch (e: any) {
    console.error('[farmers POST]', e);
    if (e.code === 11000) return res.status(409).json({ error: 'Farmer with this phone already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id — update farmer details (admin only) ─────────────────────────────
router.put('/:id', requireAnyAdmin, async (req: any, res) => {
  try {
    const { name, phoneNumber, email, location, farmSize } = req.body;
    const update: any = {};
    if (name?.trim())           update.name        = name.trim();
    if (phoneNumber?.trim())    update.phoneNumber = phoneNumber.trim();
    if (email !== undefined)    update.email       = email?.trim() || undefined;
    if (location !== undefined) update.location    = location?.trim() || undefined;
    if (farmSize !== undefined) update.farmSize    = farmSize ? Number(farmSize) : 0;

    const farmer = await (UserMongo as any).findOneAndUpdate(
      { _id: req.params.id, role: 'farmer' },
      { $set: update },
      { new: true, runValidators: true }
    ).select('name phoneNumber email location farmSize createdAt');

    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json(farmer);
  } catch (e: any) {
    console.error('[farmers PUT]', e);
    if (e.code === 11000) return res.status(409).json({ error: 'Phone number already in use by another farmer' });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
