import { AdminUser } from '../models/adminUser.js';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';
import { signAccess, signRefresh, saveRefreshToken } from '../utils/auth.js';

// Helper to hash passwords
const hashPassword = async (plain: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

/** Staff login — returns JWT with staff role */
export const staffLogin = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const user = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.active)
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your manager.' });

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      return res.status(401).json({ error: 'Invalid credentials' });

    // Only shop-level staff roles may use the staff portal
    const staffRoles = [ROLES.STOCK_STAFF, ROLES.BILLING_STAFF, ROLES.SHOP_MANAGER,
      ROLES.OWNER, ROLES.INVENTORY_ADMIN, ROLES.SALES_ADMIN, ROLES.FINANCE_ADMIN,
      ROLES.OPERATIONS_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.HR_ADMIN, ROLES.TECHNICAL_ADMIN];
    if (!staffRoles.includes(user.role as any))
      return res.status(403).json({ error: 'Access denied for this portal' });

    const id = user._id.toString();
    const access = signAccess({ id, role: user.role, tenantId: user.tenantId, col: 'admin' });
    const refresh = signRefresh({ id, col: 'admin' });
    await saveRefreshToken(id, refresh);

    const { password: _, ...safeUser } = user.toObject();
    return res.json({ user: safeUser, access_token: access, refresh_token: refresh });
  } catch (e: any) {
    console.error('[staffLogin]', e);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/staff/me — return current staff user from JWT */
export const getStaffMe = async (req: any, res: any) => {
  try {
    const user = await AdminUser.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.active) return res.status(403).json({ error: 'Account deactivated' });
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** Create a new shop staff user – owner/admin only */
export const createStaff = async (req: any, res: any) => {
  try {
    const { name, email, password, role, tenantId, active, phoneNumber } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'name, email, password, role are required' });
    if (!Object.values(ROLES).includes(role as any))
      return res.status(400).json({ error: 'Invalid role: ' + role });

    const existing = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hashed = await hashPassword(password);
    const newUser = await AdminUser.create({
      name,
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber?.trim() || undefined,
      password: hashed,
      role,
      tenantId,
      active: active ?? true,
    });

    const { password: _, ...sanitized } = newUser.toObject();
    res.status(201).json(sanitized);
  } catch (e: any) {
    console.error('[createStaff]', e);
    res.status(500).json({ error: 'Server error' });
  }
};

/** List staff users */
export const listStaff = async (req: any, res: any) => {
  try {
    const filter: any = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.tenantId) filter.tenantId = req.query.tenantId;
    const staff = await AdminUser.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(staff);
  } catch (e: any) {
    console.error('[listStaff]', e);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Get single staff */
export const getStaff = async (req: any, res: any) => {
  try {
    const user = await AdminUser.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Staff not found' });
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** Update staff */
export const updateStaff = async (req: any, res: any) => {
  try {
    const updates: any = { ...req.body };
    // Prevent escalation to owner from non-owner
    if (updates.role === ROLES.OWNER && req.user.role !== ROLES.OWNER)
      return res.status(403).json({ error: 'Only owner can assign owner role' });
    // Hash password if being reset
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    const before = await AdminUser.findById(req.params.id);
    if (!before) return res.status(404).json({ error: 'Staff not found' });
    const after = await AdminUser.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(after);
  } catch (e: any) {
    console.error('[updateStaff]', e);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Deactivate (soft-delete) staff */
export const deactivateStaff = async (req: any, res: any) => {
  try {
    const before = await AdminUser.findById(req.params.id);
    if (!before) return res.status(404).json({ error: 'Staff not found' });
    // Prevent deactivating self
    if (before._id.toString() === req.user.id)
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    const after = await AdminUser.findByIdAndUpdate(req.params.id, { active: false }, { new: true }).select('-password');
    res.json({ message: 'Staff deactivated', staff: after });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** Reset staff password — owner only */
export const resetStaffPassword = async (req: any, res: any) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const hashed = await hashPassword(newPassword);
    const user = await AdminUser.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Password updated', staff: user });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
};
