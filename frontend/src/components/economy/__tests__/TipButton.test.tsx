import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TipButton from '../TipButton';

jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isAuthenticated: true,
    refreshAccount: jest.fn(),
    user: {
      starsBalance: 500,
    },
  })),
}));

const mutateSpy = jest.fn();

jest.mock('../../../lib/economy', () => ({
  tipUser: (...args: unknown[]) => {
    mutateSpy(...args);
    return Promise.resolve({});
  },
}));

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('TipButton', () => {
  beforeEach(() => {
    mutateSpy.mockClear();
  });

  it('opens the tip modal when clicked', () => {
    renderWithQueryClient(<TipButton recipientId="recipient-1" postId="post-1" />);

    fireEvent.click(screen.getByRole('button', { name: /tip/i }));

    expect(screen.getByText(/send a tip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose amount/i)).toBeInTheDocument();
  });

  it('submits the selected amount', async () => {
    renderWithQueryClient(<TipButton recipientId="recipient-2" />);

    fireEvent.click(screen.getByRole('button', { name: /tip/i }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /send 25/i }));

    await waitFor(() => expect(mutateSpy).toHaveBeenCalled());
    expect(mutateSpy).toHaveBeenCalledWith({ recipientId: 'recipient-2', stars: 25, postId: undefined });
  });
});
