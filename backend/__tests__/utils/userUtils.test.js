const { buildUserResponse } = require('../../utils/userUtils');

describe('userUtils - buildUserResponse', () => {
  it('should build a user response object with correct properties', () => {
    const mockUser = {
      _id: '123456789',
      name: 'John Doe',
      email: 'john@example.com',
      country: 'USA',
      travelStyle: 'Adventure',
      budgetRange: 'Mid-range',
      interests: ['hiking', 'food'],
      avatarUrl: 'https://example.com/avatar.jpg',
      provider: 'google',
      role: 'user',
      onboardingCompleted: true,
      hikingProfile: null,
      password: 'secret123', // Should be excluded
      __v: 0, // Should be excluded
    };

    const result = buildUserResponse(mockUser);

    expect(result).toHaveProperty('id', '123456789');
    expect(result).toHaveProperty('name', 'John Doe');
    expect(result).toHaveProperty('email', 'john@example.com');
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('__v');
  });

  it('should handle missing optional fields gracefully', () => {
    const mockUser = {
      _id: '123456789',
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    const result = buildUserResponse(mockUser);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('email');
    expect(result.role).toBe('user'); // Default role
    expect(result.hikingProfile).toBeNull();
  });

  it('should convert onboardingCompleted to boolean', () => {
    const mockUser = {
      _id: '123456789',
      name: 'Test User',
      email: 'test@example.com',
      onboardingCompleted: true,
    };

    const result = buildUserResponse(mockUser);

    expect(typeof result.onboardingCompleted).toBe('boolean');
    expect(result.onboardingCompleted).toBe(true);
  });
});
