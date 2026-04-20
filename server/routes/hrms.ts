/*
 * HRMS API Routes  —  /api/hrms/*
 *
 * Auth Strategy:
 *   - All routes require a valid JWT (authenticate middleware)
 *   - The JWT is issued on empId+password login via POST /api/hrms/auth/login
 *   - Role-gating is done inline using req.user.hrmsRole
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  HREmployee, HRAttendance, HRLeave,
  HRPayroll, HRTicket, HRPerformance, HRNotification,
  HRJob, HRCandidate, HRFnF,
} from '../hrms.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'aquagrow_jwt_secret_change_me_2026';

// ── Auth helpers ───────────────────────────────────────────────────────────────
const hrmsAuth = (req: any, res: any, next: any) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    req.hrmsUser = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const HR_ROLES = ['super_admin', 'hr_manager'];
const FINANCE_ROLES = ['super_admin', 'hr_manager', 'finance_manager'];
const MANAGER_ROLES = ['super_admin', 'hr_manager', 'operations_manager'];
const SUPPORT_ROLES = ['super_admin', 'hr_manager', 'operations_manager', 'support_agent'];

const requireHR = (req: any, res: any, next: any) => {
  if (!HR_ROLES.includes(req.hrmsUser?.hrmsRole))
    return res.status(403).json({ error: 'HR Manager or Super Admin access required' });
  next();
};
const requireFinance = (req: any, res: any, next: any) => {
  if (!FINANCE_ROLES.includes(req.hrmsUser?.hrmsRole))
    return res.status(403).json({ error: 'Finance access required' });
  next();
};
const requireManager = (req: any, res: any, next: any) => {
  if (!MANAGER_ROLES.includes(req.hrmsUser?.hrmsRole))
    return res.status(403).json({ error: 'Manager access required' });
  next();
};
const requireSupport = (req: any, res: any, next: any) => {
  if (!SUPPORT_ROLES.includes(req.hrmsUser?.hrmsRole))
    return res.status(403).json({ error: 'Support access required' });
  next();
};

const dbCheck = (res: any) =>
  mongoose.connection.readyState !== 1
    ? (res.status(503).json({ error: 'Database unavailable' }), true)
    : false;

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH  —  POST /api/hrms/auth/login
// ══════════════════════════════════════════════════════════════════════════════
router.post('/auth/login', async (req, res) => {
  try {
    if (dbCheck(res)) return;
    const { empId, password } = req.body;
    if (!empId || !password)
      return res.status(400).json({ error: 'empId and password are required' });

    const emp = await HREmployee.findOne({ empId: empId.toUpperCase() });
    if (!emp) return res.status(401).json({ error: `No employee found with ID "${empId}"` });
    if (emp.status === 'terminated' || emp.status === 'inactive')
      return res.status(403).json({ error: 'Account is inactive. Contact HR.' });

    const valid = emp.passwordHash ? await bcrypt.compare(password, emp.passwordHash) : false;
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: emp._id, empId: emp.empId, name: emp.name, email: emp.email, hrmsRole: emp.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({
      token,
      employee: {
        _id: emp._id, empId: emp.empId, name: emp.name, email: emp.email,
        role: emp.role, department: emp.department, designation: emp.designation,
        photoUrl: emp.photoUrl, status: emp.status, joiningDate: emp.joiningDate,
      }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/hrms/auth/me — verify token & return profile
router.get('/auth/me', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const emp = await HREmployee.findById(req.hrmsUser.id, '-passwordHash');
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  EMPLOYEES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/employees  (managers see all; employees see their own profile only)
router.get('/employees', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    if (MANAGER_ROLES.includes(req.hrmsUser.hrmsRole)) {
      const { dept, status, search } = req.query as any;
      const filter: any = {};
      if (dept)   filter.department = dept;
      if (status) filter.status = status;
      if (search) filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { empId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
      const emps = await HREmployee.find(filter, '-passwordHash').sort({ createdAt: -1 });
      return res.json(emps);
    }
    // Regular employee — only own profile
    const emp = await HREmployee.findById(req.hrmsUser.id, '-passwordHash');
    res.json(emp ? [emp] : []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/hrms/employees/:id
router.get('/employees/:id', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const emp = await HREmployee.findById(req.params.id, '-passwordHash');
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    // Non-manager can only view own record
    if (!MANAGER_ROLES.includes(req.hrmsUser.hrmsRole) && String(emp._id) !== req.hrmsUser.id)
      return res.status(403).json({ error: 'Access denied' });
    res.json(emp);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/employees  (HR only)
router.post('/employees', hrmsAuth, requireHR, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    const { password, ...rest } = req.body;
    const hashedPw = password ? await bcrypt.hash(password, 12) : undefined;
    const emp = await new HREmployee({
      ...rest,
      empId: rest.empId?.toUpperCase(),
      passwordHash: hashedPw,
    }).save();
    const { passwordHash: _, ...safeEmp } = (emp as any).toObject();
    res.status(201).json(safeEmp);
  } catch (e: any) {
    if (e.code === 11000) return res.status(409).json({ error: 'Employee ID or email already exists' });
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/hrms/employees/:id  (HR: any field; employee: limited non-sensitive fields)
router.put('/employees/:id', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const isHR = HR_ROLES.includes(req.hrmsUser.hrmsRole);
    const isSelf = req.hrmsUser.id === req.params.id;
    if (!isHR && !isSelf) return res.status(403).json({ error: 'Access denied' });

    const updates: any = { ...req.body };
    if (!isHR) {
      // Employees can only update safe personal fields
      const allowed = ['phone','address','emergencyContact','photoUrl'];
      Object.keys(updates).forEach(k => { if (!allowed.includes(k)) delete updates[k]; });
    }
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 12);
      delete updates.password;
    }
    const emp = await HREmployee.findByIdAndUpdate(req.params.id, updates, { new: true, select: '-passwordHash' });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/hrms/employees/:id  (HR only — soft delete via status)
router.delete('/employees/:id', hrmsAuth, requireHR, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    await HREmployee.findByIdAndUpdate(req.params.id, { status: 'terminated' });
    res.json({ success: true, message: 'Employee terminated' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ATTENDANCE
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/attendance?empId=&month=YYYY-MM
router.get('/attendance', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { empId, month, date } = req.query as any;
    const filter: any = {};
    // Non-managers can only see their own attendance
    if (!MANAGER_ROLES.includes(req.hrmsUser.hrmsRole)) {
      filter.empId = req.hrmsUser.empId;
    } else if (empId) {
      filter.empId = empId;
    }
    if (month) filter.date = { $regex: `^${month}` };
    if (date)  filter.date = date;
    const records = await HRAttendance.find(filter).sort({ date: -1 }).limit(500);
    res.json(records);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/attendance/checkin
router.post('/attendance/checkin', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const today = new Date().toISOString().slice(0, 10);
    const existing = await HRAttendance.findOne({ empId: req.hrmsUser.empId, date: today });
    if (existing?.checkIn) return res.status(409).json({ error: 'Already checked in today' });
    const record = await HRAttendance.findOneAndUpdate(
      { empId: req.hrmsUser.empId, date: today },
      { empId: req.hrmsUser.empId, employeeId: req.hrmsUser.id, date: today, checkIn: new Date(), status: 'present' },
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// POST /api/hrms/attendance/checkout
router.post('/attendance/checkout', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const today = new Date().toISOString().slice(0, 10);
    const record = await HRAttendance.findOne({ empId: req.hrmsUser.empId, date: today });
    if (!record?.checkIn) return res.status(400).json({ error: 'No check-in found for today' });
    if (record.checkOut) return res.status(409).json({ error: 'Already checked out' });
    const now = new Date();
    const hours = (now.getTime() - new Date(record.checkIn).getTime()) / 3600000;
    const updated = await HRAttendance.findByIdAndUpdate(
      record._id,
      { checkOut: now, workingHours: Math.round(hours * 100) / 100 },
      { new: true }
    );
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PUT /api/hrms/attendance/:id  (manager correction)
router.put('/attendance/:id', hrmsAuth, requireManager, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    const updated = await HRAttendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  LEAVES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/leaves?empId=&status=
router.get('/leaves', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { empId, status } = req.query as any;
    const filter: any = {};
    if (!MANAGER_ROLES.includes(req.hrmsUser.hrmsRole)) {
      filter.empId = req.hrmsUser.empId;
    } else if (empId) {
      filter.empId = empId;
    }
    if (status) filter.status = status;
    const leaves = await HRLeave.find(filter).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/leaves  (any employee can apply)
router.post('/leaves', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const leave = await new HRLeave({
      ...req.body,
      empId: req.hrmsUser.empId,
      employeeName: req.hrmsUser.name,
      status: 'pending',
    }).save();
    res.status(201).json(leave);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PUT /api/hrms/leaves/:id  (managers approve/reject; employee can cancel pending)
router.put('/leaves/:id', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const leave = await HRLeave.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave not found' });

    const isManager = MANAGER_ROLES.includes(req.hrmsUser.hrmsRole);
    const isSelf = leave.empId === req.hrmsUser.empId;

    if (!isManager && !isSelf) return res.status(403).json({ error: 'Access denied' });

    const updates: any = { ...req.body };
    if (req.body.status === 'approved' || req.body.status === 'rejected') {
      if (!isManager) return res.status(403).json({ error: 'Only managers can approve/reject leaves' });
      updates.approvedBy = req.hrmsUser.empId;
      updates.approvedAt = new Date();
    }
    const updated = await HRLeave.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// POST /api/hrms/leaves/:id/comment
router.post('/leaves/:id/comment', hrmsAuth, requireManager, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const leave = await HRLeave.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { by: req.hrmsUser.empId, text: req.body.text, at: new Date() } } },
      { new: true }
    );
    res.json(leave);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PAYROLL
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/payroll?month=&empId=
router.get('/payroll', hrmsAuth, requireFinance, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { month, empId, status } = req.query as any;
    const filter: any = {};
    if (month)  filter.month = month;
    if (empId)  filter.empId = empId;
    if (status) filter.status = status;
    const payroll = await HRPayroll.find(filter).sort({ month: -1, empId: 1 });
    res.json(payroll);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/hrms/payslips  (employee's own payslips)
router.get('/payslips', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const payslips = await HRPayroll.find(
      { empId: req.hrmsUser.empId, status: { $in: ['approved','paid'] } }
    ).sort({ month: -1 });
    res.json(payslips);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/payroll  (Finance: create/generate payroll)
router.post('/payroll', hrmsAuth, requireFinance, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    const record = await new HRPayroll(req.body).save();
    res.status(201).json(record);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// POST /api/hrms/payroll/bulk-generate  (generate for all active employees for a month)
router.post('/payroll/bulk-generate', hrmsAuth, requireFinance, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'month (YYYY-MM) is required' });

    const employees = await HREmployee.find({ status: 'active' });
    const results = [];
    for (const emp of employees) {
      const exists = await HRPayroll.findOne({ empId: emp.empId, month });
      if (exists) { results.push({ empId: emp.empId, status: 'skipped' }); continue; }

      const basic = emp.salary || 0;
      const hra   = Math.round(basic * 0.4);
      const allowances = Math.round(basic * 0.1);
      const pf   = Math.round(basic * 0.12);
      const tax  = basic > 50000 ? Math.round(basic * 0.1) : 0;
      const deductions = pf + tax;
      const grossPay   = basic + hra + allowances;
      const netPay     = grossPay - deductions;

      await new HRPayroll({
        empId: emp.empId, employeeName: emp.name, month,
        basicSalary: basic, hra, allowances, pf, tax,
        deductions, grossPay, netPay, status: 'draft',
      }).save();
      results.push({ empId: emp.empId, status: 'created', netPay });
    }
    res.json({ month, generated: results.length, results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/hrms/payroll/:id  (approve / mark paid)
router.put('/payroll/:id', hrmsAuth, requireFinance, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const updates: any = { ...req.body };
    if (updates.status === 'approved') updates.approvedBy = req.hrmsUser.empId;
    if (updates.status === 'paid')     updates.paidAt = new Date();
    const record = await HRPayroll.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(record);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  TICKETS
// ══════════════════════════════════════════════════════════════════════════════

const nextTicketId = async () => {
  const count = await HRTicket.countDocuments();
  return `TKT-${String(count + 1).padStart(5, '0')}`;
};

// GET /api/hrms/tickets
router.get('/tickets', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { status, category, priority } = req.query as any;
    const filter: any = {};
    if (!SUPPORT_ROLES.includes(req.hrmsUser.hrmsRole)) {
      filter.empId = req.hrmsUser.empId;
    }
    if (status)   filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    const tickets = await HRTicket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/tickets
router.post('/tickets', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const ticket = await new HRTicket({
      ...req.body,
      ticketId: await nextTicketId(),
      empId: req.hrmsUser.empId,
      createdByName: req.hrmsUser.name,
      status: 'open',
    }).save();
    res.status(201).json(ticket);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PUT /api/hrms/tickets/:id
router.put('/tickets/:id', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const ticket = await HRTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isSupport = SUPPORT_ROLES.includes(req.hrmsUser.hrmsRole);
    const isSelf    = ticket.empId === req.hrmsUser.empId;
    if (!isSupport && !isSelf) return res.status(403).json({ error: 'Access denied' });

    const updates: any = { ...req.body };
    if (updates.status === 'resolved') updates.resolvedAt = new Date();
    const updated = await HRTicket.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// POST /api/hrms/tickets/:id/message
router.post('/tickets/:id/message', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { text } = req.body;
    const ticket = await HRTicket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { by: req.hrmsUser.empId, role: req.hrmsUser.hrmsRole, text, at: new Date() } } },
      { new: true }
    );
    res.json(ticket);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PERFORMANCE REVIEWS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/performance?empId=&period=
router.get('/performance', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { empId, period } = req.query as any;
    const filter: any = {};
    if (!MANAGER_ROLES.includes(req.hrmsUser.hrmsRole)) {
      filter.empId = req.hrmsUser.empId;
    } else if (empId) {
      filter.empId = empId;
    }
    if (period) filter.period = period;
    const reviews = await HRPerformance.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/performance  (managers only)
router.post('/performance', hrmsAuth, requireManager, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const review = await new HRPerformance({
      ...req.body,
      reviewerEmpId: req.hrmsUser.empId,
      reviewerName: req.hrmsUser.name,
    }).save();
    res.status(201).json(review);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PUT /api/hrms/performance/:id
router.put('/performance/:id', hrmsAuth, requireManager, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    const updated = await HRPerformance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD STATS  —  /api/hrms/dashboard
// ══════════════════════════════════════════════════════════════════════════════
router.get('/dashboard', hrmsAuth, requireManager, async (_req, res) => {
  try {
    if (dbCheck(res)) return;
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);

    const [
      totalEmployees, activeEmployees, presentToday,
      pendingLeaves, openTickets, payrollDrafts,
    ] = await Promise.all([
      HREmployee.countDocuments(),
      HREmployee.countDocuments({ status: 'active' }),
      HRAttendance.countDocuments({ date: today, status: { $in: ['present','late'] } }),
      HRLeave.countDocuments({ status: 'pending' }),
      HRTicket.countDocuments({ status: { $in: ['open','in_progress'] } }),
      HRPayroll.countDocuments({ month: thisMonth, status: 'draft' }),
    ]);

    // Dept breakdown
    const deptAgg = await HREmployee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalEmployees, activeEmployees, presentToday,
      pendingLeaves, openTickets, payrollDrafts,
      attendanceRate: activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0,
      deptBreakdown: deptAgg,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
router.get('/notifications', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const notifs = await HRNotification.find({ recipientEmpId: req.hrmsUser.empId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/notifications/mark-read', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    await HRNotification.updateMany({ recipientEmpId: req.hrmsUser.empId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  RECRUITMENT — JOB POSTINGS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/jobs?status=open
router.get('/jobs', hrmsAuth, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { status } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    const jobs = await HRJob.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/jobs  (HR only)
router.post('/jobs', hrmsAuth, requireHR, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const job = await new HRJob({
      ...req.body,
      postedBy: req.hrmsUser.empId,
    }).save();
    res.status(201).json(job);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PUT /api/hrms/jobs/:id  (HR only — update status, details)
router.put('/jobs/:id', hrmsAuth, requireHR, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    const job = await HRJob.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/hrms/jobs/:id  (HR only)
router.delete('/jobs/:id', hrmsAuth, requireHR, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    await HRJob.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  RECRUITMENT — CANDIDATES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/candidates?jobId=&status=
router.get('/candidates', hrmsAuth, requireHR, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { jobId, status } = req.query as any;
    const filter: any = {};
    if (jobId)  filter.jobId = jobId;
    if (status) filter.status = status;
    const candidates = await HRCandidate.find(filter).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/candidates  (HR only)
router.post('/candidates', hrmsAuth, requireHR, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    // Auto-populate jobRole from the linked job
    let jobRole = req.body.jobRole;
    if (!jobRole && req.body.jobId) {
      const job = await HRJob.findById(req.body.jobId);
      jobRole = job?.role ?? '';
    }
    const candidate = await new HRCandidate({
      ...req.body,
      jobRole,
      status: 'applied',
      addedBy: req.hrmsUser.empId,
    }).save();
    res.status(201).json(candidate);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PUT /api/hrms/candidates/:id  (move stage, send offer, etc.)
router.put('/candidates/:id', hrmsAuth, requireHR, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const updates: any = { ...req.body };
    if (updates.status === 'offered') updates.offerSentAt = new Date();
    const candidate = await HRCandidate.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/hrms/candidates/:id  (HR only)
router.delete('/candidates/:id', hrmsAuth, requireHR, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    await HRCandidate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  FULL & FINAL SETTLEMENT
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hrms/fnf?status=&empId=
router.get('/fnf', hrmsAuth, requireFinance, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { status, empId } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    if (empId)  filter.empId = empId;
    const records = await HRFnF.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/hrms/fnf/:id
router.get('/fnf/:id', hrmsAuth, requireFinance, async (req, res) => {
  try {
    if (dbCheck(res)) return;
    const record = await HRFnF.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'F&F record not found' });
    res.json(record);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/hrms/fnf  (HR initiates F&F)
router.post('/fnf', hrmsAuth, requireHR, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { employeeId, ...rest } = req.body;
    // Fetch employee details to auto-populate name/dept
    const emp = await HREmployee.findById(employeeId, '-passwordHash');
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    // Calculate gratuity: 15/26 * basic * years of service (min 5 years)
    const joiningDate = emp.joiningDate ? new Date(emp.joiningDate) : new Date();
    const yearsOfService = (Date.now() - joiningDate.getTime()) / (365.25 * 24 * 3600 * 1000);
    const gratuityAmount = yearsOfService >= 5
      ? Math.round((15 / 26) * (emp.salary || 0) * Math.floor(yearsOfService))
      : 0;

    const record = await new HRFnF({
      ...rest,
      employeeId: String(emp._id),
      employeeName: emp.name,
      empId: emp.empId,
      department: emp.department,
      lastBasicSalary: emp.salary || 0,
      gratuityAmount,
      status: 'initiated',
      initiatedBy: req.hrmsUser.empId,
    }).save();

    // Mark employee as terminated
    await HREmployee.findByIdAndUpdate(employeeId, { status: 'terminated' });

    res.status(201).json(record);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PUT /api/hrms/fnf/:id  (HR updates settlement amounts)
router.put('/fnf/:id', hrmsAuth, requireHR, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const updates: any = { ...req.body };
    // Auto-calculate net if amounts are updated
    if (
      updates.lastBasicSalary !== undefined ||
      updates.gratuityAmount !== undefined ||
      updates.leaveEncashment !== undefined ||
      updates.bonusAmount !== undefined ||
      updates.otherEarnings !== undefined ||
      updates.noticePayDeduction !== undefined ||
      updates.otherDeductions !== undefined
    ) {
      const existing = await HRFnF.findById(req.params.id);
      if (existing) {
        const merged = { ...existing.toObject(), ...updates };
        const gross = (merged.lastBasicSalary || 0) + (merged.gratuityAmount || 0) +
          (merged.leaveEncashment || 0) + (merged.bonusAmount || 0) + (merged.otherEarnings || 0);
        const deductions = (merged.noticePayDeduction || 0) + (merged.otherDeductions || 0);
        updates.netSettlement = Math.max(0, gross - deductions);
      }
    }
    if (updates.status === 'pending_approval') updates.status = 'pending_approval';
    const record = await HRFnF.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(record);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PATCH /api/hrms/fnf/:id/approve  (Finance approves)
router.patch('/fnf/:id/approve', hrmsAuth, requireFinance, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const record = await HRFnF.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.hrmsUser.empId, approvedAt: new Date() },
      { new: true }
    );
    res.json(record);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// PATCH /api/hrms/fnf/:id/disburse  (Finance marks as disbursed)
router.patch('/fnf/:id/disburse', hrmsAuth, requireFinance, async (req: any, res) => {
  try {
    if (dbCheck(res)) return;
    const { paymentMode, transactionRef } = req.body;
    const record = await HRFnF.findByIdAndUpdate(
      req.params.id,
      { status: 'disbursed', paymentMode, transactionRef, settledAt: new Date() },
      { new: true }
    );
    res.json(record);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
