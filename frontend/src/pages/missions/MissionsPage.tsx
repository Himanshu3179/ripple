import { useState } from 'react';
import MissionCard from '../../components/missions/MissionCard';
import LeaderboardCard from '../../components/missions/LeaderboardCard';
import { useLeaderboard, useMissions } from './hooks';
import useAuth from '../../hooks/useAuth';

const MissionsPage = () => {
  const { isAuthenticated } = useAuth();
  const { missions, isLoading, claim } = useMissions();
  const [leaderboardType, setLeaderboardType] = useState<'missions' | 'referrals' | 'stars-earned'>('missions');
  const { data: leaderboard } = useLeaderboard(leaderboardType);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-slate-900">Starforge Missions</h2>
        <p className="mt-2 text-sm text-slate-500">Sign in to complete daily missions and earn Stars.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-slate-900">Daily missions</h1>
        <p className="text-sm text-slate-500">Complete tasks, keep your streak, and climb the leaderboard.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s missions</h2>
          {isLoading && <p className="text-sm text-slate-500">Loading missions...</p>}
          <div className="space-y-4">
            {missions.map((mission) => (
              <MissionCard
                key={mission._id}
                mission={mission}
                claiming={claim.isPending}
                onClaim={(missionId) => claim.mutate(missionId)}
              />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Leaderboard</h3>
            <div className="mt-2 inline-flex overflow-hidden rounded-full border border-slate-200 text-xs font-semibold text-slate-500">
              <button
                type="button"
                onClick={() => setLeaderboardType('missions')}
                className={`px-3 py-1 ${leaderboardType === 'missions' ? 'bg-brand-500 text-white' : ''}`}
              >
                Missions
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardType('referrals')}
                className={`px-3 py-1 ${leaderboardType === 'referrals' ? 'bg-brand-500 text-white' : ''}`}
              >
                Referrals
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardType('stars-earned')}
                className={`px-3 py-1 ${leaderboardType === 'stars-earned' ? 'bg-brand-500 text-white' : ''}`}
              >
                Stars earned
              </button>
            </div>
            <div className="mt-4">
              <LeaderboardCard entries={leaderboard || []} type={leaderboardType} />
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default MissionsPage;
