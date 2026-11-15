import mongoose from 'mongoose';

// AdminUser collection – holds owner/admin accounts and staff accounts with elevated roles
// Do NOT duplicate existing User schema (farmers/providers). This model is separate.
// Fields are intentionally minimal – authentication uses JWT with password hash.

export const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Password stored as bcrypt hash
    password: { type: String, required: true },
    // Role determines permission set (owner, inventory_admin, sales_admin, etc.)
    role: {
      type: String,
      enum: [
        'owner',
        'inventory_admin',
        'sales_admin',
        'finance_admin',
        'operations_admin',
        'support_admin',
        'hr_admin',
        'technical_admin',
        'stock_staff',
        'billing_staff',
        'shop_manager',
      ],
      required: true,
    },
    // tenantId (= shop/branch) the admin belongs to – owners may be global (null)
    tenantId: { type: String },
    // Active flag – can be deactivated without deletion
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AdminUser = mongoose.model('AdminUser', AdminUserSchema);
