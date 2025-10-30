import { Schema, model, Document, Types } from 'mongoose';

export type CommunityMemberRole = 'owner' | 'moderator' | 'member';
export type CommunityMemberStatus = 'active' | 'pending' | 'banned';

export interface ICommunityMember {
  community: Types.ObjectId;
  user: Types.ObjectId;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommunityMemberDocument
  extends ICommunityMember,
    Document<Types.ObjectId> {}

const communityMemberSchema = new Schema<ICommunityMemberDocument>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'moderator', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'banned'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  },
);

communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });
communityMemberSchema.index({ user: 1, status: 1 });

const CommunityMember = model<ICommunityMemberDocument>('CommunityMember', communityMemberSchema);

export default CommunityMember;
