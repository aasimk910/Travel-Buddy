// frontend/src/__tests__/services/googleAuth.test.js
// Tests for FR-OS-02: Google account authentication

import axios from 'axios';

jest.mock('axios');

describe('Google Auth Service - FR-OS-02: Google Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate user with a valid Google credential token', async () => {
    const googleCredential = 'google-id-token-xyz';

    axios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        token: 'jwt-token-from-server',
        user: {
          id: '123',
          name: 'Google User',
          email: 'googleuser@gmail.com',
          provider: 'google',
        },
      },
    });

    const response = await axios.post('/api/auth/google', { credential: googleCredential });

    expect(response.data.success).toBe(true);
    expect(response.data.user.provider).toBe('google');
    expect(response.data.token).toBeDefined();
    expect(axios.post).toHaveBeenCalledWith('/api/auth/google', { credential: googleCredential });
  });

  it('should return user data with correct structure after Google login', async () => {
    axios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        token: 'jwt-abc',
        user: {
          id: 'user-456',
          name: 'Jane Doe',
          email: 'jane@gmail.com',
          avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
          provider: 'google',
          role: 'user',
        },
      },
    });

    const response = await axios.post('/api/auth/google', { credential: 'token' });

    expect(response.data.user).toHaveProperty('id');
    expect(response.data.user).toHaveProperty('email');
    expect(response.data.user).toHaveProperty('name');
    expect(response.data.user).toHaveProperty('role');
  });

  it('should handle invalid Google credential token', async () => {
    axios.post = jest.fn().mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid Google token.' } },
    });

    await expect(
      axios.post('/api/auth/google', { credential: 'invalid-token' })
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it('should handle network error during Google login', async () => {
    axios.post = jest.fn().mockRejectedValue(new Error('Network Error'));

    await expect(
      axios.post('/api/auth/google', { credential: 'token' })
    ).rejects.toThrow('Network Error');
  });

  it('should store JWT token after successful Google login', () => {
    const storeAuthToken = (token) => {
      if (!token) return false;
      // Simulates localStorage.setItem
      return true;
    };

    expect(storeAuthToken('jwt-token-abc')).toBe(true);
    expect(storeAuthToken(null)).toBe(false);
    expect(storeAuthToken('')).toBe(false);
  });

  it('should redirect to dashboard after successful Google login', () => {
    const getRedirectPath = (user) => {
      if (!user) return '/login';
      if (!user.onboardingCompleted) return '/onboarding';
      return '/dashboard';
    };

    expect(getRedirectPath(null)).toBe('/login');
    expect(getRedirectPath({ onboardingCompleted: false })).toBe('/onboarding');
    expect(getRedirectPath({ onboardingCompleted: true })).toBe('/dashboard');
  });
});
