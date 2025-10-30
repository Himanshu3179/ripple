import { Schema, model, Document, Types } from 'mongoose';

export interface ICommunityInvite {
  community: Types.ObjectId;
  code: string;
  createdBy: Types.ObjectId;
  maxUses?: number;
  uses: number;
  expiresAt?: Date;
  revoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommunityInviteDocument extends ICommunityInvite, Document<Types.ObjectId> {}

const communityInviteSchema = new Schema<ICommunityInviteDocument>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    maxUses: {
      type: Number,
    },
    uses: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

communityInviteSchema.index({ code: 1 });
communityInviteSchema.index({ community: 1, revoked: 1 });

const CommunityInvite = model<ICommunityInviteDocument>('CommunityInvite', communityInviteSchema);

export default CommunityInvite;
