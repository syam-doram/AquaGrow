import express from 'express';
import crypto from 'crypto';
import { withTransaction } from '../utils/transaction.js';
import { normaliseQuantity } from '../utils/unitConversion.js';
import { logAudit } from '../utils/auditLog.js';
import { Receipt } from '../db.js';
import { Batch } from '../db.js';
import { StockMovement } from '../models/stockMovement.js';
import { authenticate, requireAnyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper to compute SHA‑256 hash of the JSON payload (excluding auto fields)
function payloadHash(body: any): string {
  const clone = { ...body };
  delete clone.idempotencyKey; // not part of payload hash per spec
  return crypto.createHash('sha256').update(JSON.stringify(clone)).digest('hex');
}

/**
 * POST /api/receipts – staff inward stock entry
 * Body must include:
 *   supplier, invoiceNumber, receiptDate?, items [{ productId, batchId?, enteredQuantity, enteredUnit }]
 *   idempotencyKey (client generated UUID)
 */
router.post('/receipts', authenticate, requireAnyAdmin, async (req, res) => {
  const user = req.user;
  const tenantId = user.tenantId;
  const createdBy = user.id;
  const { supplier, invoiceNumber, receiptDate, items, idempotencyKey } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant ID missing in token' });
  if (!idempotencyKey) return res.status(400).json({ error: 'idempotencyKey required' });

  const hash = payloadHash(req.body);

  try {
    const receipt = await withTransaction(async (session) => {
      // Check for existing receipt with same idempotencyKey
      const existing = await Receipt.findOne({ idempotencyKey }).session(session);
      if (existing) {
        if (existing.payloadHash !== hash) {
          // Conflict – same key but different payload
          throw { status: 409, message: 'Idempotency key conflict: payload differs' };
        }
        // Idempotent repeat – return the existing doc
        return existing;
      }

      // Build receipt items with normalized quantities
      const receiptItems = [];
      for (const it of items) {
        const product = await require('../db.js').Product.findById(it.productId).session(session);
        if (!product) throw { status: 400, message: 'Invalid productId' };
        const qtyBase = normaliseQuantity(it.enteredQuantity, it.enteredUnit, product.packSize);
        receiptItems.push({
          productId: it.productId,
          batchId: it.batchId,
          quantity: qtyBase,
          unit: product.baseStockUnit,
        });
        // Update the batch quantity if batch supplied
        if (it.batchId) {
          await Batch.findByIdAndUpdate(it.batchId, { $inc: { quantity: qtyBase } }, { session });
        }
        // Record stock movement
        await StockMovement.create([
          {
            tenantId,
            productId: it.productId,
            batchId: it.batchId,
            quantity: qtyBase,
            type: 'IN',
            referenceId: null, // will fill after receipt is saved
            createdBy,
          },
        ], { session });
      }

      const newReceipt = await Receipt.create([
        {
          tenantId,
          createdBy,
          idempotencyKey,
          payloadHash: hash,
          supplier,
          invoiceNumber,
          receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
          items: receiptItems,
        },
      ], { session });

      // Update referenceId for each StockMovement (now we have receipt _id)
      await StockMovement.updateMany(
        { referenceId: null, createdBy },
        { $set: { referenceId: newReceipt[0]._id } },
        { session },
      );

      // Audit log
      await logAudit({
        tenantId,
        action: 'CREATE_RECEIPT',
        userId: createdBy,
        collection: 'Receipt',
        documentId: newReceipt[0]._id,
        before: null,
        after: newReceipt[0].toObject(),
      });

      return newReceipt[0];
    });

    res.status(201).json(receipt);
  } catch (e: any) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
