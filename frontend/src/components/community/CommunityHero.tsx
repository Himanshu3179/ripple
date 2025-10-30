import clsx from 'clsx';
import { HiOutlineUserPlus, HiOutlineUsers } from 'react-icons/hi2';
import { CommunitySummary } from '../../lib/communities';
import useAuth from '../../hooks/useAuth';

interface CommunityHeroProps {
  community: CommunitySummary;
  onJoin: () => void;
  onLeave: () => void;
  isJoining: boolean;
  isLeaving: boolean;
}

const CommunityHero = ({ community, onJoin, onLeave, isJoining, isLeaving }: CommunityHeroProps) => {
  const { user } = useAuth();
  const membership = community.membership;

  const isMember = membership?.status === 'active';
  const isPending = membership?.status === 'pending';
  const isMod = membership && ['owner', 'moderator'].includes(membership.role);
  const banner = community.bannerImage || undefined;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      {banner && (
        <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${banner})` }} />
      )}
      <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              'grid h-14 w-14 place-items-center rounded-2xl text-xl font-semibold text-white shadow-card',
              community.avatarImage ? '' : 'bg-brand-500',
            )}
            style={community.avatarImage ? { backgroundImage: `url(${community.avatarImage})`, backgroundSize: 'cover' } : undefined}
          >
            {!community.avatarImage && community.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{community.name}</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {community.visibility}
              </span>
              {isMod && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                  {membership?.role === 'owner' ? 'Founder' : 'Moderator'}
                </span>
              )}
            </div>
            {community.description && (
              <p className="mt-1 text-sm text-slate-500">{community.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1"><HiOutlineUsers /> {community.memberCount.toLocaleString()} members</span>
              {isPending && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">Pending approval</span>}
            </div>
          </div>
        </div>
        {user && (
          <div className="flex gap-2">
            {isMember ? (
              <button
                type="button"
                onClick={onLeave}
                disabled={isLeaving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Leave
              </button>
            ) : (
              <button
                type="button"
                onClick={onJoin}
                disabled={isJoining}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HiOutlineUserPlus className="text-lg" />
                {isPending ? 'Request pending' : 'Join'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunityHero;
