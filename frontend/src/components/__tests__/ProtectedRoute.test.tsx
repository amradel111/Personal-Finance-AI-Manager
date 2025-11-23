import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';

const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

describe('ProtectedRoute', () => {
  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Private dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>
    );

  afterEach(() => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = false;
  });

  it('renders full screen loader while auth status is loading', () => {
    mockAuthState.isLoading = true;
    renderWithRouter();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    mockAuthState.isAuthenticated = false;
    renderWithRouter();

    expect(screen.getByText(/login screen/i)).toBeInTheDocument();
  });

  it('renders nested routes when authenticated', () => {
    mockAuthState.isAuthenticated = true;
    renderWithRouter();

    expect(screen.getByText(/private dashboard/i)).toBeInTheDocument();
  });
});
