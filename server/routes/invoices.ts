/**
 * Invoices Route — farmer billing
 * Mounted at /api/invoices
 *
 * POST /api/invoices                      — staff creates multi-product invoice
 * GET  /api/invoices                      — list invoices (filterable by date, farmerId, status)
 * GET  /api/invoices/summary              — daily totals for owner
 * GET  /api/invoices/:id                  — single invoice
 * POST /api/invoices/:id/payment          — add payment to invoice
 * PUT  /api/invoices/:id/cancel           — cancel invoice (admin)
 *
 * SECURITY: Server fetches approved selling rates from DB.
 *           Client-supplied unit prices are NEVER trusted.
 */
import express from 'express';
import mongoose from 'mongoose';
import { Invoice, Payment, Product, LedgerEntry } from '../db.js';
import { StockMovement } from '../models/stockMovement.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── Helper: payment status ────────────────────────────────────────────────────
function computeStatus(totalAmount: number, paidAmount: number): string {
  if (paidAmount <= 0) return 'draft';
  if (paidAmount >= totalAmount) return 'paid';
  return 'finalized'; // partial
}

// ── GET /summary — owner daily totals ─────────────────────────────────────────
router.get('/summary', requireAnyAdmin, async (req, res) => {
  try {
    const dateStr = req.query.date as string || new Date().toISOString().slice(0, 10);
    // IST midnight → UTC: subtract 330 min
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const start = new Date(new Date(dateStr).getTime() - IST_OFFSET_MS);
    const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const invoices = await Invoice.find({
      createdAt: { $gte: start, $lt: end },
    });

    const totalRevenue = invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    const draftCount = invoices.filter(i => i.status === 'draft').length;
    const finalizedCount = invoices.filter(i => i.status === 'finalized').length;

    res.json({
      date: dateStr,
      invoiceCount: invoices.length,
      totalRevenue,
      paidCount,
      draftCount,
      finalizedCount,
    });
  } catch (e: any) {
    console.error('[invoices/summary]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.farmerId) filter.farmerId = req.query.farmerId;
    if (req.query.status)   filter.status = req.query.status;
    if (req.query.date) {
      // IST = UTC+5:30 (330 min). Backend stores UTC, frontend sends IST date.
      // Convert IST midnight → UTC: subtract 330 min from start, add 24h-330min to end.
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const start = new Date(new Date(req.query.date as string).getTime() - IST_OFFSET_MS);
      const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: start, $lt: end };
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from as string);
      if (req.query.to)   filter.createdAt.$lte = new Date(req.query.to as string);
    }
    const invoices = await Invoice.find(filter)
      .populate('items.productId', 'name code unit')
      .sort({ createdAt: -1 });

    // Attach payments for each invoice so owner can see payment breakdown
    const invoiceIds = invoices.map(inv => inv._id);
    const allPayments = await Payment.find({ invoiceId: { $in: invoiceIds } }).sort({ createdAt: 1 });
    const paymentsByInvoice: Record<string, any[]> = {};
    for (const p of allPayments) {
      const key = String(p.invoiceId);
      if (!paymentsByInvoice[key]) paymentsByInvoice[key] = [];
      paymentsByInvoice[key].push(p.toObject());
    }

    const result = invoices.map(inv => ({
      ...inv.toObject(),
      payments: paymentsByInvoice[String(inv._id)] ?? [],
    }));

    res.json(result);
  } catch (e: any) {
    console.error('[invoices GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('items.productId', 'name code unit');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Also attach payments
    const payments = await Payment.find({ invoiceId: req.params.id }).sort({ createdAt: 1 });
    res.json({ ...invoice.toObject(), payments });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST / — create invoice ───────────────────────────────────────────────────
router.post('/', async (req: any, res) => {
  try {
    const { farmerId, pondId, items, payment, idempotencyKey } = req.body;
    if (!farmerId || !items?.length)
      return res.status(400).json({ error: 'farmerId and items are required' });

    // Idempotency check
    if (idempotencyKey) {
      const existing = await Invoice.findOne({ idempotencyKey });
      if (existing) return res.status(200).json({ ...existing.toObject(), _idempotent: true });
    }

    // Build items server-side: fetch approved selling rate from DB
    let totalAmount = 0;
    const resolvedItems: any[] = [];

    for (const clientItem of items) {
      if (!clientItem.productId || !clientItem.quantity || clientItem.quantity <= 0)
        return res.status(400).json({ error: 'Each item needs productId and positive quantity' });

      const product = await Product.findById(clientItem.productId);
      if (!product || !product.isActive)
        return res.status(404).json({ error: `Product not found or inactive: ${clientItem.productId}` });

      const approvedRate = product.approvedSellingRate;
      if (!approvedRate || approvedRate <= 0)
        return res.status(422).json({
          error: `No approved selling rate for "${product.name}". Owner must set it first.`
        });

      // Allow discount up to max, but cap at product's sellingDiscountPercent
      const reqDiscount = clientItem.discountPercent ?? 0;
      const maxDiscount = product.sellingDiscountPercent ?? 0;
      const discountPct = Math.min(reqDiscount, maxDiscount);

      const rateAfterDiscount = approvedRate * (1 - discountPct / 100);
      const lineTotal = Math.round(rateAfterDiscount * clientItem.quantity * 100) / 100;
      totalAmount += lineTotal;

      resolvedItems.push({
        productId: clientItem.productId,
        batchId: clientItem.batchId,
        quantity: clientItem.quantity,
        unitPrice: approvedRate,
        discountPercent: discountPct,
        total: lineTotal,
      });

      // Record stock movement (OUT)
      await StockMovement.create({
        tenantId: req.user.tenantId || 'default',
        productId: clientItem.productId,
        batchId: clientItem.batchId,
        quantity: -clientItem.quantity,  // negative = OUT
        type: 'OUT',
        createdBy: req.user.id,
      });
    }

    // Determine initial payment
    const paidAmount = payment?.amount ?? 0;
    const status = computeStatus(totalAmount, paidAmount);

    const invoice = await Invoice.create({
      farmerId,
      pondId,
      items: resolvedItems,
      totalAmount,
      status,
      idempotencyKey,
      createdBy: req.user.id,
    });

    // Record payment if provided
    if (payment && payment.amount > 0) {
      await Payment.create({
        invoiceId: invoice._id,
        amount: payment.amount,
        method: payment.method || 'Cash',
        details: payment.details || {},
        createdBy: req.user.id,
      });
    }

    // Write ledger entry for farmer
    if (totalAmount > 0) {
      await LedgerEntry.create({
        cultureId: new mongoose.Types.ObjectId(), // placeholder until cultures linked
        type: 'Sale',
        amount: totalAmount,
        relatedId: invoice._id,
        notes: `Invoice #${invoice._id}`,
      }).catch(() => null); // non-fatal if cultureId fails validation
    }

    const populated = await Invoice.findById(invoice._id).populate('items.productId', 'name code unit');
    const payments = await Payment.find({ invoiceId: invoice._id });
    res.status(201).json({ ...populated!.toObject(), payments });
  } catch (e: any) {
    console.error('[invoices POST]', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ── POST /:id/payment — add payment ──────────────────────────────────────────
router.post('/:id/payment', async (req: any, res) => {
  try {
    const { amount, method, details } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'amount must be positive' });
    if (!method)
      return res.status(400).json({ error: 'method is required' });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'cancelled')
      return res.status(400).json({ error: 'Cannot add payment to cancelled invoice' });

    await Payment.create({
      invoiceId: invoice._id,
      amount: Number(amount),
      method,
      details: details || {},
      createdBy: req.user.id,
    });

    // Recalculate total paid
    const allPayments = await Payment.find({ invoiceId: invoice._id });
    const totalPaid = allPayments.reduce((s, p) => s + (p.amount || 0), 0);
    invoice.status = computeStatus(invoice.totalAmount, totalPaid) as any;
    await invoice.save();

    res.json({ invoice: invoice.toObject(), payments: allPayments, totalPaid });
  } catch (e: any) {
    console.error('[invoices payment]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /:id/cancel ───────────────────────────────────────────────────────────
router.put('/:id/cancel', requireAnyAdmin, async (req: any, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
