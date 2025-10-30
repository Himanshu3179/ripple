import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import User from '../models/User';
import PaymentTransaction from '../models/PaymentTransaction';
import { MEMBERSHIP_PLANS, STAR_PACKS } from '../config/billing';
import { POST_BOOST_COST, STARFORGE_EXTRA_DRAFT_COST } from '../config/economy';
import { createOrder, verifyPaymentSignature, verifySignature } from '../services/razorpayService';
import { recordSubscriptionReferral } from './referralController';
import { adjustStars } from '../services/starService';

const getPlanByTier = (tier: string) => MEMBERSHIP_PLANS.find((plan) => plan.tier === tier);

export const getBillingMeta = async (_req: Request, res: Response) => {
  res.status(200).json({
    starPacks: STAR_PACKS,
    membershipPlans: MEMBERSHIP_PLANS,
    costs: {
      starforgeExtraDraft: STARFORGE_EXTRA_DRAFT_COST,
      postBoost: POST_BOOST_COST,
    },
  });
};

export const getBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      starsBalance: user.starsBalance ?? 0,
      membershipTier: user.membershipTier,
      membershipExpiresAt: user.membershipExpiresAt,
      aiPostQuota: user.aiPostQuota,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const createStarsCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { packId } = req.body as { packId: string };
    const pack = STAR_PACKS.find((item) => item.id === packId);

    if (!pack) {
      res.status(400).json({ message: 'Invalid star pack' });
      return;
    }

const reference = randomUUID();
    const order = await createOrder(pack.priceINR, reference, {
      userId: req.user._id.toString(),
      kind: 'stars-pack',
      packId,
    });

    await PaymentTransaction.create({
      user: req.user._id,
      kind: 'stars-pack',
      reference,
      amountINR: pack.priceINR,
      starsAwarded: pack.stars,
      razorpayOrderId: order.id,
      status: 'created',
      metadata: {
        packId,
      },
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      reference,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const createMembershipCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { tier, cadence, referralCode } = req.body as {
      tier: string;
      cadence: 'monthly' | 'yearly';
      referralCode?: string;
    };
    const plan = getPlanByTier(tier);

    if (!plan || plan.tier === 'free') {
      res.status(400).json({ message: 'Invalid membership tier' });
      return;
    }

    const amount = cadence === 'yearly' ? plan.priceYearlyINR : plan.priceMonthlyINR;
    const periodMonths = cadence === 'yearly' ? 12 : 1;

    const reference = randomUUID();
    const order = await createOrder(amount, reference, {
      userId: req.user._id.toString(),
      kind: `membership-${cadence}`,
      tier,
    });

    await PaymentTransaction.create({
      user: req.user._id,
      kind: cadence === 'yearly' ? 'membership-yearly' : 'membership-monthly',
      reference,
      amountINR: amount,
      membershipTier: plan.tier,
      membershipPeriodMonths: periodMonths,
      starsAwarded: plan.monthlyStars,
      razorpayOrderId: order.id,
      status: 'created',
      metadata: {
        plan,
        cadence,
        referralCode: referralCode?.toUpperCase(),
      },
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      reference,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as Record<
      string,
      string
    >;

    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      res.status(400).json({ message: 'Signature mismatch' });
      return;
    }

    const transaction = await PaymentTransaction.findOne({ razorpayOrderId: razorpay_order_id });

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    await applyTransactionEffects(transaction._id.toString(), razorpay_payment_id, razorpay_signature);
    if (transaction.membershipTier && transaction.metadata?.referralCode) {
      const referrer = await User.findOne({ 'referral.code': transaction.metadata.referralCode });
      if (referrer) {
        await recordSubscriptionReferral(referrer._id.toString(), transaction.user.toString());
      }
    }
    const user = await User.findById(transaction.user);

    res.status(200).json({
      message: 'Payment verified',
      starsBalance: user?.starsBalance,
      membershipTier: user?.membershipTier,
      membershipExpiresAt: user?.membershipExpiresAt,
    });
  } catch (error) {
    next(error as Error);
  }
};

const applyTransactionEffects = async (
  transactionId: string,
  paymentId?: string,
  signature?: string,
) => {
  const transaction = await PaymentTransaction.findById(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'paid') {
    return transaction;
  }

  const user = await User.findById(transaction.user);
  if (!user) {
    throw new Error('User not found');
  }

  if (paymentId) {
    transaction.razorpayPaymentId = paymentId;
  }
  if (signature) {
    transaction.razorpaySignature = signature;
  }
  transaction.status = 'paid';
  await transaction.save();

  if (transaction.kind === 'stars-pack') {
    const starsToAdd = transaction.starsAwarded ?? 0;
    const updated = await adjustStars(user._id.toString(), starsToAdd, 'purchase', transaction.reference, {
      orderId: transaction.razorpayOrderId,
    });
    user.starsBalance = updated.starsBalance;
  } else if (transaction.membershipTier) {
    user.membershipTier = transaction.membershipTier;
    const now = new Date();
    const months = transaction.membershipPeriodMonths ?? 1;
    const expiresAt = user.membershipExpiresAt && user.membershipExpiresAt > now
      ? new Date(user.membershipExpiresAt)
      : now;
    expiresAt.setUTCMonth(expiresAt.getUTCMonth() + months);
    user.membershipExpiresAt = expiresAt;

    const plan = getPlanByTier(transaction.membershipTier);
    if (plan) {
      if (plan.aiPostsPerMonth < 0) {
        user.aiPostQuota = {
          limit: -1,
          used: 0,
          renewsAt: expiresAt,
        };
      } else {
        const renewsAt = new Date();
        renewsAt.setUTCMonth(renewsAt.getUTCMonth() + 1);
        user.aiPostQuota = {
          limit: plan.aiPostsPerMonth,
          used: 0,
          renewsAt,
        };
      }
      user.settings = user.settings || { hideAds: false, theme: 'light' };
      user.settings.hideAds = true;
      const starsBonus = transaction.starsAwarded ?? 0;
      if (starsBonus > 0) {
        const updated = await adjustStars(
          user._id.toString(),
          starsBonus,
          'membership',
            transaction.reference,
            {
              orderId: transaction.razorpayOrderId,
            },
          );
          user.starsBalance = updated.starsBalance;
        }
    }
  }

  await user.save();

  return transaction;
};

export const razorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ message: 'Missing signature' });
      return;
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const body = rawBody ? rawBody.toString('utf-8') : JSON.stringify(req.body);
    if (!verifySignature(body, signature)) {
      res.status(400).json({ message: 'Signature mismatch' });
      return;
    }

    const { event, payload } = req.body as {
      event: string;
      payload: {
        payment?: {
          entity: {
            id: string;
            order_id: string;
            status: string;
          };
        };
        order?: {
          entity: {
            id: string;
          };
        };
      };
    };

    if (event === 'payment.captured' && payload.payment) {
      const { order_id, id } = payload.payment.entity;
      const transaction = await PaymentTransaction.findOne({ razorpayOrderId: order_id });
      if (transaction) {
        await applyTransactionEffects(transaction._id.toString(), id, signature);
        if (transaction.membershipTier && transaction.metadata?.referralCode) {
          const referrer = await User.findOne({ 'referral.code': transaction.metadata.referralCode });
          if (referrer) {
            await recordSubscriptionReferral(referrer._id.toString(), transaction.user.toString());
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error as Error);
  }
};
