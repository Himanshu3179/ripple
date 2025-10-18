import crypto from 'crypto';
import Razorpay from 'razorpay';

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} = process.env;

let razorpayInstance: Razorpay | null = null;

const getClient = () => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayInstance;
};

export const createOrder = async (amountINR: number, receipt: string, notes: Record<string, unknown>) => {
  const razorpay = getClient();
  const order = await razorpay.orders.create({
    amount: Math.round(amountINR * 100),
    currency: 'INR',
    receipt,
    notes,
  });
  return order;
};

export const verifySignature = (payload: string, signature: string) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return expected === signature;
};

export const verifyPaymentSignature = (orderId: string, paymentId: string, signature: string) => {
  if (!RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay key secret missing');
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
};
