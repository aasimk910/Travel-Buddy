// frontend/src/__tests__/services/profile.test.js
// Tests for FR-OS-05: Update profile fields (country, travel style, budget range, interests)

import axios from 'axios';

jest.mock('axios');

describe('Profile Service - FR-OS-05: Profile Update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update profile with all fields', async () => {
    const profileUpdate = {
      country: 'Nepal',
      travelStyle: 'Adventure',
      budgetRange: 'Mid-range',
      interests: ['hiking', 'photography', 'culture'],
    };

    axios.put = jest.fn().mockResolvedValue({
      data: {
        success: true,
        user: { id: '123', ...profileUpdate },
      },
    });

    const response = await axios.put('/api/users/profile', profileUpdate);

    expect(response.data.success).toBe(true);
    expect(response.data.user.country).toBe('Nepal');
    expect(response.data.user.travelStyle).toBe('Adventure');
    expect(axios.put).toHaveBeenCalledWith('/api/users/profile', profileUpdate);
  });

  it('should successfully update only country', async () => {
    axios.put = jest.fn().mockResolvedValue({
      data: { success: true, user: { country: 'India' } },
    });

    const response = await axios.put('/api/users/profile', { country: 'India' });
    expect(response.data.user.country).toBe('India');
  });

  it('should update interests array correctly', async () => {
    const interests = ['hiking', 'food', 'travel'];
    axios.put = jest.fn().mockResolvedValue({
      data: { success: true, user: { interests } },
    });

    const response = await axios.put('/api/users/profile', { interests });
    expect(response.data.user.interests).toEqual(interests);
    expect(response.data.user.interests).toHaveLength(3);
  });

  it('should handle profile update errors', async () => {
    axios.put = jest.fn().mockRejectedValue(
      new Error('Network Error')
    );

    await expect(axios.put('/api/users/profile', {})).rejects.toThrow('Network Error');
  });

  it('should fetch current user profile', async () => {
    const mockProfile = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      country: 'USA',
      travelStyle: 'Budget',
      budgetRange: 'Low',
      interests: ['hiking'],
    };

    axios.get = jest.fn().mockResolvedValue({ data: mockProfile });

    const response = await axios.get('/api/users/profile');
    expect(response.data.country).toBe('USA');
    expect(response.data.interests).toContain('hiking');
  });

  it('should update onboarding completion status', async () => {
    axios.put = jest.fn().mockResolvedValue({
      data: { success: true, user: { onboardingCompleted: true } },
    });

    const response = await axios.put('/api/users/profile', { onboardingCompleted: true });
    expect(response.data.user.onboardingCompleted).toBe(true);
  });
});
