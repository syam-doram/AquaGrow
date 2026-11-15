// stockMovement.ts – records every stock change
import mongoose from 'mongoose';

const StockMovementSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  quantity: { type: Number, required: true }, // change in baseStockUnit (positive = in, negative = out)
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // receipt, invoice, etc.
  createdBy: { type: String, required: true },
}, { timestamps: true });

export const StockMovement = mongoose.models['StockMovement'] ?? mongoose.model('StockMovement', StockMovementSchema);
