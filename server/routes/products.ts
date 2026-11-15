/**
 * Products Route
 * Mounted at /api/products
 *
 * GET  /api/products                        — list all active products
 * GET  /api/products/:id                    — single product
 * POST /api/products                        — create product (admin)
 * PUT  /api/products/:id                    — update product (admin)
 * PUT  /api/products/:id/selling-price      — owner sets approved selling rate
 */
import express from 'express';
import { Product } from '../db.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== 'false') filter.isActive = true; // default active only
    const products = await Product.find(filter)
      .select('-__v')
      .sort({ category: 1, name: 1 });
    res.json(products);
  } catch (e: any) {
    console.error('[products GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-__v');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST / — create product (admin) ──────────────────────────────────────────
router.post('/', requireAnyAdmin, async (req, res) => {
  try {
    const { company, name, code, category, packSize, unit, baseStockUnit, batchTracking, expiryTracking, mrp, approvedSellingRate } = req.body;
    if (!company || !name || !code || !category || !baseStockUnit)
      return res.status(400).json({ error: 'company, name, code, category, baseStockUnit are required' });

    const existing = await Product.findOne({ code });
    if (existing) return res.status(409).json({ error: 'Product code already exists' });

    const product = await Product.create({
      company, name, code, category,
      packSize, unit, baseStockUnit,
      batchTracking: batchTracking ?? false,
      expiryTracking: expiryTracking ?? false,
      mrp, approvedSellingRate,
      isActive: true,
    });
    res.status(201).json(product);
  } catch (e: any) {
    console.error('[products POST]', e);
    if (e.code === 11000) return res.status(409).json({ error: 'Product code already in use' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id — update product ─────────────────────────────────────────────────
router.put('/:id', requireAnyAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id; delete updates.__v; delete updates.createdAt; delete updates.updatedAt;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/selling-price — owner sets approved rate ────────────────────────
router.put('/:id/selling-price', requireAnyAdmin, async (req: any, res) => {
  try {
    const { approvedSellingRate, sellingDiscountPercent, mrp } = req.body;
    if (approvedSellingRate == null)
      return res.status(400).json({ error: 'approvedSellingRate is required' });
    if (Number(approvedSellingRate) <= 0)
      return res.status(400).json({ error: 'approvedSellingRate must be positive' });

    const updates: any = { approvedSellingRate: Number(approvedSellingRate) };
    if (sellingDiscountPercent != null) updates.sellingDiscountPercent = Number(sellingDiscountPercent);
    if (mrp != null) updates.mrp = Number(mrp);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e: any) {
    console.error('[products selling-price]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
