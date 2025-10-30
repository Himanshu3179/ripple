import { HiOutlineSparkles } from 'react-icons/hi2';

interface LeaderboardEntryProps {
  entries: Array<{
    _id: string;
    value: number;
    user: {
      _id: string;
      username: string;
      displayName: string;
      avatarColor?: string;
    };
  }>;
  type: 'missions' | 'referrals' | 'stars-earned';
}

const typeLabels: Record<LeaderboardEntryProps['type'], string> = {
  missions: 'Stars from missions',
  referrals: 'Referrals completed',
  'stars-earned': 'Stars earned',
};

const LeaderboardCard = ({ entries, type }: LeaderboardEntryProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-lg font-semibold text-slate-900">Leaderboard</h3>
      <p className="text-sm text-slate-500">{typeLabels[type]}</p>
      <div className="mt-4 space-y-3">
        {entries.length === 0 && <p className="text-sm text-slate-400">No entries yet.</p>}
        {entries.map((entry, index) => (
          <div
            key={entry._id}
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span>{entry.user.displayName}</span>
              <span className="text-xs text-slate-400">@{entry.user.username}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-brand-600">
              <HiOutlineSparkles />
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LeaderboardCard;
