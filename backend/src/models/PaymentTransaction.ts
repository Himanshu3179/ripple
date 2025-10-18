import { Schema, model, Document, Types } from 'mongoose';

export type TransactionKind = 'stars-pack' | 'membership-monthly' | 'membership-yearly';

export interface IPaymentTransaction {
  user: Types.ObjectId;
  kind: TransactionKind;
  reference: string;
  amountINR: number;
  starsAwarded?: number;
  membershipTier?: 'star-pass' | 'star-unlimited';
  membershipPeriodMonths?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentTransactionDocument
  extends IPaymentTransaction,
    Document<Types.ObjectId> {}

const paymentTransactionSchema = new Schema<IPaymentTransactionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    kind: {
      type: String,
      enum: ['stars-pack', 'membership-monthly', 'membership-yearly'],
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    amountINR: {
      type: Number,
      required: true,
      min: 0,
    },
    starsAwarded: {
      type: Number,
      default: 0,
    },
    membershipTier: {
      type: String,
      enum: ['star-pass', 'star-unlimited'],
    },
    membershipPeriodMonths: {
      type: Number,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

const PaymentTransaction = model<IPaymentTransactionDocument>(
  'PaymentTransaction',
  paymentTransactionSchema,
);

export default PaymentTransaction;
