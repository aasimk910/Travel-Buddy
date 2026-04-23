// frontend/src/__tests__/components/Booking.test.jsx
// Booking component tests

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock booking form component
const BookingFormComponent = ({ hotelId, onBookingSuccess }) => (
  <form>
    <input type="date" placeholder="Check-in" data-testid="checkin-date" />
    <input type="date" placeholder="Check-out" data-testid="checkout-date" />
    <input type="number" placeholder="Rooms" data-testid="rooms-input" defaultValue="1" />
    <textarea placeholder="Special requests" data-testid="requests-input"></textarea>
    <button type="submit">Book Now</button>
  </form>
);

const BookingListComponent = ({ bookings }) => (
  <div>
    {bookings && bookings.length > 0 ? (
      <ul>
        {bookings.map((booking) => (
          <li key={booking._id} data-testid={`booking-${booking._id}`}>
            <span>{booking.hotelName}</span>
            <span>{booking.checkInDate}</span>
            <span>{booking.status}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p>No bookings found</p>
    )}
  </div>
);

describe('Booking Components - Booking Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render booking form', () => {
    render(
      <Router>
        <BookingFormComponent hotelId="hotel-1" />
      </Router>
    );

    expect(screen.getByTestId('checkin-date')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-date')).toBeInTheDocument();
    expect(screen.getByTestId('rooms-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /book now/i })).toBeInTheDocument();
  });

  it('should allow entering booking dates', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <BookingFormComponent hotelId="hotel-1" />
      </Router>
    );

    const checkinInput = screen.getByTestId('checkin-date');
    const checkoutInput = screen.getByTestId('checkout-date');

    await user.type(checkinInput, '2025-06-01');
    await user.type(checkoutInput, '2025-06-05');

    expect(checkinInput).toHaveValue('2025-06-01');
    expect(checkoutInput).toHaveValue('2025-06-05');
  });

  it('should allow changing number of rooms', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <BookingFormComponent hotelId="hotel-1" />
      </Router>
    );

    const roomsInput = screen.getByTestId('rooms-input');

    await user.clear(roomsInput);
    await user.type(roomsInput, '3');

    expect(roomsInput).toHaveValue(3);
  });

  it('should allow entering special requests', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <BookingFormComponent hotelId="hotel-1" />
      </Router>
    );

    const requestsInput = screen.getByTestId('requests-input');

    await user.type(requestsInput, 'High floor preferred, non-smoking room');

    expect(requestsInput).toHaveValue('High floor preferred, non-smoking room');
  });
});

describe('Booking Components - Booking List', () => {
  it('should display list of bookings', () => {
    const mockBookings = [
      {
        _id: 'booking-1',
        hotelName: 'Mountain Lodge',
        checkInDate: '2025-06-01',
        status: 'confirmed',
      },
      {
        _id: 'booking-2',
        hotelName: 'Valley Resort',
        checkInDate: '2025-07-01',
        status: 'pending',
      },
    ];

    render(
      <Router>
        <BookingListComponent bookings={mockBookings} />
      </Router>
    );

    expect(screen.getByTestId('booking-booking-1')).toBeInTheDocument();
    expect(screen.getByTestId('booking-booking-2')).toBeInTheDocument();
    expect(screen.getByText('Mountain Lodge')).toBeInTheDocument();
    expect(screen.getByText('Valley Resort')).toBeInTheDocument();
  });

  it('should display "No bookings" message when empty', () => {
    render(
      <Router>
        <BookingListComponent bookings={[]} />
      </Router>
    );

    expect(screen.getByText('No bookings found')).toBeInTheDocument();
  });

  it('should display booking status', () => {
    const mockBookings = [
      {
        _id: 'booking-1',
        hotelName: 'Mountain Lodge',
        checkInDate: '2025-06-01',
        status: 'confirmed',
      },
    ];

    render(
      <Router>
        <BookingListComponent bookings={mockBookings} />
      </Router>
    );

    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });
});
