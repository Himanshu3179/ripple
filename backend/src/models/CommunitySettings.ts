import { Schema, model, Document, Types } from 'mongoose';

export interface ICommunitySettings {
  community: Types.ObjectId;
  bannedKeywords: string[];
  allowExternalLinks: boolean;
  slowModeSeconds?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommunitySettingsDocument
  extends ICommunitySettings,
    Document<Types.ObjectId> {}

const communitySettingsSchema = new Schema<ICommunitySettingsDocument>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      unique: true,
      required: true,
    },
    bannedKeywords: {
      type: [String],
      default: [],
    },
    allowExternalLinks: {
      type: Boolean,
      default: true,
    },
    slowModeSeconds: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

const CommunitySettings = model<ICommunitySettingsDocument>('CommunitySettings', communitySettingsSchema);

export default CommunitySettings;
