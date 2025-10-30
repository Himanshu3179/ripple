import { Schema, model, Document, Types } from 'mongoose';

export type CommunityVisibility = 'public' | 'restricted' | 'private';

export interface ICommunity {
  name: string;
  slug: string;
  description?: string;
  creator: Types.ObjectId;
  visibility: CommunityVisibility;
  avatarImage?: string;
  bannerImage?: string;
  memberCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommunityDocument extends ICommunity, Document<Types.ObjectId> {}

const communitySchema = new Schema<ICommunityDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'restricted', 'private'],
      default: 'public',
    },
    avatarImage: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    memberCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

communitySchema.index({ slug: 1 });

const Community = model<ICommunityDocument>('Community', communitySchema);

export default Community;
