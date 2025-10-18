import api from './api';

export interface StarPack {
  id: string;
  name: string;
  stars: number;
  priceINR: number;
  bonusPercentage?: number;
}

export interface MembershipPlan {
  tier: 'free' | 'star-pass' | 'star-unlimited';
  name: string;
  monthlyStars: number;
  priceMonthlyINR: number;
  priceYearlyINR: number;
  aiPostsPerMonth: number;
  features: Array<{
    key: string;
    label: string;
    limit?: number | null;
  }>;
}

export const fetchBillingMeta = async () => {
  const { data } = await api.get<{ starPacks: StarPack[]; membershipPlans: MembershipPlan[] }>(
    '/billing/meta',
  );
  return data;
};

export const createStarsCheckout = async (packId: string) => {
  const { data } = await api.post<{
    orderId: string;
    amount: number;
    currency: string;
    razorpayKey: string;
    reference: string;
  }>('/billing/stars/checkout', { packId });
  return data;
};

export const createMembershipCheckout = async (
  tier: 'star-pass' | 'star-unlimited',
  cadence: 'monthly' | 'yearly',
) => {
  const { data } = await api.post<{
    orderId: string;
    amount: number;
    currency: string;
    razorpayKey: string;
    reference: string;
  }>('/billing/membership/checkout', { tier, cadence });
  return data;
};

export const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) => {
  const { data } = await api.post('/billing/verify', {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  });
  return data;
};
