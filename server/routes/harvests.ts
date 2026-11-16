/**
 * ERP Harvest Drafts Route
 * Mounted at /api/harvests
 *
 * POST /api/harvests             – staff submits harvest draft
 * GET  /api/harvests             – owner sees all harvests (admin only)
 * GET  /api/harvests/:id         – single harvest (admin only)
 * PUT  /api/harvests/:id/review  – owner marks reviewed with notes (admin only)
 *
 * No culture linking required at submission.
 * Owner may optionally link a cultureId when reviewing.
 */
import express from 'express';
import { HarvestDraft } from '../db.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── POST / – staff submits harvest draft ────────────────────────────────────
router.post('/', async (req: any, res) => {
  try {
    const { farmerId, farmerName, pondId, weightKg, date, notes } = req.body;

    if (!farmerId) return res.status(400).json({ error: 'farmerId is required' });
    if (!pondId)   return res.status(400).json({ error: 'pondId is required' });
    if (weightKg == null || Number(weightKg) <= 0)
      return res.status(400).json({ error: 'weightKg must be a positive number' });

    const draft = await HarvestDraft.create({
      farmerId,
      farmerName: farmerName ?? '',
      pondId,
      weightKg: Number(weightKg),
      date: date ? new Date(date) : new Date(),
      notes: notes ?? '',
      status: 'draft',
      submittedBy: req.user.id,
      submittedByName: req.user.name ?? req.user.email ?? '',
    });

    res.status(201).json(draft);
  } catch (e: any) {
    console.error('[harvests POST]', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ── GET / – owner lists all harvest drafts ──────────────────────────────────
router.get('/', requireAnyAdmin, async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.status)   filter.status = req.query.status;
    if (req.query.farmerId) filter.farmerId = req.query.farmerId;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from as string);
      if (req.query.to)   filter.date.$lte = new Date(req.query.to as string);
    }
    const drafts = await HarvestDraft.find(filter).sort({ date: -1 });
    res.json(drafts);
  } catch (e: any) {
    console.error('[harvests GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /:id ─────────────────────────────────────────────────────────────────
router.get('/:id', requireAnyAdmin, async (req, res) => {
  try {
    const draft = await HarvestDraft.findById(req.params.id);
    if (!draft) return res.status(404).json({ error: 'Harvest draft not found' });
    res.json(draft);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/review – owner marks reviewed ──────────────────────────────────
router.put('/:id/review', requireAnyAdmin, async (req: any, res) => {
  try {
    const { reviewNotes, status, cultureId } = req.body;
    const allowedStatus = ['draft', 'reviewed', 'settled'];
    const newStatus = allowedStatus.includes(status) ? status : 'reviewed';

    const draft = await HarvestDraft.findByIdAndUpdate(
      req.params.id,
      {
        status: newStatus,
        reviewedBy: req.user.id,
        reviewNotes: reviewNotes ?? '',
        ...(cultureId ? { cultureId } : {}),
      },
      { new: true }
    );
    if (!draft) return res.status(404).json({ error: 'Harvest draft not found' });
    res.json(draft);
  } catch (e: any) {
    console.error('[harvests review]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
