import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../Login';

type MockLogin = (credentials: { email: string; password: string }, rememberMe: boolean) => Promise<{ hasProfile: boolean }>;

const mockLogin = vi.fn<MockLogin>();
const mockNavigate = vi.fn();

const mockAuthState = {
  login: mockLogin,
  isAuthenticated: false,
  isLoading: false,
};

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

const setup = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = false;
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('validates email format before attempting login', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('attempts login with trimmed lowercase email and navigates to dashboard when profile exists', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ hasProfile: true });
    setup();

    await user.type(screen.getByLabelText(/email address/i), ' TEST@Example.COM ');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'Password123!',
        },
        true
      )
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    );
  });

  it('redirects to profile setup when profile is incomplete', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ hasProfile: false });
    setup();

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/profile-setup', { replace: true })
    );
  });

  it('announces server errors when login fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials')); 
    setup();

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    );
  });

  it('auto-redirects authenticated users to dashboard', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.isLoading = false;
    setup();

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
