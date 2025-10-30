import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { NotificationResource } from '../../../types';
import NotificationBell from '../NotificationBell';

const refetchMock = jest.fn();

jest.mock('../../../hooks/useNotifications', () => ({
  useNotifications: jest.fn(() => ({
    notifications: [] as NotificationResource[],
    unreadCount: 0,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
    isLoading: false,
    isFetching: false,
    refetch: refetchMock,
    markNotificationRead: jest.fn(),
    markNotificationReadAsync: jest.fn(),
    markNotificationPending: false,
    markAllNotifications: jest.fn(),
    markAllNotificationsAsync: jest.fn(),
    markAllPending: false,
  })),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    refetchMock.mockClear();
  });

  it('renders disabled button when notifications are disabled', () => {
    render(<NotificationBell enabled={false} />);

    expect(screen.getByRole('button', { name: /toggle notifications/i })).toBeDisabled();
  });

  it('opens the notifications menu and refetches when clicked', async () => {
    render(<NotificationBell enabled />);

    const toggleButton = screen.getByRole('button', { name: /toggle notifications/i });
    expect(toggleButton).not.toBeDisabled();

    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
    await waitFor(() => expect(refetchMock).toHaveBeenCalled());
  });
});
