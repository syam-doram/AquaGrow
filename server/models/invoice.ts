import mongoose from 'mongoose';

// Invoice schema – all monetary values stored in paise (integer) for precision.
// Items reference Product and store the approved selling rate snapshot at creation time.

export const InvoiceSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true }, // staff user id
    idempotencyKey: { type: String, required: true, unique: true },
    payloadHash: { type: String, required: true },
    // Simplified farmer reference – could be a userId or external identifier
    farmerId: { type: String, required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantityBase: { type: Number, required: true }, // normalized to base stock unit (e.g., kg)
        unit: { type: String, required: true }, // base unit name
        ratePaise: { type: Number, required: true }, // approved selling price per base unit
        amountPaise: { type: Number, required: true }, // quantityBase * ratePaise
      },
    ],
    totalAmountPaise: { type: Number, required: true },
    status: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
    payments: [
      {
        amountPaise: { type: Number, required: true },
        method: { type: String, required: true }, // cash, upi, bank, credit
        paidAt: { type: Date, default: Date.now },
      },
    ],
    // optional fields for notes etc.
  },
  { timestamps: true }
);

export const Invoice = mongoose.models['Invoice'] ?? mongoose.model('Invoice', InvoiceSchema);
