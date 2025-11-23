import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../Header';
import type { AuthContextValue } from '../../context/AuthContext';

const mockLogout = vi.fn();

const mockAuthValue: AuthContextValue = {
  user: {
    id: 'user-1',
    firstName: 'Jamie',
    lastName: 'Lee',
    email: 'jamie@example.com',
    phone: '+15555550123',
    createdAt: '2025-11-24T00:00:00.000Z',
    lastLogin: null,
    profile: null,
  },
  logout: mockLogout,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
}));

describe('Header navigation', () => {
  const renderHeader = (initialPath = '/dashboard') =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Header />
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          <Route path="/add-expenses" element={<div>Add Expenses Content</div>} />
          <Route path="/monthly-report" element={<div>Monthly Report Content</div>} />
          <Route path="/profile-setup" element={<div>Edit Profile Content</div>} />
          <Route path="/edit-account" element={<div>Edit Account Page</div>} />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    mockLogout.mockReset();
  });

  it('highlights the active route', () => {
    renderHeader('/dashboard');
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });

    expect(dashboardButton.className).toContain('bg-gradient-to-r');
  });

  it('navigates to a selected page via nav buttons', async () => {
    const user = userEvent.setup();
    renderHeader('/dashboard');

    await user.click(screen.getByRole('button', { name: /add expenses/i }));

    expect(screen.getByText(/add expenses content/i)).toBeInTheDocument();
  });

  it('toggles the mobile navigation list through the Menu button', async () => {
    const user = userEvent.setup();
    renderHeader('/dashboard');

    expect(document.getElementById('mobile-nav')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^menu$/i }));

    expect(document.getElementById('mobile-nav')).toBeInTheDocument();
  });

  it('logs out through the dropdown and redirects to auth page', async () => {
    const user = userEvent.setup();
    renderHeader('/dashboard');

    await user.click(screen.getByRole('button', { name: /open user menu/i }));
    await user.click(await screen.findByRole('button', { name: /log out/i }));

    expect(mockLogout).toHaveBeenCalled();
    expect(await screen.findByText(/auth page/i)).toBeInTheDocument();
  });
});
