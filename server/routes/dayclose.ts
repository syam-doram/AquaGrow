/**
 * Day Close Route
 * Mounted at /api/dayclose
 *
 * GET  /api/dayclose                   — list day closes (admin)
 * POST /api/dayclose                   — staff submits day close
 * PUT  /api/dayclose/:id/approve       — owner approves
 * PUT  /api/dayclose/:id/reject        — owner rejects
 */
import express from 'express';
import { DayClose, Product } from '../db.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', requireAnyAdmin, async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from as string);
      if (req.query.to)   filter.date.$lte = new Date(req.query.to as string);
    }
    const docs = await DayClose.find(filter).sort({ date: -1 });
    res.json(docs);
  } catch (e: any) {
    console.error('[dayclose GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST / — staff submits day close ─────────────────────────────────────────
router.post('/', async (req: any, res) => {
  try {
    const {
      date,
      physicalCount,     // { [productId]: actualQty }
      openingSnapshot,   // { [productId]: openingQty } — optional, computed server-side ideally
      salesSnapshot,     // { [productId]: soldQty } — from invoices
      receiptSnapshot,   // { [productId]: receivedQty }
      idempotencyKey,
    } = req.body;

    if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    if (!physicalCount || typeof physicalCount !== 'object')
      return res.status(400).json({ error: 'physicalCount is required as an object' });

    // Idempotency by date
    const dayDate = new Date(date);
    const existing = await DayClose.findOne({ date: dayDate });
    if (existing) {
      if (!existing.isApproved) return res.status(200).json({ ...existing.toObject(), _idempotent: true });
      return res.status(409).json({ error: 'Day close for this date has already been approved' });
    }

    // Compute variances: physicalCount - (opening + receipts - sales)
    const variances: Record<string, number> = {};
    for (const [productId, actualQty] of Object.entries(physicalCount)) {
      const opening   = (openingSnapshot   as any)?.[productId] ?? 0;
      const received  = (receiptSnapshot   as any)?.[productId] ?? 0;
      const sold      = (salesSnapshot     as any)?.[productId] ?? 0;
      const expected  = opening + received - sold;
      variances[productId] = Number(actualQty) - expected;
    }

    const dayClose = await DayClose.create({
      date: dayDate,
      openingSnapshot:  openingSnapshot  ?? {},
      receiptSnapshot:  receiptSnapshot  ?? {},
      salesSnapshot:    salesSnapshot    ?? {},
      physicalCount,
      variances,
      isApproved: false,
      idempotencyKey,
    });

    res.status(201).json(dayClose);
  } catch (e: any) {
    console.error('[dayclose POST]', e);
    if (e.code === 11000) return res.status(409).json({ error: 'Day close already submitted for this date' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/approve ──────────────────────────────────────────────────────────
router.put('/:id/approve', requireAnyAdmin, async (req: any, res) => {
  try {
    const doc = await DayClose.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Day close not found' });
    if (doc.isApproved) return res.status(400).json({ error: 'Already approved' });

    doc.isApproved = true;
    doc.approvedBy = req.user.id;
    await doc.save();

    res.json(doc);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/reject ───────────────────────────────────────────────────────────
router.put('/:id/reject', requireAnyAdmin, async (req: any, res) => {
  try {
    const doc = await DayClose.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Day close not found' });
    if (doc.isApproved) return res.status(400).json({ error: 'Cannot reject an approved day close' });

    // Mark as rejected by deleting (staff re-submits)
    await DayClose.findByIdAndDelete(req.params.id);
    res.json({ message: 'Day close rejected and removed. Staff may re-submit.' });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
