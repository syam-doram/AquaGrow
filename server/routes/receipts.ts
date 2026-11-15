/**
 * Receipts Route — stock inward entries
 * Mounted at /api/receipts in index.ts
 *
 * GET  /api/receipts                      — list all receipts (admin)
 * GET  /api/receipts/pending-costing       — receipts awaiting costing
 * GET  /api/receipts/:id                  — single receipt
 * POST /api/receipts                      — staff creates inward receipt
 * PUT  /api/receipts/:id/costing          — owner completes purchase costing
 */
import express from 'express';
import { Receipt, Product, Batch } from '../db.js';
import { StockMovement } from '../models/stockMovement.js';
import { normaliseQuantity } from '../utils/unitConversion.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── GET /pending-costing — MUST be before /:id ────────────────────────────────
router.get('/pending-costing', requireAnyAdmin, async (_req, res) => {
  try {
    const receipts = await Receipt.find({ purchaseCostPending: true })
      .populate('items.productId', 'name code unit category company')
      .sort({ createdAt: -1 });
    res.json(receipts);
  } catch (e: any) {
    console.error('[receipts/pending-costing]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', requireAnyAdmin, async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.pending === 'true') filter.purchaseCostPending = true;
    if (req.query.from) filter.receiptDate = { $gte: new Date(req.query.from as string) };
    if (req.query.to)   filter.receiptDate = { ...(filter.receiptDate || {}), $lte: new Date(req.query.to as string) };
    const receipts = await Receipt.find(filter)
      .populate('items.productId', 'name code unit category company')
      .sort({ createdAt: -1 });
    res.json(receipts);
  } catch (e: any) {
    console.error('[receipts GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', requireAnyAdmin, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('items.productId', 'name code unit category company');
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST / — staff creates stock inward ───────────────────────────────────────
router.post('/', async (req: any, res) => {
  try {
    const { supplier, invoiceNumber, receiptDate, items } = req.body;
    if (!supplier || !invoiceNumber || !items?.length)
      return res.status(400).json({ error: 'supplier, invoiceNumber, items are required' });

    // Idempotency by invoiceNumber
    const existing = await Receipt.findOne({ invoiceNumber });
    if (existing) return res.status(200).json({ ...existing.toObject(), _idempotent: true });

    // Validate products + normalise quantities
    const receiptItems: any[] = [];
    for (const it of items) {
      if (!it.productId) return res.status(400).json({ error: 'Each item needs a productId' });
      const prod = await Product.findById(it.productId);
      if (!prod) return res.status(404).json({ error: `Product not found: ${it.productId}` });
      if (!it.quantity || it.quantity <= 0)
        return res.status(400).json({ error: `Invalid quantity for product ${prod.name}` });

      const qtyBase = normaliseQuantity(Number(it.quantity), it.unit || prod.baseStockUnit, prod.packSize);
      receiptItems.push({
        productId: it.productId,
        batchId: it.batchId,
        quantity: qtyBase,
        packSize: it.packSize,
        unit: prod.baseStockUnit,
      });

      // Record stock movement (IN)
      await StockMovement.create({
        tenantId: req.user.tenantId || 'default',
        productId: it.productId,
        batchId: it.batchId,
        quantity: qtyBase,
        type: 'IN',
        createdBy: req.user.id,
      });
    }

    const receipt = await Receipt.create({
      supplier,
      invoiceNumber,
      receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
      items: receiptItems,
      purchaseCostPending: true,
      createdBy: req.user.id,
    });

    res.status(201).json(receipt);
  } catch (e: any) {
    console.error('[receipts POST]', e);
    if (e.code === 11000) return res.status(409).json({ error: 'Invoice number already recorded' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/costing — owner approves purchase cost ───────────────────────────
router.put('/:id/costing', requireAnyAdmin, async (req: any, res) => {
  try {
    const {
      purchaseDiscountPercent,
      purchaseCost,
      taxAmount,
      transportCharges,
      totalEffectiveCost,
      // Optional: immediately update product selling rate
      productId,
      approvedSellingRate,
      maxDiscountPercent,
    } = req.body;

    if (totalEffectiveCost == null)
      return res.status(400).json({ error: 'totalEffectiveCost is required' });

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (!receipt.purchaseCostPending)
      return res.status(400).json({ error: 'Costing already completed for this receipt' });

    receipt.purchaseCostPending = false;
    receipt.purchaseCostDetails = {
      purchaseDiscountPercent: purchaseDiscountPercent ?? 0,
      purchaseCost: purchaseCost ?? 0,
      taxAmount: taxAmount ?? 0,
      transportCharges: transportCharges ?? 0,
      totalEffectiveCost: Number(totalEffectiveCost),
    };
    await receipt.save();

    // Optionally update product approved selling rate
    if (productId && approvedSellingRate != null) {
      await Product.findByIdAndUpdate(productId, {
        approvedSellingRate: Number(approvedSellingRate),
        ...(maxDiscountPercent != null ? { sellingDiscountPercent: Number(maxDiscountPercent) } : {}),
      });
    }

    const updated = await Receipt.findById(req.params.id).populate('items.productId', 'name code unit');
    res.json(updated);
  } catch (e: any) {
    console.error('[receipts costing]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
