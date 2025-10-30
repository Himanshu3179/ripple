import { Schema, model, Document, Types } from 'mongoose';

export type LeaderboardType = 'stars-earned' | 'referrals' | 'missions';

export interface ILeaderboardEntry {
  type: LeaderboardType;
  user: Types.ObjectId;
  periodKey: string;
  value: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILeaderboardEntryDocument extends ILeaderboardEntry, Document<Types.ObjectId> {}

const leaderboardEntrySchema = new Schema<ILeaderboardEntryDocument>(
  {
    type: {
      type: String,
      enum: ['stars-earned', 'referrals', 'missions'],
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    periodKey: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

leaderboardEntrySchema.index({ type: 1, periodKey: 1, value: -1 });
leaderboardEntrySchema.index({ type: 1, user: 1, periodKey: 1 }, { unique: true });

const LeaderboardEntry = model<ILeaderboardEntryDocument>('LeaderboardEntry', leaderboardEntrySchema);

export default LeaderboardEntry;
