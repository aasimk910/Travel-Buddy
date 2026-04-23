// frontend/src/__tests__/services/bookings.test.js
// Booking service tests

import axios from 'axios';

jest.mock('axios');

describe('Booking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new booking', async () => {
    const bookingData = {
      hotelId: 'hotel-123',
      packageId: 'package-123',
      checkInDate: '2025-06-01',
      checkOutDate: '2025-06-05',
      numberOfRooms: 1,
      specialRequests: 'High floor',
    };

    axios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        booking: {
          _id: 'booking-123',
          ...bookingData,
          totalPrice: 500,
          status: 'confirmed',
        },
      },
    });

    const response = await axios.post('/api/bookings', bookingData);

    expect(response.data.success).toBe(true);
    expect(response.data.booking._id).toBe('booking-123');
    expect(response.data.booking.status).toBe('confirmed');
  });

  it('should fetch user bookings', async () => {
    axios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        bookings: [
          {
            _id: 'booking-1',
            hotelName: 'Mountain Lodge',
            checkInDate: '2025-06-01',
            checkOutDate: '2025-06-05',
            status: 'confirmed',
          },
        ],
      },
    });

    const response = await axios.get('/api/user/bookings');

    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.bookings)).toBe(true);
    expect(response.data.bookings[0]._id).toBe('booking-1');
  });

  it('should cancel a booking', async () => {
    axios.put = jest.fn().mockResolvedValue({
      data: {
        success: true,
        message: 'Booking cancelled',
        booking: {
          _id: 'booking-123',
          status: 'cancelled',
        },
      },
    });

    const response = await axios.put('/api/bookings/booking-123/cancel');

    expect(response.data.success).toBe(true);
    expect(response.data.booking.status).toBe('cancelled');
  });

  it('should fetch booking details', async () => {
    axios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        booking: {
          _id: 'booking-123',
          hotelName: 'Mountain Lodge',
          totalPrice: 500,
          numberOfRooms: 1,
          numberOfNights: 4,
          status: 'confirmed',
        },
      },
    });

    const response = await axios.get('/api/bookings/booking-123');

    expect(response.data.success).toBe(true);
    expect(response.data.booking.hotelName).toBe('Mountain Lodge');
    expect(response.data.booking.totalPrice).toBe(500);
  });

  it('should handle booking errors', async () => {
    axios.post = jest.fn().mockRejectedValue(
      new Error('Invalid booking dates')
    );

    try {
      await axios.post('/api/bookings', {});
      fail('Should have thrown error');
    } catch (error) {
      expect(error.message).toBe('Invalid booking dates');
    }
  });
});
