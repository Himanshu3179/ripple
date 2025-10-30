import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationPage,
} from '../lib/notifications';
import type { NotificationResource } from '../types';

type NotificationsQueryData = InfiniteData<NotificationPage>;

const computeUnread = (pages: NotificationPage[]) =>
  pages
    .flatMap((page) => page.notifications)
    .filter((notification) => !notification.read).length;

export const useNotifications = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => fetchNotifications((pageParam as string | null) ?? null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: enabled,
  });

  const updateCache = (updater: (previous: NotificationsQueryData) => NotificationsQueryData) => {
    queryClient.setQueryData<NotificationsQueryData | undefined>(['notifications'], (previous) => {
      if (!previous) return previous;
      return updater(previous);
    });
  };

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: (updatedNotification) => {
      updateCache((previous) => {
        const updatedPages = previous.pages.map((page) => ({
          ...page,
          notifications: page.notifications.map((notification) =>
            notification.id === updatedNotification.id ? updatedNotification : notification,
          ),
        }));
        const unreadCount = computeUnread(updatedPages);

        return {
          ...previous,
          pages: updatedPages.map((page, index) =>
            index === 0 ? { ...page, unreadCount } : page,
          ),
        };
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      updateCache((previous) => {
        const nowIso = new Date().toISOString();
        const updatedPages = previous.pages.map((page, index) => ({
          ...page,
          unreadCount: index === 0 ? 0 : page.unreadCount,
          notifications: page.notifications.map((notification) =>
            notification.read
              ? notification
              : {
                  ...notification,
                  read: true,
                  readAt: notification.readAt ?? nowIso,
                },
          ),
        }));

        return {
          ...previous,
          pages: updatedPages.map((page, index) =>
            index === 0 ? { ...page, unreadCount: 0 } : page,
          ),
        };
      });
    },
  });

  const notifications =
    query.data?.pages.flatMap((page) => page.notifications) ?? ([] as NotificationResource[]);

  const unreadCount = query.data?.pages.length ? query.data.pages[0].unreadCount : 0;

  return {
    notifications,
    unreadCount,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    markNotificationRead: markOneMutation.mutate,
    markNotificationReadAsync: markOneMutation.mutateAsync,
    markNotificationPending: markOneMutation.isPending,
    markAllNotifications: markAllMutation.mutate,
    markAllNotificationsAsync: markAllMutation.mutateAsync,
    markAllPending: markAllMutation.isPending,
  };
};
