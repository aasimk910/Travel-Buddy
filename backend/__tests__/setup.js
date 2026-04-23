// backend/__tests__/setup.js
// Shared test setup and global mocks

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.RECAPTCHA_SECRET_KEY = 'test-recaptcha-secret';
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};
