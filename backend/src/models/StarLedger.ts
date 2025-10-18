import { Schema, model, Document, Types } from 'mongoose';
import { StarLedgerEntryType } from '../config/economy';

export interface IStarLedger {
  user: Types.ObjectId;
  type: StarLedgerEntryType;
  stars: number;
  balanceAfter: number;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IStarLedgerDocument extends IStarLedger, Document<Types.ObjectId> {}

const starLedgerSchema = new Schema<IStarLedgerDocument>(
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
    stars: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

const StarLedger = model<IStarLedgerDocument>('StarLedger', starLedgerSchema);

export default StarLedger;
