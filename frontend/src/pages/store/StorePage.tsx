import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineSparkles, HiOutlineUserGroup } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { createMembershipCheckout, createStarsCheckout, fetchBillingMeta, MembershipPlan, StarPack, verifyPayment } from '../../lib/billing';
import { openRazorpayCheckout } from '../../lib/razorpay';
import useAuth from '../../hooks/useAuth';
import PlanCard from './components/PlanCard';
import StarPackCard from './components/StarPackCard';

const StorePage = () => {
  const { user, isAuthenticated, refreshAccount } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [membershipCadence, setMembershipCadence] = useState<'monthly' | 'yearly'>('monthly');

  const { data, isLoading } = useQuery<{ starPacks: StarPack[]; membershipPlans: MembershipPlan[] }>({
    queryKey: ['billing-meta'],
    queryFn: fetchBillingMeta,
  });

  const handleAuthGuard = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to upgrade your account.');
      navigate('/login');
      return false;
    }
    return true;
  };

  const startStarsCheckout = async (packId: string) => {
    if (!handleAuthGuard()) return;
    try {
      const checkout = await createStarsCheckout(packId);
      await openRazorpayCheckout({
        key: checkout.razorpayKey,
        amount: checkout.amount,
        currency: checkout.currency,
        name: 'Ripple Stars',
        description: 'Purchase Starforge credits',
        order_id: checkout.orderId,
        handler: async (response) => {
          try {
            await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
            toast.success('Stars added to your account!');
            await refreshAccount();
            queryClient.invalidateQueries({ queryKey: ['billing-meta'] });
          } catch (error) {
            console.error(error);
            toast.error('We could not verify the payment. Contact support.');
          }
        },
      });
    } catch (error) {
      console.error(error);
      toast.error('Unable to start checkout. Try again later.');
    }
  };

  const startMembershipCheckout = async (tier: 'star-pass' | 'star-unlimited') => {
    if (!handleAuthGuard()) return;
    try {
      const checkout = await createMembershipCheckout(tier, membershipCadence);
      await openRazorpayCheckout({
        key: checkout.razorpayKey,
        amount: checkout.amount,
        currency: checkout.currency,
        name: 'Ripple Membership',
        description: 'Unlock Star Pass benefits',
        order_id: checkout.orderId,
        handler: async (response) => {
          try {
            await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
            toast.success('Welcome to the Star Federation!');
            await refreshAccount();
          } catch (error) {
            console.error(error);
            toast.error('Unable to verify payment.');
          }
        },
      });
    } catch (error) {
      console.error(error);
      toast.error('Unable to initiate membership upgrade.');
    }
  };

  const currentMembership = useMemo(() => data?.membershipPlans.find((plan) => plan.tier === user?.membershipTier), [data?.membershipPlans, user?.membershipTier]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-500 via-indigo-500 to-slate-900 p-8 text-white shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold">Level up with Ripple Stars</h1>
            <p className="text-sm text-white/85">
              Earn Stars to unlock AI drafting power, premium moderation tools, and exclusive community lounges. Upgrade to Star Pass for monthly perks or join the Star Federation for unlimited access.
            </p>
            {user && (
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                <HiOutlineSparkles className="text-lg" />
                <span>{(user.starsBalance ?? 0).toLocaleString()} Stars available</span>
                <span className="text-white/70">•</span>
                <span className="capitalize">Current tier: {(user.membershipTier ?? 'free').replace('-', ' ')}</span>                {user.membershipExpiresAt && (
                  <span className="text-white/70">• Renews {new Date(user.membershipExpiresAt).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
          <div className="rounded-3xl bg-white/15 p-4 text-center text-sm shadow-inner backdrop-blur">
            <p className="font-semibold uppercase tracking-widest text-white/80">Starforge AI access</p>
            <p className="mt-2 text-2xl font-bold">{user?.aiPostQuota?.limit === -1 ? 'Unlimited' : `${Math.max((user?.aiPostQuota?.limit ?? 0) - (user?.aiPostQuota?.used ?? 0), 0)} remaining`}</p>
            {user?.aiPostQuota?.renewsAt && (
              <p className="text-xs text-white/70">Renews {new Date(user.aiPostQuota.renewsAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Stars marketplace</h2>
            <p className="text-sm text-slate-500">Instantly top up your Star balance and gift boosts to your friends.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading && <p className="text-sm text-slate-500">Loading star packs...</p>}
          {!isLoading && data?.starPacks.map((pack) => (
            <StarPackCard key={pack.id} pack={pack} onSelect={startStarsCheckout} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Membership tiers</h2>
            <p className="text-sm text-slate-500">Choose a membership that matches your ambition. Every tier includes monthly Stars.</p>
          </div>
          <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => setMembershipCadence('monthly')}
              className={`rounded-full px-3 py-1 ${membershipCadence === 'monthly' ? 'bg-white text-brand-600 shadow-sm' : ''}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setMembershipCadence('yearly')}
              className={`rounded-full px-3 py-1 ${membershipCadence === 'yearly' ? 'bg-white text-brand-600 shadow-sm' : ''}`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && <p className="text-sm text-slate-500">Loading membership options...</p>}
          {!isLoading && data?.membershipPlans.map((plan) => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              selectedCadence={membershipCadence}
              onSelect={startMembershipCheckout}
              isCurrent={plan.tier === user?.membershipTier}
            />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-200 bg-brand-50 p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-800">Invite crew, earn Stars</h3>
            <p className="mt-2 text-sm text-brand-700">
              Share your invite link and earn 50 bonus Stars when a friend joins Ripple. Star Pass members earn double.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!handleAuthGuard()) return;
              navigator.clipboard.writeText(`${window.location.origin}/invite/${user?.username ?? ''}`)
                .then(() => toast.success('Invite link copied!'))
                .catch(() => toast.error('Unable to copy invite link.'));
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <HiOutlineUserGroup className="text-lg" />
            Copy invite link
          </button>
        </div>
      </section>
    </div>
  );
};

export default StorePage;
