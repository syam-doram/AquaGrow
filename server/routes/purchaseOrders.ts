/**
 * Purchase Orders API
 * Owner/admin can create, update, cancel, and receive purchase orders.
 *
 * GET    /api/purchase-orders          → list all POs (filterable by status)
 * POST   /api/purchase-orders          → create a new PO (auto-generates orderNumber)
 * GET    /api/purchase-orders/:id      → single PO detail
 * PUT    /api/purchase-orders/:id      → update PO (edit draft, change status, etc.)
 * DELETE /api/purchase-orders/:id      → cancel a PO (sets status = 'cancelled')
 */
import express from 'express';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';
import { PurchaseOrder } from '../models/purchaseOrder.js';

const router = express.Router();

// All routes require admin auth
router.use(authenticate, requireAnyAdmin);

// ── Helper: generate PO number like PO-20261120-001 ──────────────────────────
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PO-${dateStr}-`;
  const count = await PurchaseOrder.countDocuments({
    orderNumber: { $regex: `^${prefix}` },
  });
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

// ── List POs ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.supplier) filter.supplier = { $regex: req.query.supplier, $options: 'i' };
    const orders = await PurchaseOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(orders);
  } catch (e: any) {
    console.error('[PO list]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Create PO ─────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      supplier, supplierPhone, supplierAddress,
      items, expectedDeliveryDate, notes, status,
    } = req.body;

    if (!supplier?.trim()) return res.status(400).json({ error: 'Supplier name is required' });
    if (!items?.length)   return res.status(400).json({ error: 'At least one item is required' });

    for (const it of items) {
      if (!it.productId)   return res.status(400).json({ error: 'Each item needs a productId' });
      if (!it.quantity || it.quantity <= 0) return res.status(400).json({ error: 'Each item needs a valid quantity' });
    }

    const orderNumber = await generateOrderNumber();
    const totalExpectedAmount = items.reduce(
      (sum: number, it: any) => sum + (it.expectedRate ?? 0) * (it.quantity ?? 0),
      0
    );

    const po = await PurchaseOrder.create({
      orderNumber,
      supplier: supplier.trim(),
      supplierPhone: supplierPhone?.trim(),
      supplierAddress: supplierAddress?.trim(),
      items,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      notes: notes?.trim(),
      status: status || 'draft',
      totalExpectedAmount,
      createdBy: (req as any).user?.id,
    });

    res.status(201).json(po);
  } catch (e: any) {
    console.error('[PO create]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get single PO ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(po);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update PO (edit / status change / mark sent or received) ─────────────────
router.put('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    if (po.status === 'cancelled') return res.status(400).json({ error: 'Cannot edit a cancelled order' });

    const {
      supplier, supplierPhone, supplierAddress,
      items, expectedDeliveryDate, notes, status, receivedQty,
    } = req.body;

    if (supplier)          po.supplier = supplier.trim();
    if (supplierPhone !== undefined) po.supplierPhone = supplierPhone?.trim();
    if (supplierAddress !== undefined) po.supplierAddress = supplierAddress?.trim();
    if (expectedDeliveryDate !== undefined) po.expectedDeliveryDate = expectedDeliveryDate;
    if (notes !== undefined)  po.notes = notes?.trim();
    if (items?.length)        po.items = items;

    if (status && status !== po.status) {
      po.status = status;
      if (status === 'sent') po.sentAt = new Date();
      if (status === 'received') po.receivedAt = new Date();
    }

    // Recalculate total
    po.totalExpectedAmount = (po.items as any[]).reduce(
      (sum: number, it: any) => sum + (it.expectedRate ?? 0) * (it.quantity ?? 0),
      0
    );

    await po.save();
    res.json(po);
  } catch (e: any) {
    console.error('[PO update]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Cancel PO ─────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.json({ message: 'Order cancelled', po });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
