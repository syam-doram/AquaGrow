import { AdminUser } from '../models/adminUser.js';
import bcrypt from 'bcryptjs';
import { logAudit } from '../utils/auditLog.js';
import { ROLES } from '../constants/roles.js';

// Helper to hash passwords
const hashPassword = async (plain: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

/** Create a new admin/staff user – owner only */
export const createStaff = async (req: any, res: any) => {
  try {
    const { name, email, password, role, tenantId, active } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
    if (!Object.values(ROLES).includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const existing = await AdminUser.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hashed = await hashPassword(password);
    const newUser = await AdminUser.create({ name, email, password: hashed, role, tenantId, active: active ?? true });

    await logAudit({
      tenantId: newUser.tenantId,
      action: 'CREATE_STAFF',
      userId: req.user.id,
      collection: 'AdminUser',
      documentId: newUser._id,
      before: null,
      after: newUser.toObject(),
    });

    // Do not return password hash
    const { password: _, ...sanitized } = newUser.toObject();
    res.status(201).json(sanitized);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/** List staff users (owner) */
export const listStaff = async (req: any, res: any) => {
  try {
    const staff = await AdminUser.find({}).select('-password');
    res.json(staff);
  } catch (e: any) {
    console.error(e);
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
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Update staff – owner only */
export const updateStaff = async (req: any, res: any) => {
  try {
    const updates: any = { ...req.body };
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    const before = await AdminUser.findById(req.params.id);
    if (!before) return res.status(404).json({ error: 'Staff not found' });
    const after = await AdminUser.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');

    await logAudit({
      tenantId: after?.tenantId,
      action: 'UPDATE_STAFF',
      userId: req.user.id,
      collection: 'AdminUser',
      documentId: after?._id,
      before: before?.toObject(),
      after: after?.toObject(),
    });

    res.json(after);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Deactivate (soft‑delete) staff – owner only */
export const deactivateStaff = async (req: any, res: any) => {
  try {
    const before = await AdminUser.findById(req.params.id);
    if (!before) return res.status(404).json({ error: 'Staff not found' });
    const after = await AdminUser.findByIdAndUpdate(req.params.id, { active: false }, { new: true }).select('-password');

    await logAudit({
      tenantId: after?.tenantId,
      action: 'DEACTIVATE_STAFF',
      userId: req.user.id,
      collection: 'AdminUser',
      documentId: after?._id,
      before: before?.toObject(),
      after: after?.toObject(),
    });

    res.json({ message: 'Staff deactivated', staff: after });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
