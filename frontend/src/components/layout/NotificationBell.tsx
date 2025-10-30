import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { TbBell, TbBellRinging, TbLoader2 } from 'react-icons/tb';
import { HiMiniBolt, HiOutlineSparkles, HiOutlineUsers } from 'react-icons/hi2';
import dayjs from '../../utils/date';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationResource } from '../../types';

interface NotificationBellProps {
  enabled: boolean;
  className?: string;
  buttonClassName?: string;
  menuAlign?: 'left' | 'right';
}

const iconForNotification = (notification: NotificationResource) => {
  switch (notification.type) {
    case 'tip-received':
      return <HiOutlineSparkles className="text-base text-brand-500" />;
    case 'referral-signup':
    case 'referral-subscription':
      return <HiOutlineUsers className="text-base text-brand-500" />;
    case 'mission-completed':
      return <HiMiniBolt className="text-base text-amber-500" />;
    case 'post-removed':
      return <TbBellRinging className="text-base text-red-500" />;
    default:
      return <TbBell className="text-base text-slate-400" />;
  }
};

const NotificationBell = ({ enabled, className, buttonClassName, menuAlign = 'right' }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    refetch,
    markNotificationRead,
    markAllNotifications,
    markAllPending,
  } = useNotifications(enabled);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open && enabled) {
      void refetch();
    }
  }, [open, enabled, refetch]);

  const handleToggle = () => {
    if (!enabled) return;
    setOpen((prev) => !prev);
  };

  const handleNotificationClick = (notification: NotificationResource) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  };

  const handleMarkAll = () => {
    if (unreadCount === 0 || markAllPending) return;
    markAllNotifications();
  };

  const isEmpty = notifications.length === 0;

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={!enabled}
        className={clsx(
          'relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60',
          buttonClassName,
        )}
        aria-label="Toggle notifications"
      >
        {unreadCount > 0 ? <TbBellRinging className="text-lg text-brand-500" /> : <TbBell className="text-lg" />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={clsx(
            'absolute z-50 mt-2 w-[320px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl',
            menuAlign === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markAllPending}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark all as read
            </button>
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto">
            {isLoading && (
              <div className="space-y-2">
                <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            )}

            {!isLoading && isEmpty && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-medium text-slate-500">
                No notifications yet. Keep exploring Ripple and rewards will appear here.
              </div>
            )}

            {!isLoading && !isEmpty && (
              <ul className="space-y-2">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={clsx(
                        'w-full rounded-2xl border px-3 py-3 text-left transition',
                        notification.read
                          ? 'border-slate-200 bg-white hover:border-brand-200/60 hover:bg-brand-50/50'
                          : 'border-brand-200 bg-brand-50/40 hover:bg-brand-50',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{iconForNotification(notification)}</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                          {notification.body && <p className="text-xs text-slate-500">{notification.body}</p>}
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            {dayjs(notification.createdAt).fromNow()}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">
              {isFetching ? 'Syncing...' : 'Stay tuned for more updates'}
            </p>
            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingNextPage && <TbLoader2 className="h-3 w-3 animate-spin" />}
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
