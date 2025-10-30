import clsx from 'clsx';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { Mission } from '../../lib/missions';

interface MissionCardProps {
  mission: Mission;
  onClaim: (missionId: string) => void;
  claiming: boolean;
}

const MissionCard = ({ mission, onClaim, claiming }: MissionCardProps) => {
  const progress = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  const isCompleted = mission.status === 'completed';
  const isClaimed = mission.status === 'claimed';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{mission.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{mission.description}</p>
        </div>
        <div className="flex items-center gap-1 text-brand-600">
          <HiOutlineSparkles className="text-xl" />
          <span className="text-sm font-semibold">{mission.rewardStars}</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>
            Progress: {mission.progress} / {mission.target}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>Status: {mission.status}</span>
        <button
          type="button"
          onClick={() => onClaim(mission._id)}
          disabled={!isCompleted || isClaimed || claiming}
          className={clsx(
            'rounded-full px-4 py-1 text-xs font-semibold transition',
            isClaimed
              ? 'bg-slate-100 text-slate-400'
              : isCompleted
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-slate-100 text-slate-400',
          )}
        >
          {isClaimed ? 'Claimed' : 'Claim reward'}
        </button>
      </div>
    </article>
  );
};

export default MissionCard;
