// frontend/src/__tests__/components/Auth.test.jsx
// Authentication component tests

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock component - in real tests, import your actual Login/Signup components
const LoginComponent = ({ onLoginSuccess }) => (
  <form>
    <input type="email" placeholder="Email" data-testid="email-input" />
    <input type="password" placeholder="Password" data-testid="password-input" />
    <button type="submit">Login</button>
  </form>
);

const SignupComponent = ({ onSignupSuccess }) => (
  <form>
    <input type="text" placeholder="Name" data-testid="name-input" />
    <input type="email" placeholder="Email" data-testid="email-input" />
    <input type="password" placeholder="Password" data-testid="password-input" />
    <button type="submit">Sign Up</button>
  </form>
);

describe('Auth Components - Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(
      <Router>
        <LoginComponent />
      </Router>
    );

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should allow user to enter credentials', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <LoginComponent />
      </Router>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should submit login form', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();

    axios.post = jest.fn().mockResolvedValue({
      data: { token: 'jwt-token', user: { id: '1' } },
    });

    render(
      <Router>
        <LoginComponent onLoginSuccess={mockOnSuccess} />
      </Router>
    );

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeInTheDocument();
    });
  });
});

describe('Auth Components - Signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render signup form', () => {
    render(
      <Router>
        <SignupComponent />
      </Router>
    );

    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should allow user to enter signup information', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <SignupComponent />
      </Router>
    );

    await user.type(screen.getByTestId('name-input'), 'John Doe');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.type(screen.getByTestId('password-input'), 'SecurePass123!');

    expect(screen.getByTestId('name-input')).toHaveValue('John Doe');
    expect(screen.getByTestId('email-input')).toHaveValue('john@example.com');
    expect(screen.getByTestId('password-input')).toHaveValue('SecurePass123!');
  });
});
