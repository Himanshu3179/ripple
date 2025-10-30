import { Schema, model, Document, Types } from 'mongoose';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportTargetType = 'post' | 'comment' | 'user';

export interface IReport {
  reporter: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  community?: Types.ObjectId | null;
  reason: string;
  status: ReportStatus;
  moderator?: Types.ObjectId | null;
  resolutionNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportDocument extends IReport, Document<Types.ObjectId> {}

const reportSchema = new Schema<IReportDocument>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'user'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'dismissed'],
      default: 'open',
    },
    moderator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });

const Report = model<IReportDocument>('Report', reportSchema);

export default Report;
