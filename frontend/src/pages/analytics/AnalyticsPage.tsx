import AnalyticsSummaryCard from '../../components/analytics/AnalyticsSummaryCard';
import { fetchAnalytics } from '../../lib/analytics';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../hooks/useAuth';

const AnalyticsPage = () => {
  const { isAuthenticated, isPremium } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics, enabled: isPremium });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-slate-900">Creator analytics</h2>
        <p className="mt-2 text-sm text-slate-500">Sign in to view your performance.</p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-slate-900">Creator analytics</h2>
        <p className="mt-2 text-sm text-slate-500">Upgrade to Star Pass to unlock detailed analytics and insights.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="px-4 py-8 text-center text-sm text-slate-500">Loading analytics...</p>;
  }

  if (error || !data) {
    return <p className="px-4 py-8 text-center text-sm text-slate-500">Unable to load analytics.</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-slate-900">Creator analytics</h1>
        <p className="text-sm text-slate-500">Track how your posts and comments perform across Ripple.</p>
      </header>
      <AnalyticsSummaryCard data={data} />
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-lg font-semibold text-slate-900">Recent transactions</h3>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          {data.recentTransactions.length === 0 && <p className="text-sm text-slate-500">No transactions yet.</p>}
          {data.recentTransactions.map((txn) => (
            <div key={txn._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <div>
                <p className="font-semibold text-slate-700">{txn.kind}</p>
                <p className="text-xs text-slate-400">{new Date(txn.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>₹{txn.amountINR}</p>
                {txn.starsAwarded && <p>+{txn.starsAwarded} ⭐</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
