/**
 * PurchaseOrder model
 * Tracks orders placed to wholesale suppliers for product restocking.
 * Flow: Draft → Sent → Partially Received → Received | Cancelled
 */
import mongoose from 'mongoose';

const POItemSchema = new mongoose.Schema(
  {
    productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true }, // denormalized for quick reads
    quantity:    { type: Number, required: true, min: 0 },
    unit:        { type: String, required: true },     // kg, bag, L …
    packSize:    { type: Number },                     // kg per bag if applicable
    expectedRate: { type: Number },                   // ₹ per unit expected from supplier
    receivedQty:  { type: Number, default: 0 },        // filled when goods arrive
  },
  { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // PO-YYYYMMDD-XXX
    supplier:    { type: String, required: true },
    supplierPhone: { type: String },
    supplierAddress: { type: String },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
    },
    items:       { type: [POItemSchema], required: true },
    expectedDeliveryDate: { type: Date },
    notes:       { type: String },
    sentAt:      { type: Date },
    receivedAt:  { type: Date },
    createdBy:   { type: String }, // staff/admin ID
    totalExpectedAmount: { type: Number, default: 0 }, // ₹ plain
  },
  { timestamps: true, collection: 'purchaseorders' }
);

export const PurchaseOrder =
  (mongoose.models['PurchaseOrder'] as mongoose.Model<any>) ||
  mongoose.model('PurchaseOrder', PurchaseOrderSchema);
