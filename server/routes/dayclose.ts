/**
 * Day Close Route
 * Mounted at /api/dayclose
 *
 * GET  /api/dayclose                   – list day closes (admin), normalized status
 * GET  /api/dayclose/pending           – awaiting owner approval
 * POST /api/dayclose                   – staff submits day close
 * PUT  /api/dayclose/:id/approve       – owner approves
 * PUT  /api/dayclose/:id/reject        – owner rejects
 */
import express from 'express';
import { DayClose, Product } from '../db.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── Helper: normalize a DayClose doc to the shape the admin frontend expects ──
async function normalize(doc: any) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  // status
  obj.status = obj.isRejected ? 'rejected' : obj.isApproved ? 'approved' : 'pending';

  // submittedAt = createdAt
  obj.submittedAt = obj.submittedAt ?? obj.createdAt;

  // Build variances array with product names from the variances Map
  const variancesMap: Record<string, number> = {};
  if (obj.variances instanceof Map) {
    obj.variances.forEach((v: number, k: string) => { variancesMap[k] = v; });
  } else if (obj.variances && typeof obj.variances === 'object') {
    Object.assign(variancesMap, obj.variances);
  }

  const physicalMap: Record<string, number> = {};
  if (obj.physicalCount instanceof Map) {
    obj.physicalCount.forEach((v: number, k: string) => { physicalMap[k] = v; });
  } else if (obj.physicalCount && typeof obj.physicalCount === 'object') {
    Object.assign(physicalMap, obj.physicalCount);
  }

  const openingMap: Record<string, number> = {};
  if (obj.openingSnapshot instanceof Map) {
    obj.openingSnapshot.forEach((v: number, k: string) => { openingMap[k] = v; });
  } else if (obj.openingSnapshot && typeof obj.openingSnapshot === 'object') {
    Object.assign(openingMap, obj.openingSnapshot);
  }

  const salesMap: Record<string, number> = {};
  if (obj.salesSnapshot instanceof Map) {
    obj.salesSnapshot.forEach((v: number, k: string) => { salesMap[k] = v; });
  } else if (obj.salesSnapshot && typeof obj.salesSnapshot === 'object') {
    Object.assign(salesMap, obj.salesSnapshot);
  }

  const receiptMap: Record<string, number> = {};
  if (obj.receiptSnapshot instanceof Map) {
    obj.receiptSnapshot.forEach((v: number, k: string) => { receiptMap[k] = v; });
  } else if (obj.receiptSnapshot && typeof obj.receiptSnapshot === 'object') {
    Object.assign(receiptMap, obj.receiptSnapshot);
  }

  // Enrich with product names
  const productIds = [...new Set([
    ...Object.keys(variancesMap),
    ...Object.keys(physicalMap),
  ])];

  const products: Record<string, any> = {};
  if (productIds.length) {
    const prods = await Product.find({ _id: { $in: productIds } }).select('name baseStockUnit');
    for (const p of prods) products[(p._id as any).toString()] = p;
  }

  obj.variances = productIds.map(pid => {
    const p = products[pid];
    const actualQty  = physicalMap[pid] ?? 0;
    const opening    = openingMap[pid]  ?? 0;
    const received   = receiptMap[pid]  ?? 0;
    const sold       = salesMap[pid]    ?? 0;
    const expectedQty = opening + received - sold;
    const variance   = variancesMap[pid] ?? (actualQty - expectedQty);
    return {
      productId:   pid,
      productName: p?.name ?? pid,
      unit:        p?.baseStockUnit ?? 'kg',
      expectedQty,
      actualQty,
      variance,
    };
  });

  return obj;
}

// ── GET /pending – MUST be before /:id ──────────────────────────────────────
router.get('/pending', requireAnyAdmin, async (_req, res) => {
  try {
    const docs = await DayClose.find({ isApproved: false, isRejected: { $ne: true } })
      .sort({ date: -1 });
    const result = await Promise.all(docs.map(normalize));
    res.json(result);
  } catch (e: any) {
    console.error('[dayclose/pending]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET / ───────────────────────────────────────────────────────────────────
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
    const result = await Promise.all(docs.map(normalize));
    res.json(result);
  } catch (e: any) {
    console.error('[dayclose GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST / – staff submits day close ────────────────────────────────────────
router.post('/', async (req: any, res) => {
  try {
    const {
      date,
      physicalCount,     // { [productId]: actualQty }
      openingSnapshot,   // { [productId]: openingQty }
      salesSnapshot,     // { [productId]: soldQty }
      receiptSnapshot,   // { [productId]: receivedQty }
      staffNotes,
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
      staffNotes: staffNotes ?? '',
      submittedBy: req.user.id,
      submittedByName: req.user.name ?? req.user.email ?? '',
      isApproved: false,
      isRejected: false,
      idempotencyKey,
    });

    res.status(201).json(dayClose);
  } catch (e: any) {
    console.error('[dayclose POST]', e);
    if (e.code === 11000) return res.status(409).json({ error: 'Day close already submitted for this date' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/approve ─────────────────────────────────────────────────────────
router.put('/:id/approve', requireAnyAdmin, async (req: any, res) => {
  try {
    const doc = await DayClose.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Day close not found' });
    if (doc.isApproved) return res.status(400).json({ error: 'Already approved' });

    doc.isApproved = true;
    doc.isRejected = false;
    doc.approvedBy = req.user.id;
    (doc as any).ownerNotes = req.body.ownerNotes ?? '';
    await doc.save();

    res.json(await normalize(doc));
  } catch (e: any) {
    console.error('[dayclose approve]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/reject ──────────────────────────────────────────────────────────
router.put('/:id/reject', requireAnyAdmin, async (req: any, res) => {
  try {
    const doc = await DayClose.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Day close not found' });
    if (doc.isApproved) return res.status(400).json({ error: 'Cannot reject an approved day close' });

    (doc as any).isRejected = true;
    (doc as any).ownerNotes = req.body.ownerNotes ?? '';
    await doc.save();

    res.json(await normalize(doc));
  } catch (e: any) {
    console.error('[dayclose reject]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
