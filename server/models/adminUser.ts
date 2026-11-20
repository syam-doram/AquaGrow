/**
 * AdminUser model for ERP staff portal.
 * Stored in 'staffusers' collection to avoid conflict with the main 'adminusers' collection
 * in db.ts (which uses phoneNumber for farmer-side admin login).
 *
 * ERP staff log in with email + password.
 */
import mongoose from 'mongoose';

const StaffUserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },   // optional mobile contact number
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        'owner', 'stock_staff', 'billing_staff', 'shop_manager',
        'inventory_admin', 'sales_admin', 'finance_admin',
        'operations_admin', 'support_admin', 'hr_admin', 'technical_admin',
        'super_admin',
      ],
      required: true,
    },
    tenantId: { type: String },     // shop / branch
    active:   { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'staffusers' }
);

// Avoid OverwriteModelError in hot-reload / tsx environments
export const AdminUser =
  (mongoose.models['StaffUser'] as mongoose.Model<any>) ||
  mongoose.model('StaffUser', StaffUserSchema);
