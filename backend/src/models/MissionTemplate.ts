import { Schema, model, Document } from 'mongoose';

export type MissionType = 'post' | 'comment' | 'starforge' | 'invite';

export interface IMissionTemplate {
  key: string;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  rewardStars: number;
  active: boolean;
  streakType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMissionTemplateDocument extends IMissionTemplate, Document {}

const missionTemplateSchema = new Schema<IMissionTemplateDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['post', 'comment', 'starforge', 'invite'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    rewardStars: {
      type: Number,
      required: true,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    streakType: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const MissionTemplate = model<IMissionTemplateDocument>('MissionTemplate', missionTemplateSchema);

export default MissionTemplate;
