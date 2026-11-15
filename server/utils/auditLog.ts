// auditLog.ts – generic audit logging utility
import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  userId: { type: String, required: true },
  collection: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export const AuditLog = mongoose.models['AuditLog'] ?? mongoose.model('AuditLog', AuditLogSchema);

/** Log an audit entry */
export async function logAudit(params: {
  tenantId: string;
  action: string;
  userId: string;
  collection: string;
  documentId: mongoose.Types.ObjectId;
  before: any;
  after: any;
}) {
  await AuditLog.create(params);
}
