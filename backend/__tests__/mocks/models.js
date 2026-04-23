// backend/__tests__/mocks/models.js
// Mock MongoDB models for testing

const mockUserId = '507f1f77bcf86cd799439011';
const mockHotelId = '507f1f77bcf86cd799439012';
const mockBookingId = '507f1f77bcf86cd799439013';
const mockTripId = '507f1f77bcf86cd799439014';

const mockUser = {
  _id: mockUserId,
  name: 'Test User',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  country: 'USA',
  travelStyle: 'Adventure',
  budgetRange: 'Mid-range',
  interests: ['hiking', 'food'],
  role: 'user',
  onboardingCompleted: true,
};

const mockHotel = {
  _id: mockHotelId,
  name: 'Mountain Lodge',
  location: 'Nepal',
  rating: 4.5,
  amenities: ['WiFi', 'Pool'],
};

const mockBooking = {
  _id: mockBookingId,
  userId: mockUserId,
  hotelId: mockHotelId,
  checkInDate: new Date('2025-06-01'),
  checkOutDate: new Date('2025-06-05'),
  numberOfRooms: 1,
  totalPrice: 500,
  status: 'confirmed',
};

const mockTrip = {
  _id: mockTripId,
  title: 'Everest Base Camp Trek',
  description: 'Amazing trekking experience',
  maxTravelers: 10,
  participants: [mockUserId],
  createdBy: mockUserId,
};

module.exports = {
  mockUser,
  mockHotel,
  mockBooking,
  mockTrip,
  mockUserId,
  mockHotelId,
  mockBookingId,
  mockTripId,
};
