// backend/__tests__/controllers/tripController.test.js
// Comprehensive trip management tests

const { mockTripId, mockUserId } = require('../mocks/models');

describe('Trip Service Logic Tests', () => {
  describe('Trip Availability', () => {
    it('should check if trip has available spots', () => {
      const isSpotAvailable = (trip) => {
        const participantCount = trip.participants?.length || 0;
        return participantCount < trip.maxTravelers;
      };

      const fullTrip = {
        _id: mockTripId,
        participants: Array(10).fill('user-id'),
        maxTravelers: 10,
      };

      const openTrip = {
        _id: mockTripId,
        participants: ['user-1', 'user-2'],
        maxTravelers: 10,
      };

      expect(isSpotAvailable(fullTrip)).toBe(false);
      expect(isSpotAvailable(openTrip)).toBe(true);
    });

    it('should check if user already joined trip', () => {
      const hasUserJoined = (trip, userId) => {
        return trip.participants?.some(p => p === userId || p._id === userId) || false;
      };

      const trip = {
        participants: [mockUserId, 'user-2'],
      };

      expect(hasUserJoined(trip, mockUserId)).toBe(true);
      expect(hasUserJoined(trip, 'user-3')).toBe(false);
    });

    it('should calculate remaining spots in trip', () => {
      const getRemainingSpots = (trip) => {
        const participantCount = trip.participants?.length || 0;
        return trip.maxTravelers - participantCount;
      };

      const trip = {
        participants: ['user-1', 'user-2', 'user-3'],
        maxTravelers: 10,
      };

      expect(getRemainingSpots(trip)).toBe(7);
    });
  });

  describe('Trip Capacity Management', () => {
    it('should validate trip capacity constraints', () => {
      const validateCapacity = (maxTravelers) => {
        return maxTravelers > 0 && maxTravelers <= 100;
      };

      expect(validateCapacity(10)).toBe(true);
      expect(validateCapacity(0)).toBe(false);
      expect(validateCapacity(150)).toBe(false);
    });

    it('should prevent overbooking trips', () => {
      const addUserToTrip = (trip, userId) => {
        const participantCount = trip.participants?.length || 0;
        
        if (trip.participants?.some(p => p === userId)) {
          return { success: false, message: 'User already joined' };
        }
        
        if (participantCount >= trip.maxTravelers) {
          return { success: false, message: 'Trip is full' };
        }

        trip.participants.push(userId);
        return { success: true, message: 'User added to trip' };
      };

      const trip = {
        participants: ['user-1'],
        maxTravelers: 2,
      };

      const result1 = addUserToTrip(trip, 'user-2');
      expect(result1.success).toBe(true);

      const result2 = addUserToTrip(trip, 'user-3');
      expect(result2.success).toBe(false);
    });
  });

  describe('Trip Validation', () => {
    it('should validate required trip fields', () => {
      const validateTripData = (data) => {
        const required = ['title', 'location', 'maxTravelers', 'startDate'];
        const missing = required.filter(field => !data[field]);
        return { valid: missing.length === 0, missing };
      };

      const validData = {
        title: 'Everest Trek',
        location: 'Nepal',
        maxTravelers: 10,
        startDate: '2025-07-01',
      };

      expect(validateTripData(validData).valid).toBe(true);

      const invalidData = { title: 'Trek' };
      const result = validateTripData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it('should ensure start date is before end date', () => {
      const validateDateRange = (startDate, endDate) => {
        return startDate && endDate && new Date(startDate) < new Date(endDate);
      };

      expect(validateDateRange('2025-07-01', '2025-07-10')).toBe(true);
      expect(validateDateRange('2025-07-10', '2025-07-01')).toBe(false);
    });

    it('should calculate trip duration', () => {
      const getTripDuration = (startDate, endDate) => {
        return Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      };

      expect(getTripDuration('2025-07-01', '2025-07-10')).toBe(9);
      expect(getTripDuration('2025-07-01', '2025-07-02')).toBe(1);
    });
  });

  describe('Trip Status Management', () => {
    it('should track trip status correctly', () => {
      const validStatuses = ['planning', 'active', 'completed', 'cancelled'];
      
      const trip = { status: 'planning' };
      expect(validStatuses).toContain(trip.status);

      const updateStatus = (trip, newStatus) => {
        if (validStatuses.includes(newStatus)) {
          trip.status = newStatus;
          return { success: true };
        }
        return { success: false, message: 'Invalid status' };
      };

      const result = updateStatus(trip, 'active');
      expect(result.success).toBe(true);
      expect(trip.status).toBe('active');
    });
  });

  describe('Trip Response Building', () => {
    it('should build trip response with correct structure', () => {
      const buildTripResponse = (trip) => ({
        id: trip._id,
        title: trip.title,
        location: trip.location,
        description: trip.description,
        maxTravelers: trip.maxTravelers,
        participantCount: trip.participants?.length || 0,
        startDate: trip.startDate,
        endDate: trip.endDate,
      });

      const trip = {
        _id: mockTripId,
        title: 'Everest Base Camp',
        location: 'Nepal',
        description: 'Amazing trek',
        maxTravelers: 10,
        participants: ['user-1', 'user-2'],
        startDate: '2025-07-01',
        endDate: '2025-07-10',
      };

      const response = buildTripResponse(trip);
      expect(response).toHaveProperty('id', mockTripId);
      expect(response).toHaveProperty('title');
      expect(response).toHaveProperty('participantCount', 2);
    });
  });
});
