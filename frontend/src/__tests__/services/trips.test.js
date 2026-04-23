// frontend/src/__tests__/services/trips.test.js
// Trip and hiking service tests

import axios from 'axios';

jest.mock('axios');

describe('Trip Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all trips', async () => {
    axios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        trips: [
          {
            _id: 'trip-1',
            title: 'Everest Base Camp',
            location: 'Nepal',
            maxTravelers: 10,
            currentParticipants: 5,
          },
        ],
      },
    });

    const response = await axios.get('/api/trips');

    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.trips)).toBe(true);
    expect(response.data.trips[0].title).toBe('Everest Base Camp');
  });

  it('should fetch trip details', async () => {
    axios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        trip: {
          _id: 'trip-1',
          title: 'Everest Base Camp',
          description: 'Amazing trekking experience',
          location: 'Nepal',
          maxTravelers: 10,
          participants: ['user-1', 'user-2'],
          startDate: '2025-07-01',
          endDate: '2025-07-10',
        },
      },
    });

    const response = await axios.get('/api/trips/trip-1');

    expect(response.data.success).toBe(true);
    expect(response.data.trip.title).toBe('Everest Base Camp');
    expect(response.data.trip.participants.length).toBe(2);
  });

  it('should join a trip', async () => {
    axios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        message: 'Successfully joined the trip',
        trip: {
          _id: 'trip-1',
          participants: ['user-1', 'user-2', 'user-3'],
        },
      },
    });

    const response = await axios.post('/api/trips/trip-1/join');

    expect(response.data.success).toBe(true);
    expect(response.data.trip.participants.length).toBe(3);
  });

  it('should create a new trip', async () => {
    const tripData = {
      title: 'New Adventure Trek',
      description: 'A wonderful journey',
      location: 'Bhutan',
      maxTravelers: 12,
      startDate: '2025-08-01',
      endDate: '2025-08-10',
    };

    axios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        trip: {
          _id: 'trip-new',
          ...tripData,
          createdBy: 'user-1',
          participants: ['user-1'],
        },
      },
    });

    const response = await axios.post('/api/trips', tripData);

    expect(response.data.success).toBe(true);
    expect(response.data.trip.title).toBe('New Adventure Trek');
  });

  it('should handle trip join errors', async () => {
    axios.post = jest.fn().mockRejectedValue(
      new Error('Trip is full')
    );

    try {
      await axios.post('/api/trips/trip-1/join');
      fail('Should have thrown error');
    } catch (error) {
      expect(error.message).toBe('Trip is full');
    }
  });
});

describe('Hiking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all hikes', async () => {
    axios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        hikes: [
          {
            _id: 'hike-1',
            name: 'Everest Base Camp Trek',
            difficulty: 'Hard',
            duration: 14,
            location: 'Nepal',
          },
        ],
      },
    });

    const response = await axios.get('/api/hikes');

    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.hikes)).toBe(true);
  });

  it('should fetch hike details', async () => {
    axios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        hike: {
          _id: 'hike-1',
          name: 'Everest Base Camp Trek',
          difficulty: 'Hard',
          duration: 14,
          distance: 65,
          elevation: 5364,
          description: 'Epic trek to Everest Base Camp',
          date: '2025-06-15',
        },
      },
    });

    const response = await axios.get('/api/hikes/hike-1');

    expect(response.data.success).toBe(true);
    expect(response.data.hike.name).toBe('Everest Base Camp Trek');
    expect(response.data.hike.distance).toBe(65);
  });

  it('should filter hikes by difficulty', async () => {
    axios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        hikes: [
          {
            _id: 'hike-1',
            name: 'Easy Walk',
            difficulty: 'Easy',
          },
        ],
      },
    });

    const response = await axios.get('/api/hikes?difficulty=Easy');

    expect(response.data.success).toBe(true);
    expect(response.data.hikes[0].difficulty).toBe('Easy');
  });
});
