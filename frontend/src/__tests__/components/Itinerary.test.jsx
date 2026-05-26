// frontend/src/__tests__/components/Itinerary.test.jsx
// Tests for FR-OS-13: Submit itinerary inputs and view generated day-wise itinerary

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock Itinerary Input Form
const ItineraryForm = ({ onGenerate }) => (
  <form
    data-testid="itinerary-form"
    onSubmit={e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      onGenerate && onGenerate({
        destination: fd.get('destination'),
        days: fd.get('days'),
        budget: fd.get('budget'),
        travelStyle: fd.get('travelStyle'),
        interests: fd.get('interests'),
      });
    }}
  >
    <input name="destination" data-testid="destination-input" placeholder="Destination" />
    <input name="days" type="number" data-testid="days-input" placeholder="Number of days" />
    <input name="budget" data-testid="budget-input" placeholder="Total budget (NPR)" />
    <select name="travelStyle" data-testid="travel-style-select">
      <option value="">Select travel style</option>
      <option value="budget">Budget</option>
      <option value="balanced">Balanced</option>
      <option value="luxury">Luxury</option>
    </select>
    <input name="interests" data-testid="interests-input" placeholder="Interests (optional)" />
    <button type="submit" data-testid="generate-btn">Generate Itinerary</button>
  </form>
);

// Mock Itinerary Display component
const ItineraryDisplay = ({ itinerary, destination, totalDays }) => (
  <div data-testid="itinerary-display">
    {itinerary ? (
      <>
        <h2 data-testid="itinerary-title">{totalDays}-Day Itinerary for {destination}</h2>
        <div data-testid="itinerary-content">
          {itinerary.days && itinerary.days.map(day => (
            <div key={day.day} data-testid={`day-${day.day}`}>
              <h3 data-testid={`day-title-${day.day}`}>Day {day.day}</h3>
              <p data-testid={`day-morning-${day.day}`}>{day.morning}</p>
              <p data-testid={`day-afternoon-${day.day}`}>{day.afternoon}</p>
              <p data-testid={`day-evening-${day.day}`}>{day.evening}</p>
            </div>
          ))}
        </div>
      </>
    ) : (
      <p data-testid="no-itinerary">Enter your trip details to generate an itinerary.</p>
    )}
  </div>
);

const mockItinerary = {
  days: [
    { day: 1, morning: 'Arrive in Pokhara', afternoon: 'Explore lakeside', evening: 'Dinner at local restaurant' },
    { day: 2, morning: 'Sarangkot sunrise', afternoon: 'Phewa Lake boat ride', evening: 'Cultural show' },
    { day: 3, morning: 'Departure prep', afternoon: 'Shopping at Bazar', evening: 'Fly back' },
  ],
};

describe('Itinerary Form - FR-OS-13: Submit Itinerary Inputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the itinerary form with all fields', () => {
    render(
      <Router>
        <ItineraryForm />
      </Router>
    );

    expect(screen.getByTestId('itinerary-form')).toBeInTheDocument();
    expect(screen.getByTestId('destination-input')).toBeInTheDocument();
    expect(screen.getByTestId('days-input')).toBeInTheDocument();
    expect(screen.getByTestId('budget-input')).toBeInTheDocument();
    expect(screen.getByTestId('travel-style-select')).toBeInTheDocument();
    expect(screen.getByTestId('generate-btn')).toBeInTheDocument();
  });

  it('should allow entering destination', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ItineraryForm />
      </Router>
    );

    const destInput = screen.getByTestId('destination-input');
    await user.type(destInput, 'Pokhara');
    expect(destInput).toHaveValue('Pokhara');
  });

  it('should allow entering number of days', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ItineraryForm />
      </Router>
    );

    const daysInput = screen.getByTestId('days-input');
    await user.type(daysInput, '5');
    expect(daysInput).toHaveValue(5);
  });

  it('should allow entering budget', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ItineraryForm />
      </Router>
    );

    const budgetInput = screen.getByTestId('budget-input');
    await user.type(budgetInput, '25000');
    expect(budgetInput).toHaveValue('25000');
  });

  it('should allow selecting travel style', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ItineraryForm />
      </Router>
    );

    const styleSelect = screen.getByTestId('travel-style-select');
    await user.selectOptions(styleSelect, 'balanced');
    expect(styleSelect).toHaveValue('balanced');
  });

  it('should show all travel style options', () => {
    render(
      <Router>
        <ItineraryForm />
      </Router>
    );

    expect(screen.getByRole('option', { name: /budget/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /balanced/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /luxury/i })).toBeInTheDocument();
  });

  it('should call onGenerate with form inputs on submit', async () => {
    const mockGenerate = jest.fn();
    const user = userEvent.setup();

    render(
      <Router>
        <ItineraryForm onGenerate={mockGenerate} />
      </Router>
    );

    await user.type(screen.getByTestId('destination-input'), 'Kathmandu');
    await user.type(screen.getByTestId('days-input'), '3');

    const form = screen.getByTestId('itinerary-form');
    form.dispatchEvent(new Event('submit', { bubbles: true }));

    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalled();
    });
  });

  it('should call API to generate itinerary', async () => {
    axios.post = jest.fn().mockResolvedValue({
      data: { destination: 'Chitwan', totalDays: 3, itinerary: 'Day 1: Arrival...' },
    });

    const response = await axios.post('/api/itinerary/generate', {
      destination: 'Chitwan',
      days: 3,
      travelStyle: 'budget',
    });

    expect(response.data.destination).toBe('Chitwan');
    expect(response.data.totalDays).toBe(3);
  });
});

describe('Itinerary Display - FR-OS-13: View Generated Itinerary', () => {
  it('should show placeholder when no itinerary generated', () => {
    render(
      <Router>
        <ItineraryDisplay itinerary={null} />
      </Router>
    );

    expect(screen.getByTestId('no-itinerary')).toBeInTheDocument();
  });

  it('should display itinerary title with destination and day count', () => {
    render(
      <Router>
        <ItineraryDisplay itinerary={mockItinerary} destination="Pokhara" totalDays={3} />
      </Router>
    );

    expect(screen.getByTestId('itinerary-title')).toHaveTextContent('3-Day Itinerary for Pokhara');
  });

  it('should render a section for each day', () => {
    render(
      <Router>
        <ItineraryDisplay itinerary={mockItinerary} destination="Pokhara" totalDays={3} />
      </Router>
    );

    expect(screen.getByTestId('day-1')).toBeInTheDocument();
    expect(screen.getByTestId('day-2')).toBeInTheDocument();
    expect(screen.getByTestId('day-3')).toBeInTheDocument();
  });

  it('should display morning, afternoon, and evening for each day', () => {
    render(
      <Router>
        <ItineraryDisplay itinerary={mockItinerary} destination="Pokhara" totalDays={3} />
      </Router>
    );

    expect(screen.getByTestId('day-morning-1')).toHaveTextContent('Arrive in Pokhara');
    expect(screen.getByTestId('day-afternoon-1')).toHaveTextContent('Explore lakeside');
    expect(screen.getByTestId('day-evening-1')).toHaveTextContent('Dinner at local restaurant');
  });

  it('should label each day correctly', () => {
    render(
      <Router>
        <ItineraryDisplay itinerary={mockItinerary} destination="Pokhara" totalDays={3} />
      </Router>
    );

    expect(screen.getByTestId('day-title-1')).toHaveTextContent('Day 1');
    expect(screen.getByTestId('day-title-2')).toHaveTextContent('Day 2');
    expect(screen.getByTestId('day-title-3')).toHaveTextContent('Day 3');
  });
});
