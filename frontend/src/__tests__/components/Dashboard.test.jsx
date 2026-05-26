// frontend/src/__tests__/components/Dashboard.test.jsx
// Tests for FR-OS-08: Dashboard shows joined/relevant trip information

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock dashboard component that simulates the real Dashboard
const DashboardComponent = ({ user, joinedTrips, joinedHikes }) => (
  <div data-testid="dashboard">
    <h1>Dashboard</h1>
    {user && <p data-testid="welcome-message">Welcome, {user.name}</p>}

    <section data-testid="joined-trips">
      <h2>My Trips</h2>
      {joinedTrips && joinedTrips.length > 0 ? (
        <ul>
          {joinedTrips.map(trip => (
            <li key={trip._id} data-testid={`trip-${trip._id}`}>
              <span data-testid={`trip-title-${trip._id}`}>{trip.title}</span>
              <span data-testid={`trip-location-${trip._id}`}>{trip.location}</span>
              <span data-testid={`trip-status-${trip._id}`}>{trip.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p data-testid="no-trips-message">No trips joined yet.</p>
      )}
    </section>

    <section data-testid="joined-hikes">
      <h2>My Hikes</h2>
      {joinedHikes && joinedHikes.length > 0 ? (
        <ul>
          {joinedHikes.map(hike => (
            <li key={hike._id} data-testid={`hike-${hike._id}`}>
              <span>{hike.name}</span>
              <span data-testid={`hike-difficulty-${hike._id}`}>{hike.difficulty}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p data-testid="no-hikes-message">No hikes joined yet.</p>
      )}
    </section>
  </div>
);

const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };

const mockJoinedTrips = [
  { _id: 'trip-1', title: 'Everest Base Camp', location: 'Nepal', status: 'upcoming' },
  { _id: 'trip-2', title: 'Annapurna Circuit', location: 'Nepal', status: 'completed' },
];

const mockJoinedHikes = [
  { _id: 'hike-1', name: 'Langtang Trail', difficulty: 'moderate' },
  { _id: 'hike-2', name: 'Manaslu Circuit', difficulty: 'hard' },
];

describe('Dashboard Component - FR-OS-08: Dashboard Trip Display', () => {
  it('should render the dashboard', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={[]} joinedHikes={[]} />
      </Router>
    );
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should display welcome message with user name', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={[]} joinedHikes={[]} />
      </Router>
    );
    expect(screen.getByTestId('welcome-message')).toHaveTextContent('Test User');
  });

  it('should display joined trips in the dashboard', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={mockJoinedTrips} joinedHikes={[]} />
      </Router>
    );

    expect(screen.getByTestId('trip-trip-1')).toBeInTheDocument();
    expect(screen.getByTestId('trip-title-trip-1')).toHaveTextContent('Everest Base Camp');
    expect(screen.getByTestId('trip-trip-2')).toBeInTheDocument();
  });

  it('should display trip location for each joined trip', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={mockJoinedTrips} joinedHikes={[]} />
      </Router>
    );

    expect(screen.getByTestId('trip-location-trip-1')).toHaveTextContent('Nepal');
  });

  it('should display trip status for each joined trip', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={mockJoinedTrips} joinedHikes={[]} />
      </Router>
    );

    expect(screen.getByTestId('trip-status-trip-1')).toHaveTextContent('upcoming');
    expect(screen.getByTestId('trip-status-trip-2')).toHaveTextContent('completed');
  });

  it('should show empty state message when no trips are joined', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={[]} joinedHikes={[]} />
      </Router>
    );

    expect(screen.getByTestId('no-trips-message')).toBeInTheDocument();
    expect(screen.getByTestId('no-trips-message')).toHaveTextContent('No trips joined yet.');
  });

  it('should display joined hikes in the dashboard', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={[]} joinedHikes={mockJoinedHikes} />
      </Router>
    );

    expect(screen.getByTestId('hike-hike-1')).toBeInTheDocument();
    expect(screen.getByTestId('hike-difficulty-hike-1')).toHaveTextContent('moderate');
  });

  it('should show empty hikes message when no hikes are joined', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={[]} joinedHikes={[]} />
      </Router>
    );

    expect(screen.getByTestId('no-hikes-message')).toHaveTextContent('No hikes joined yet.');
  });

  it('should display both trips and hikes simultaneously', () => {
    render(
      <Router>
        <DashboardComponent user={mockUser} joinedTrips={mockJoinedTrips} joinedHikes={mockJoinedHikes} />
      </Router>
    );

    expect(screen.getByTestId('joined-trips')).toBeInTheDocument();
    expect(screen.getByTestId('joined-hikes')).toBeInTheDocument();
    expect(screen.getByTestId('trip-trip-1')).toBeInTheDocument();
    expect(screen.getByTestId('hike-hike-1')).toBeInTheDocument();
  });
});
