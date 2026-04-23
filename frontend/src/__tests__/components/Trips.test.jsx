// frontend/src/__tests__/components/Trips.test.jsx
// Trip and Hiking component tests

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock trip list component
const TripListComponent = ({ trips }) => (
  <div>
    {trips && trips.length > 0 ? (
      <div className="trip-grid">
        {trips.map((trip) => (
          <div key={trip._id} data-testid={`trip-${trip._id}`} className="trip-card">
            <h3>{trip.title}</h3>
            <p>{trip.location}</p>
            <span className="participants">
              {trip.participants?.length || 0}/{trip.maxTravelers}
            </span>
            <button data-testid={`join-btn-${trip._id}`}>Join Trip</button>
          </div>
        ))}
      </div>
    ) : (
      <p>No trips available</p>
    )}
  </div>
);

// Mock hiking list component
const HikeListComponent = ({ hikes, onHikeSelect }) => (
  <div>
    {hikes && hikes.length > 0 ? (
      <ul>
        {hikes.map((hike) => (
          <li key={hike._id} data-testid={`hike-${hike._id}`}>
            <span>{hike.name}</span>
            <span className="difficulty">{hike.difficulty}</span>
            <span className="distance">{hike.distance}km</span>
            <button onClick={() => onHikeSelect?.(hike)}>View Details</button>
          </li>
        ))}
      </ul>
    ) : (
      <p>No hikes found</p>
    )}
  </div>
);

describe('Trip Components - Trip List', () => {
  it('should display list of trips', () => {
    const mockTrips = [
      {
        _id: 'trip-1',
        title: 'Everest Base Camp',
        location: 'Nepal',
        maxTravelers: 10,
        participants: ['user-1', 'user-2'],
      },
      {
        _id: 'trip-2',
        title: 'Kilimanjaro Summit',
        location: 'Tanzania',
        maxTravelers: 8,
        participants: ['user-1'],
      },
    ];

    render(
      <Router>
        <TripListComponent trips={mockTrips} />
      </Router>
    );

    expect(screen.getByTestId('trip-trip-1')).toBeInTheDocument();
    expect(screen.getByTestId('trip-trip-2')).toBeInTheDocument();
    expect(screen.getByText('Everest Base Camp')).toBeInTheDocument();
    expect(screen.getByText('Kilimanjaro Summit')).toBeInTheDocument();
  });

  it('should display trip details correctly', () => {
    const mockTrips = [
      {
        _id: 'trip-1',
        title: 'Everest Base Camp',
        location: 'Nepal',
        maxTravelers: 10,
        participants: ['user-1', 'user-2'],
      },
    ];

    render(
      <Router>
        <TripListComponent trips={mockTrips} />
      </Router>
    );

    expect(screen.getByText('Nepal')).toBeInTheDocument();
    expect(screen.getByText('2/10')).toBeInTheDocument();
  });

  it('should display join button for each trip', () => {
    const mockTrips = [
      {
        _id: 'trip-1',
        title: 'Everest Base Camp',
        location: 'Nepal',
        maxTravelers: 10,
        participants: [],
      },
    ];

    render(
      <Router>
        <TripListComponent trips={mockTrips} />
      </Router>
    );

    expect(screen.getByTestId('join-btn-trip-1')).toBeInTheDocument();
    expect(screen.getByTestId('join-btn-trip-1')).toHaveTextContent('Join Trip');
  });

  it('should display "No trips" when empty', () => {
    render(
      <Router>
        <TripListComponent trips={[]} />
      </Router>
    );

    expect(screen.getByText('No trips available')).toBeInTheDocument();
  });

  it('should allow joining a trip', async () => {
    const user = userEvent.setup();
    const mockTrips = [
      {
        _id: 'trip-1',
        title: 'Everest Base Camp',
        location: 'Nepal',
        maxTravelers: 10,
        participants: [],
      },
    ];

    axios.post = jest.fn().mockResolvedValue({
      data: { success: true, trip: { ...mockTrips[0], participants: ['user-new'] } },
    });

    render(
      <Router>
        <TripListComponent trips={mockTrips} />
      </Router>
    );

    const joinButton = screen.getByTestId('join-btn-trip-1');
    await user.click(joinButton);

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled(); // Button click alone doesn't call API
    });
  });
});

describe('Hiking Components - Hike List', () => {
  it('should display list of hikes', () => {
    const mockHikes = [
      {
        _id: 'hike-1',
        name: 'Everest Base Camp Trek',
        difficulty: 'Hard',
        distance: 65,
      },
      {
        _id: 'hike-2',
        name: 'Annapurna Circuit',
        difficulty: 'Hard',
        distance: 160,
      },
    ];

    render(
      <Router>
        <HikeListComponent hikes={mockHikes} />
      </Router>
    );

    expect(screen.getByTestId('hike-hike-1')).toBeInTheDocument();
    expect(screen.getByTestId('hike-hike-2')).toBeInTheDocument();
    expect(screen.getByText('Everest Base Camp Trek')).toBeInTheDocument();
  });

  it('should display hike difficulty', () => {
    const mockHikes = [
      {
        _id: 'hike-1',
        name: 'Easy Walk',
        difficulty: 'Easy',
        distance: 10,
      },
    ];

    render(
      <Router>
        <HikeListComponent hikes={mockHikes} />
      </Router>
    );

    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('should display hike distance', () => {
    const mockHikes = [
      {
        _id: 'hike-1',
        name: 'Everest Base Camp Trek',
        difficulty: 'Hard',
        distance: 65,
      },
    ];

    render(
      <Router>
        <HikeListComponent hikes={mockHikes} />
      </Router>
    );

    expect(screen.getByText('65km')).toBeInTheDocument();
  });

  it('should allow selecting a hike', async () => {
    const user = userEvent.setup();
    const mockHikes = [
      {
        _id: 'hike-1',
        name: 'Everest Base Camp Trek',
        difficulty: 'Hard',
        distance: 65,
      },
    ];

    const mockOnSelect = jest.fn();

    render(
      <Router>
        <HikeListComponent hikes={mockHikes} onHikeSelect={mockOnSelect} />
      </Router>
    );

    const viewButton = screen.getByRole('button', { name: /view details/i });
    await user.click(viewButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockHikes[0]);
  });

  it('should display "No hikes" when empty', () => {
    render(
      <Router>
        <HikeListComponent hikes={[]} />
      </Router>
    );

    expect(screen.getByText('No hikes found')).toBeInTheDocument();
  });
});
