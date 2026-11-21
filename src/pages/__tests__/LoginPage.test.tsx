import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../features/auth';
import { AuthContext } from '../../features/auth/context/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLoginPage(loginMock = vi.fn()) {
  const authValue = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: loginMock,
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };

  return {
    loginMock,
    ...render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={authValue as never}>
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  };
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email, password inputs, and submit button', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in|log in/i })
    ).toBeInTheDocument();
  });

  it('submits valid credentials and navigates to dashboard', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValueOnce(undefined);
    renderLoginPage(loginMock);

    await user.type(screen.getByLabelText(/email/i), 'ravi@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password@123');
    await user.click(screen.getByRole('button', { name: /sign in|log in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1);
      expect(loginMock).toHaveBeenCalledWith({
        email: 'ravi@example.com',
        password: 'Password@123',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('displays server error message when login rejects', async () => {
    const user = userEvent.setup();
    const loginMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Invalid email or password'));
    renderLoginPage(loginMock);

    await user.type(screen.getByLabelText(/email/i), 'ravi@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in|log in/i }));

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});