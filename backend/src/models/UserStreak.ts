import { Schema, model, Document, Types } from 'mongoose';

export interface IUserStreak {
  user: Types.ObjectId;
  type: string;
  count: number;
  lastCompleted: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserStreakDocument extends IUserStreak, Document<Types.ObjectId> {}

const userStreakSchema = new Schema<IUserStreakDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    lastCompleted: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userStreakSchema.index({ user: 1, type: 1 }, { unique: true });

const UserStreak = model<IUserStreakDocument>('UserStreak', userStreakSchema);

export default UserStreak;
