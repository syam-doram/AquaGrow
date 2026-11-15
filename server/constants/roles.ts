export const ROLES = {
  OWNER: 'owner',
  INVENTORY_ADMIN: 'inventory_admin',
  SALES_ADMIN: 'sales_admin',
  FINANCE_ADMIN: 'finance_admin',
  OPERATIONS_ADMIN: 'operations_admin',
  SUPPORT_ADMIN: 'support_admin',
  HR_ADMIN: 'hr_admin',
  TECHNICAL_ADMIN: 'technical_admin',

  // Staff roles
  STOCK_STAFF: 'stock_staff',
  BILLING_STAFF: 'billing_staff',
  SHOP_MANAGER: 'shop_manager',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
