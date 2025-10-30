import { Schema, model, Document, Types } from 'mongoose';

export type MissionStatus = 'active' | 'completed' | 'claimed' | 'expired';

export interface IUserMission {
  user: Types.ObjectId;
  template: Types.ObjectId;
  dateKey: string;
  progress: number;
  target: number;
  status: MissionStatus;
  rewardStars: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserMissionDocument extends IUserMission, Document<Types.ObjectId> {}

const userMissionSchema = new Schema<IUserMissionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    template: {
      type: Schema.Types.ObjectId,
      ref: 'MissionTemplate',
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    target: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'claimed', 'expired'],
      default: 'active',
    },
    rewardStars: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userMissionSchema.index({ user: 1, template: 1, dateKey: 1 }, { unique: true });

const UserMission = model<IUserMissionDocument>('UserMission', userMissionSchema);

export default UserMission;
