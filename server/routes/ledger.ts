/**
 * Ledger Route
 * Mounted at /api/ledger
 *
 * GET /api/ledger?farmerId=&from=&to=  — farmer ledger entries
 */
import express from 'express';
import { LedgerEntry, Invoice, Payment } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { farmerId, from, to } = req.query as Record<string, string>;

    // Build invoice filter to find ledger entries for a farmer
    const invoiceFilter: any = {};
    if (farmerId) invoiceFilter.farmerId = farmerId;
    if (from || to) {
      invoiceFilter.createdAt = {};
      if (from) invoiceFilter.createdAt.$gte = new Date(from);
      if (to)   invoiceFilter.createdAt.$lte = new Date(to);
    }

    // Fetch invoices for this farmer
    const invoices = await Invoice.find(invoiceFilter)
      .populate('items.productId', 'name code unit')
      .sort({ createdAt: -1 });

    // Fetch payments for these invoices
    const invoiceIds = invoices.map(inv => inv._id);
    const payments = await Payment.find({ invoiceId: { $in: invoiceIds } }).sort({ createdAt: 1 });

    // Build ledger rows combining invoices and payments
    const ledger: any[] = [];

    for (const inv of invoices) {
      ledger.push({
        type: 'Invoice',
        date: inv.createdAt,
        description: `Sale — ${inv.items.length} item(s)`,
        debit: inv.totalAmount,
        credit: 0,
        balance: null, // computed client-side or in a next iteration
        invoiceId: inv._id,
        status: inv.status,
        items: inv.items,
      });
    }

    for (const pmt of payments) {
      ledger.push({
        type: 'Payment',
        date: pmt.createdAt,
        description: `Payment — ${pmt.method}`,
        debit: 0,
        credit: pmt.amount,
        balance: null,
        invoiceId: pmt.invoiceId,
        paymentId: pmt._id,
        method: pmt.method,
      });
    }

    // Sort by date ascending, then compute running balance
    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = 0;
    for (const row of ledger) {
      runningBalance += row.debit - row.credit;
      row.balance = Math.round(runningBalance * 100) / 100;
    }

    const totalDebit  = ledger.reduce((s, r) => s + r.debit,  0);
    const totalCredit = ledger.reduce((s, r) => s + r.credit, 0);
    const outstanding = Math.round((totalDebit - totalCredit) * 100) / 100;

    res.json({
      farmerId,
      from,
      to,
      ledger,
      totalDebit,
      totalCredit,
      outstanding,
    });
  } catch (e: any) {
    console.error('[ledger GET]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
