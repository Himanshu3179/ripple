import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'tip-received'
  | 'referral-signup'
  | 'referral-subscription'
  | 'mission-completed'
  | 'post-removed';

export interface INotification {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  read: boolean;
  readAt?: Date | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationDocument extends INotification, Document<Types.ObjectId> {}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['tip-received', 'referral-signup', 'referral-subscription', 'mission-completed', 'post-removed'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = model<INotificationDocument>('Notification', notificationSchema);

export default Notification;
