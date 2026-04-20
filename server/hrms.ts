import mongoose from 'mongoose';

// ── HRMS Role Enum ─────────────────────────────────────────────────────────────
export const HRMS_ROLES = [
  'super_admin', 'hr_manager', 'finance_manager',
  'operations_manager', 'support_agent', 'employee',
] as const;
export type HRMSRole = typeof HRMS_ROLES[number];

// ── Department Employee Schema ─────────────────────────────────────────────────
const HREmployeeSchema = new mongoose.Schema({
  empId:          { type: String, required: true, unique: true },   // AQ-HR001
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  phone:          { type: String },
  role:           { type: String, enum: HRMS_ROLES, default: 'employee' },
  department:     { type: String },
  designation:    { type: String },
  joiningDate:    { type: String },
  salary:         { type: Number, default: 0 },
  salaryStructureId: { type: String },
  status:         { type: String, enum: ['active','inactive','on_leave','terminated'], default: 'active' },
  reportingTo:    { type: String },       // empId of manager
  photoUrl:       { type: String },
  address:        { type: String },
  bankAccount:    { type: String },
  ifsc:           { type: String },
  pan:            { type: String },
  aadhaar:        { type: String },
  emergencyContact: { name: String, phone: String, relation: String },
  passwordHash:   { type: String },       // bcrypt hashed password for empId login
}, { timestamps: true, collection: 'hremployees' });

// ── Attendance ─────────────────────────────────────────────────────────────────
const HRAttendanceSchema = new mongoose.Schema({
  empId:       { type: String, required: true },
  employeeId:  { type: String },              // MongoDB _id of employee
  date:        { type: String, required: true },
  checkIn:     { type: Date },
  checkOut:    { type: Date },
  workingHours: { type: Number },
  status:      { type: String, enum: ['present','absent','late','half_day','on_leave'], default: 'present' },
  notes:       { type: String },
}, { timestamps: true, collection: 'hrattendance' });

// ── Leaves ────────────────────────────────────────────────────────────────────
const HRLeaveSchema = new mongoose.Schema({
  empId:       { type: String, required: true },
  employeeName: { type: String },
  type:        { type: String, enum: ['sick','casual','earned','maternity','paternity','lop'], required: true },
  from:        { type: String, required: true },
  to:          { type: String, required: true },
  days:        { type: Number },
  reason:      { type: String },
  status:      { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy:  { type: String },
  approvedAt:  { type: Date },
  comments:    [{ by: String, text: String, at: Date }],
}, { timestamps: true, collection: 'hrleaves' });

// ── Payroll ───────────────────────────────────────────────────────────────────
const HRPayrollSchema = new mongoose.Schema({
  empId:       { type: String, required: true },
  employeeName: { type: String },
  month:       { type: String, required: true },  // YYYY-MM
  basicSalary: { type: Number, default: 0 },
  hra:         { type: Number, default: 0 },
  allowances:  { type: Number, default: 0 },
  deductions:  { type: Number, default: 0 },
  pf:          { type: Number, default: 0 },
  tax:         { type: Number, default: 0 },
  netPay:      { type: Number, default: 0 },
  grossPay:    { type: Number, default: 0 },
  status:      { type: String, enum: ['draft','pending_approval','approved','paid'], default: 'draft' },
  approvedBy:  { type: String },
  paidAt:      { type: Date },
  workingDays: { type: Number, default: 26 },
  presentDays: { type: Number, default: 26 },
  lopDays:     { type: Number, default: 0 },
  notes:       { type: String },
}, { timestamps: true, collection: 'hrpayroll' });

// ── Tickets ───────────────────────────────────────────────────────────────────
const HRTicketSchema = new mongoose.Schema({
  ticketId:    { type: String, unique: true },
  empId:       { type: String, required: true },
  createdByName: { type: String },
  category:    { type: String, enum: ['hr','it','payroll','leave','general','complaint'], default: 'general' },
  priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  subject:     { type: String, required: true },
  description: { type: String },
  status:      { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
  assignedTo:  { type: String },
  messages:    [{ by: String, role: String, text: String, at: Date }],
  resolvedAt:  { type: Date },
}, { timestamps: true, collection: 'hrtickets' });

// ── Performance Reviews ───────────────────────────────────────────────────────
const HRPerformanceSchema = new mongoose.Schema({
  empId:         { type: String, required: true },
  employeeName:  { type: String },
  reviewerEmpId: { type: String },
  reviewerName:  { type: String },
  period:        { type: String },  // 'Q1-2026', 'April-2026'
  rating:        { type: Number, min: 1, max: 5 },
  kpis: [{
    name:    String,
    target:  Number,
    achieved: Number,
    score:   Number,
  }],
  strengths:     { type: String },
  improvements:  { type: String },
  goals:         { type: String },
  status:        { type: String, enum: ['draft','submitted','acknowledged'], default: 'draft' },
}, { timestamps: true, collection: 'hrperformance' });

// ── HR Notifications ──────────────────────────────────────────────────────────
const HRNotificationSchema = new mongoose.Schema({
  recipientEmpId: { type: String, required: true },
  title:   { type: String },
  message: { type: String },
  type:    { type: String, default: 'info' },
  isRead:  { type: Boolean, default: false },
  link:    { type: String },
}, { timestamps: true, collection: 'hrnotifications' });

// ── Recruitment — Job Postings ────────────────────────────────────────────────
const HRJobSchema = new mongoose.Schema({
  role:        { type: String, required: true },
  department:  { type: String, required: true },
  skills:      { type: String },
  salaryMin:   { type: Number, default: 0 },
  salaryMax:   { type: Number, default: 0 },
  location:    { type: String, default: 'Nellore, AP' },
  openings:    { type: Number, default: 1 },
  status:      { type: String, enum: ['open', 'paused', 'closed'], default: 'open' },
  postedBy:    { type: String },   // empId of HR who posted
  description: { type: String },
}, { timestamps: true, collection: 'hrjobs' });

// ── Recruitment — Candidates ──────────────────────────────────────────────────
const HRCandidateSchema = new mongoose.Schema({
  jobId:     { type: mongoose.Schema.Types.ObjectId, ref: 'HRJob', required: true },
  jobRole:   { type: String },
  name:      { type: String, required: true },
  email:     { type: String },
  phone:     { type: String },
  source:    { type: String, default: 'Walk-in' },
  status:    {
    type: String,
    enum: ['applied', 'shortlisted', 'interviewed', 'selected', 'offered', 'rejected'],
    default: 'applied',
  },
  resumeUrl:      { type: String },
  notes:          { type: String },
  offeredSalary:  { type: Number },
  joiningDate:    { type: String },
  offerStatus:    { type: String, enum: ['pending', 'accepted', 'declined'] },
  offerSentAt:    { type: Date },
  convertedToEmp: { type: Boolean, default: false },
  addedBy:        { type: String },   // empId of HR who added candidate
}, { timestamps: true, collection: 'hrcandidates' });

// ── Full & Final Settlement ───────────────────────────────────────────────────
const HRFnFSchema = new mongoose.Schema({
  employeeId:        { type: String, required: true },   // _id of HREmployee
  employeeName:      { type: String },
  empId:             { type: String },
  department:        { type: String },
  separationType:    { type: String, enum: ['resignation', 'termination', 'retirement', 'voluntary'], required: true },
  lastWorkingDay:    { type: String, required: true },
  noticePeriodDays:  { type: Number, default: 30 },
  noticePeriodServed:{ type: Boolean, default: true },
  status:            { type: String, enum: ['initiated', 'pending_approval', 'approved', 'disbursed'], default: 'initiated' },
  // Earnings
  lastBasicSalary:   { type: Number, default: 0 },
  gratuityAmount:    { type: Number, default: 0 },
  leaveEncashment:   { type: Number, default: 0 },
  bonusAmount:       { type: Number, default: 0 },
  otherEarnings:     { type: Number, default: 0 },
  // Deductions
  noticePayDeduction: { type: Number, default: 0 },
  otherDeductions:    { type: Number, default: 0 },
  // Net
  netSettlement:     { type: Number, default: 0 },
  // Meta
  initiatedBy:       { type: String },
  approvedBy:        { type: String },
  approvedAt:        { type: Date },
  settledAt:         { type: Date },
  hrNotes:           { type: String },
  paymentMode:       { type: String },
  transactionRef:    { type: String },
}, { timestamps: true, collection: 'hrfnf' });

// ── Export models ─────────────────────────────────────────────────────────────
export const HREmployee     = mongoose.model('HREmployee',     HREmployeeSchema);
export const HRAttendance   = mongoose.model('HRAttendance',   HRAttendanceSchema);
export const HRLeave        = mongoose.model('HRLeave',        HRLeaveSchema);
export const HRPayroll      = mongoose.model('HRPayroll',      HRPayrollSchema);
export const HRTicket       = mongoose.model('HRTicket',       HRTicketSchema);
export const HRPerformance  = mongoose.model('HRPerformance',  HRPerformanceSchema);
export const HRNotification = mongoose.model('HRNotification', HRNotificationSchema);
export const HRJob          = mongoose.model('HRJob',          HRJobSchema);
export const HRCandidate    = mongoose.model('HRCandidate',    HRCandidateSchema);
export const HRFnF          = mongoose.model('HRFnF',          HRFnFSchema);
