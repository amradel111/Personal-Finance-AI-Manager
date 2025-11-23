import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileNav from '../MobileNav';

const Layout = ({ label }: { label: string }) => (
  <>
    <div>{label}</div>
    <MobileNav />
  </>
);

const renderWithRouter = (initialPath = '/dashboard') => (
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard" element={<Layout label="Dashboard Page" />} />
        <Route path="/add-expenses" element={<Layout label="Add Expenses Page" />} />
        <Route path="/monthly-report" element={<Layout label="Monthly Report Page" />} />
        <Route path="/profile-setup" element={<Layout label="Profile Setup Page" />} />
        <Route path="/edit-account" element={<Layout label="Edit Account Page" />} />
      </Routes>
    </MemoryRouter>
  )
);

describe('MobileNav', () => {
  it('highlights the active route', () => {
    renderWithRouter('/dashboard');

    expect(screen.getByRole('button', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /reports/i })).not.toHaveAttribute('aria-current');
  });

  it('navigates to a different route when an item is pressed', async () => {
    const user = userEvent.setup();
    renderWithRouter('/dashboard');

    await user.click(screen.getByRole('button', { name: /expenses/i }));

    expect(await screen.findByText(/add expenses page/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expenses/i })).toHaveAttribute('aria-current', 'page');
  });

  it('treats edit account as part of profile navigation', async () => {
    const user = userEvent.setup();
    renderWithRouter('/edit-account');

    await user.click(screen.getByRole('button', { name: /profile/i }));

    expect(await screen.findByText(/profile setup page/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /profile/i })).toHaveAttribute('aria-current', 'page');
  });
});
