import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HiOutlineClipboard, HiOutlineClipboardDocumentCheck, HiOutlineSparkles, HiOutlineUsers } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import useAuth from '../../hooks/useAuth';
import { claimReferralRewards, fetchReferralDashboard, type ReferralLedgerEntry } from '../../lib/referrals';
import dayjs from '../../utils/date';

const ReferralPage = () => {
  const { isAuthenticated, refreshAccount } = useAuth();
  const queryClient = useQueryClient();
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const copyResetRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current);
        copyResetRef.current = null;
      }
    },
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['referrals', 'dashboard'],
    queryFn: fetchReferralDashboard,
    enabled: isAuthenticated,
  });

  const claimMutation = useMutation({
    mutationFn: claimReferralRewards,
    onSuccess: (response) => {
      const { claimedRewards } = response;
      toast.success(
        claimedRewards > 1 ? `Claimed ${claimedRewards} referral rewards` : 'Referral reward claimed',
      );
      refreshAccount();
      queryClient.invalidateQueries({ queryKey: ['referrals', 'dashboard'] });
    },
    onError: (claimError: any) => {
      toast.error(claimError?.response?.data?.message ?? 'Unable to claim rewards right now');
    },
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/referrals' }} replace />;
  }

  const referralCode = data?.code ?? '';
  const referralUrl = useMemo(() => {
    if (!referralCode) return '';
    if (typeof window === 'undefined') return `/register?ref=${referralCode}`;
    return `${window.location.origin}/register?ref=${referralCode}`;
  }, [referralCode]);

  const pendingRewards = data?.ledger?.filter((entry) => !entry.claimed).length ?? 0;
  const pendingStars = data?.ledger?.reduce(
    (sum, entry) => (!entry.claimed ? sum + entry.rewardStars : sum),
    0,
  ) ?? 0;
  const claimedStars = data?.ledger?.reduce(
    (sum, entry) => (entry.claimed ? sum + entry.rewardStars : sum),
    0,
  ) ?? 0;

  const canClaim = pendingRewards > 0 && !claimMutation.isPending;

  const handleCopyLink = async () => {
    if (!referralUrl) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralUrl);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      toast.success('Referral link copied');
      setCopyState('copied');
      copyResetRef.current = window.setTimeout(() => {
        setCopyState('idle');
        copyResetRef.current = null;
      }, 2000);
    } catch (copyError) {
      window.prompt('Copy your referral link', referralUrl);
      toast.success('Referral link ready to copy');
    }
  };

  const formatLedgerEntry = (entry: ReferralLedgerEntry) => {
    const label = entry.rewardType === 'subscription' ? 'Subscription bonus' : 'Signup bonus';
    const target = entry.inviteeEmail || entry.invitee || 'Friend';
    return {
      label,
      target,
      createdAt: dayjs(entry.createdAt).format('MMM D, YYYY'),
      stars: entry.rewardStars,
      claimed: entry.claimed,
    };
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900">Referral hub</h1>
            <p className="text-sm text-slate-500">
              Invite friends to Ripple. Earn Stars when they sign up and bonus rewards when they upgrade.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
              <HiOutlineUsers className="text-base" />
              {(data?.invitedCount ?? 0).toLocaleString()} total invites
            </div>
          </div>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your referral link</p>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card">
                <span className="font-mono text-lg font-semibold text-slate-700">
                  {referralCode || '------'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  {copyState === 'copied' ? (
                    <>
                      <HiOutlineClipboardDocumentCheck className="text-base text-brand-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <HiOutlineClipboard className="text-base" />
                      Copy link
                    </>
                  )}
                </button>
              </div>
              <code className="block truncate rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500">
                {referralUrl || 'Your link will appear here once loaded.'}
              </code>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending rewards</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingRewards}</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting claim</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Stars</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <HiOutlineSparkles className="text-xl text-brand-500" />
            {pendingStars.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Claim once your friends take action</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stars claimed</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <HiOutlineSparkles className="text-xl text-brand-500" />
            {claimedStars.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Already added to your balance</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Reward ledger</h2>
            <p className="text-sm text-slate-500">Track every invite and reward event.</p>
          </div>
          <button
            type="button"
            onClick={() => claimMutation.mutate()}
            disabled={!canClaim}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
              canClaim
                ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600'
                : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400',
            )}
          >
            {claimMutation.isPending ? 'Claiming…' : `Claim ${pendingStars.toLocaleString()} ⭐`}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <div className="animate-pulse space-y-3">
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="h-16 rounded-2xl bg-slate-100" />
            </div>
          )}

          {isError && !isLoading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {(error as { message?: string })?.message ?? 'We couldn’t load your referral ledger. Please try again.'}
            </div>
          )}

          {!isLoading && !isError && (data?.ledger?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Share your invite link to start earning rewards. Every new signup begins a new story on Ripple.
            </div>
          )}

          {!isLoading &&
            !isError &&
            (data?.ledger ?? []).map((entry) => {
              const formatted = formatLedgerEntry(entry);
              return (
                <div
                  key={entry._id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-brand-200/70 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{formatted.label}</p>
                    <p className="text-xs text-slate-500">
                      Invited: <span className="font-medium text-slate-700">{formatted.target}</span>
                    </p>
                    <p className="text-xs text-slate-400">{formatted.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                      <HiOutlineSparkles className="text-sm" />
                      +{formatted.stars.toLocaleString()}
                    </span>
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        formatted.claimed
                          ? 'bg-green-50 text-green-600'
                          : 'bg-amber-50 text-amber-600',
                      )}
                    >
                      {formatted.claimed ? 'Claimed' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
};

export default ReferralPage;
