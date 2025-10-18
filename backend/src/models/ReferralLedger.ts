import { Schema, model, Document, Types } from 'mongoose';

export interface IReferralLedger {
  referrer: Types.ObjectId;
  invitee?: Types.ObjectId;
  inviteeEmail?: string;
  rewardStars: number;
  rewardType: 'signup' | 'subscription';
  claimed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReferralLedgerDocument extends IReferralLedger, Document<Types.ObjectId> {}

const referralLedgerSchema = new Schema<IReferralLedgerDocument>(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    inviteeEmail: {
      type: String,
    },
    rewardStars: {
      type: Number,
      default: 0,
    },
    rewardType: {
      type: String,
      enum: ['signup', 'subscription'],
      default: 'signup',
    },
    claimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const ReferralLedger = model<IReferralLedgerDocument>('ReferralLedger', referralLedgerSchema);

export default ReferralLedger;
