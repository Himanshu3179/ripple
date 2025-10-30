import { Schema, model, Document, Types } from 'mongoose';

export type ScheduledPostStatus = 'scheduled' | 'published' | 'cancelled' | 'failed';

export interface IScheduledPost {
  author: Types.ObjectId;
  community?: Types.ObjectId | null;
  title: string;
  body?: string;
  topic: string;
  imageUrl?: string;
  scheduledFor: Date;
  status: ScheduledPostStatus;
  attempts: number;
  lastError?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IScheduledPostDocument extends IScheduledPost, Document<Types.ObjectId> {}

const scheduledPostSchema = new Schema<IScheduledPostDocument>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    imageUrl: {
      type: String,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'published', 'cancelled', 'failed'],
      default: 'scheduled',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

scheduledPostSchema.index({ status: 1, scheduledFor: 1 });

const ScheduledPost = model<IScheduledPostDocument>('ScheduledPost', scheduledPostSchema);

export default ScheduledPost;
