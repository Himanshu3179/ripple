import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog {
  actor: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: Types.ObjectId | string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document<Types.ObjectId> {}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
    },
    targetId: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = model<IAuditLogDocument>('AuditLog', auditLogSchema);

export default AuditLog;
