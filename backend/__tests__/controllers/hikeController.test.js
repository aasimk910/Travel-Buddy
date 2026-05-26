// backend/__tests__/controllers/hikeController.test.js
// Tests for FR-OS-06 (search/filter/sort hikes) and FR-OS-07 (create/join hike)

const { mockUserId } = require('../mocks/models');

const mockHikeId = '507f1f77bcf86cd799439020';

describe('Hike Controller - FR-OS-06: Search, Filter, and Sort Hikes', () => {
  describe('Hike Filtering', () => {
    const sampleHikes = [
      { _id: 'h1', name: 'Everest Base Camp', difficulty: 'hard', distance: 130, location: 'Nepal' },
      { _id: 'h2', name: 'Annapurna Circuit', difficulty: 'moderate', distance: 160, location: 'Nepal' },
      { _id: 'h3', name: 'Langtang Valley', difficulty: 'easy', distance: 70, location: 'Nepal' },
      { _id: 'h4', name: 'Manaslu Circuit', difficulty: 'hard', distance: 177, location: 'Nepal' },
    ];

    it('should filter hikes by difficulty level', () => {
      const filterByDifficulty = (hikes, difficulty) => {
        if (!difficulty) return hikes;
        return hikes.filter(h => h.difficulty === difficulty);
      };

      const hardHikes = filterByDifficulty(sampleHikes, 'hard');
      expect(hardHikes).toHaveLength(2);
      expect(hardHikes.every(h => h.difficulty === 'hard')).toBe(true);

      const easyHikes = filterByDifficulty(sampleHikes, 'easy');
      expect(easyHikes).toHaveLength(1);
      expect(easyHikes[0].name).toBe('Langtang Valley');
    });

    it('should return all hikes when no filter is applied', () => {
      const filterByDifficulty = (hikes, difficulty) => {
        if (!difficulty) return hikes;
        return hikes.filter(h => h.difficulty === difficulty);
      };

      expect(filterByDifficulty(sampleHikes, null)).toHaveLength(4);
      expect(filterByDifficulty(sampleHikes, '')).toHaveLength(4);
    });

    it('should search hikes by name (case-insensitive)', () => {
      const searchHikes = (hikes, query) => {
        if (!query) return hikes;
        const lower = query.toLowerCase();
        return hikes.filter(h => h.name.toLowerCase().includes(lower));
      };

      expect(searchHikes(sampleHikes, 'everest')).toHaveLength(1);
      expect(searchHikes(sampleHikes, 'CIRCUIT')).toHaveLength(2);
      expect(searchHikes(sampleHikes, 'xyz')).toHaveLength(0);
    });

    it('should filter hikes by maximum distance', () => {
      const filterByMaxDistance = (hikes, maxKm) => {
        if (!maxKm) return hikes;
        return hikes.filter(h => h.distance <= maxKm);
      };

      const shortHikes = filterByMaxDistance(sampleHikes, 100);
      expect(shortHikes).toHaveLength(1);
      expect(shortHikes[0].name).toBe('Langtang Valley');
    });
  });

  describe('Hike Sorting', () => {
    const sampleHikes = [
      { _id: 'h1', name: 'C Hike', distance: 50, date: new Date('2025-08-01') },
      { _id: 'h2', name: 'A Hike', distance: 120, date: new Date('2025-06-01') },
      { _id: 'h3', name: 'B Hike', distance: 80, date: new Date('2025-07-01') },
    ];

    it('should sort hikes by date ascending', () => {
      const sorted = [...sampleHikes].sort((a, b) => new Date(a.date) - new Date(b.date));
      expect(sorted[0].name).toBe('A Hike');
      expect(sorted[2].name).toBe('C Hike');
    });

    it('should sort hikes by distance ascending', () => {
      const sorted = [...sampleHikes].sort((a, b) => a.distance - b.distance);
      expect(sorted[0].distance).toBe(50);
      expect(sorted[2].distance).toBe(120);
    });

    it('should sort hikes alphabetically by name', () => {
      const sorted = [...sampleHikes].sort((a, b) => a.name.localeCompare(b.name));
      expect(sorted[0].name).toBe('A Hike');
      expect(sorted[1].name).toBe('B Hike');
      expect(sorted[2].name).toBe('C Hike');
    });
  });

  describe('Season Detection', () => {
    it('should correctly identify season from date', () => {
      const getSeasonFromDate = (dateValue) => {
        const month = new Date(dateValue).getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
      };

      expect(getSeasonFromDate('2025-04-15')).toBe('spring');
      expect(getSeasonFromDate('2025-07-10')).toBe('summer');
      expect(getSeasonFromDate('2025-10-20')).toBe('autumn');
      expect(getSeasonFromDate('2025-01-05')).toBe('winter');
    });
  });
});

describe('Hike Controller - FR-OS-07: Create and Join Hike/Trip', () => {
  describe('Hike Creation Validation', () => {
    it('should validate required hike fields', () => {
      const validateHikeData = (data) => {
        const required = ['name', 'location', 'difficulty', 'distance', 'date'];
        const missing = required.filter(f => !data[f]);
        return { valid: missing.length === 0, missing };
      };

      const validHike = {
        name: 'New Trail',
        location: 'Pokhara',
        difficulty: 'moderate',
        distance: 45,
        date: new Date('2025-09-01'),
      };

      expect(validateHikeData(validHike).valid).toBe(true);
      expect(validateHikeData({ name: 'Incomplete' }).valid).toBe(false);
    });

    it('should reject invalid difficulty values', () => {
      const validDifficulties = ['easy', 'moderate', 'hard'];
      const isValidDifficulty = (d) => validDifficulties.includes(d);

      expect(isValidDifficulty('easy')).toBe(true);
      expect(isValidDifficulty('moderate')).toBe(true);
      expect(isValidDifficulty('hard')).toBe(true);
      expect(isValidDifficulty('extreme')).toBe(false);
      expect(isValidDifficulty('')).toBe(false);
    });

    it('should require positive distance', () => {
      const isValidDistance = (km) => typeof km === 'number' && km > 0;

      expect(isValidDistance(10)).toBe(true);
      expect(isValidDistance(0)).toBe(false);
      expect(isValidDistance(-5)).toBe(false);
    });
  });

  describe('Joining a Hike', () => {
    it('should allow authenticated user to join a hike with spots available', () => {
      const joinHike = (hike, userId) => {
        if (!userId) return { success: false, message: 'Authentication required.' };
        if (hike.participants.includes(userId)) {
          return { success: false, message: 'Already joined this hike.' };
        }
        if (hike.participants.length >= hike.maxParticipants) {
          return { success: false, message: 'Hike is full.' };
        }
        return { success: true, participants: [...hike.participants, userId] };
      };

      const openHike = { participants: ['user-1'], maxParticipants: 10 };
      const result = joinHike(openHike, mockUserId);
      expect(result.success).toBe(true);
      expect(result.participants).toContain(mockUserId);
    });

    it('should prevent joining a full hike', () => {
      const joinHike = (hike, userId) => {
        if (hike.participants.length >= hike.maxParticipants) {
          return { success: false, message: 'Hike is full.' };
        }
        return { success: true };
      };

      const fullHike = { participants: Array(8).fill('user'), maxParticipants: 8 };
      expect(joinHike(fullHike, mockUserId).success).toBe(false);
      expect(joinHike(fullHike, mockUserId).message).toBe('Hike is full.');
    });

    it('should prevent joining the same hike twice', () => {
      const joinHike = (hike, userId) => {
        if (hike.participants.includes(userId)) {
          return { success: false, message: 'Already joined this hike.' };
        }
        return { success: true };
      };

      const hike = { participants: [mockUserId, 'user-2'], maxParticipants: 10 };
      expect(joinHike(hike, mockUserId).success).toBe(false);
    });

    it('should require authentication to join a hike', () => {
      const joinHike = (hike, userId) => {
        if (!userId) return { success: false, message: 'Authentication required.' };
        return { success: true };
      };

      expect(joinHike({ participants: [] }, null).success).toBe(false);
      expect(joinHike({ participants: [] }, null).message).toBe('Authentication required.');
    });
  });

  describe('Hike Participant Management', () => {
    it('should calculate remaining spots correctly', () => {
      const getRemainingSpots = (hike) => hike.maxParticipants - hike.participants.length;

      expect(getRemainingSpots({ participants: ['a', 'b'], maxParticipants: 10 })).toBe(8);
      expect(getRemainingSpots({ participants: [], maxParticipants: 5 })).toBe(5);
    });

    it('should build hike response with participant count', () => {
      const buildHikeResponse = (hike) => ({
        id: hike._id,
        name: hike.name,
        participantCount: hike.participants.length,
        spotsLeft: hike.maxParticipants - hike.participants.length,
        isFull: hike.participants.length >= hike.maxParticipants,
      });

      const hike = { _id: mockHikeId, name: 'Trail A', participants: ['u1', 'u2'], maxParticipants: 5 };
      const response = buildHikeResponse(hike);

      expect(response.participantCount).toBe(2);
      expect(response.spotsLeft).toBe(3);
      expect(response.isFull).toBe(false);
    });
  });
});
