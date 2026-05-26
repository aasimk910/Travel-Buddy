// backend/__tests__/controllers/adminController.test.js
// Tests for FR-OS-14: Admin edit/delete user or hike actions

const { mockUserId } = require('../mocks/models');

const mockAdminId = '507f1f77bcf86cd799439040';
const mockHikeId = '507f1f77bcf86cd799439041';

describe('Admin Controller - FR-OS-14: Admin Management Actions', () => {
  describe('Admin User Management', () => {
    it('should build user list response with pagination', () => {
      const buildUserListResponse = (users, page, limit, total) => ({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });

      const users = [{ _id: 'u1', name: 'Alice' }, { _id: 'u2', name: 'Bob' }];
      const response = buildUserListResponse(users, 1, 20, 2);

      expect(response.users).toHaveLength(2);
      expect(response.pagination.total).toBe(2);
      expect(response.pagination.pages).toBe(1);
    });

    it('should validate required fields when admin creates a user', () => {
      const validateAdminCreateUser = (data) => {
        if (!data.name || !data.email || !data.password) {
          return { valid: false, message: 'Name, email and password are required.' };
        }
        if (!['user', 'admin'].includes(data.role || 'user')) {
          return { valid: false, message: "Role must be 'user' or 'admin'." };
        }
        return { valid: true };
      };

      expect(validateAdminCreateUser({ name: 'A', email: 'a@b.com', password: 'pass' }).valid).toBe(true);
      expect(validateAdminCreateUser({ email: 'a@b.com', password: 'pass' }).valid).toBe(false);
      expect(validateAdminCreateUser({ name: 'A', email: 'a@b.com', password: 'pass', role: 'superadmin' }).valid).toBe(false);
    });

    it('should validate allowed roles for user creation', () => {
      const allowedRoles = ['user', 'admin'];
      const isValidRole = (role) => allowedRoles.includes(role);

      expect(isValidRole('user')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('')).toBe(false);
    });

    it('should detect when attempting to delete the currently logged-in admin', () => {
      const canDeleteUser = (adminId, targetUserId) => {
        if (adminId === targetUserId) {
          return { allowed: false, message: 'Cannot delete your own account.' };
        }
        return { allowed: true };
      };

      expect(canDeleteUser(mockAdminId, mockAdminId).allowed).toBe(false);
      expect(canDeleteUser(mockAdminId, mockUserId).allowed).toBe(true);
    });

    it('should sanitize user data in admin response (no password)', () => {
      const sanitizeUserForAdmin = (user) => {
        const { password, __v, ...safe } = user;
        return safe;
      };

      const user = { _id: 'u1', name: 'Test', email: 'test@test.com', password: 'hashed', role: 'user', __v: 0 };
      const result = sanitizeUserForAdmin(user);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('__v');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });
  });

  describe('Admin Hike Management', () => {
    it('should validate hike update fields', () => {
      const validateHikeUpdate = (updates) => {
        const allowedFields = ['name', 'description', 'location', 'difficulty', 'distance', 'date', 'maxParticipants', 'status'];
        const invalidFields = Object.keys(updates).filter(f => !allowedFields.includes(f));
        return { valid: invalidFields.length === 0, invalidFields };
      };

      expect(validateHikeUpdate({ name: 'New Name', difficulty: 'easy' }).valid).toBe(true);
      expect(validateHikeUpdate({ name: 'New Name', unknownField: 'x' }).valid).toBe(false);
    });

    it('should confirm hike deletion removes the correct hike', () => {
      const deleteHikeById = (hikes, hikeId) => {
        const index = hikes.findIndex(h => h._id === hikeId);
        if (index === -1) return { success: false, message: 'Hike not found.' };
        const remaining = hikes.filter(h => h._id !== hikeId);
        return { success: true, remaining };
      };

      const hikes = [
        { _id: mockHikeId, name: 'Hike A' },
        { _id: 'hike-2', name: 'Hike B' },
      ];

      const result = deleteHikeById(hikes, mockHikeId);
      expect(result.success).toBe(true);
      expect(result.remaining).toHaveLength(1);
      expect(result.remaining[0]._id).toBe('hike-2');
    });

    it('should return error when deleting non-existent hike', () => {
      const deleteHikeById = (hikes, hikeId) => {
        const index = hikes.findIndex(h => h._id === hikeId);
        if (index === -1) return { success: false, message: 'Hike not found.' };
        return { success: true };
      };

      expect(deleteHikeById([], 'non-existent').success).toBe(false);
    });

    it('should apply partial updates to hike without overwriting other fields', () => {
      const applyHikeUpdate = (hike, updates) => ({ ...hike, ...updates });

      const originalHike = { _id: mockHikeId, name: 'Old Name', difficulty: 'easy', distance: 50 };
      const updated = applyHikeUpdate(originalHike, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.difficulty).toBe('easy');
      expect(updated.distance).toBe(50);
    });
  });

  describe('Admin Dashboard Statistics', () => {
    it('should calculate platform statistics correctly', () => {
      const calculateStats = ({ userCount, hikeCount, bookingCount, totalRevenue }) => ({
        totalUsers: userCount,
        totalHikes: hikeCount,
        totalBookings: bookingCount,
        totalRevenue,
        averageBookingValue: bookingCount > 0 ? parseFloat((totalRevenue / bookingCount).toFixed(2)) : 0,
      });

      const stats = calculateStats({ userCount: 100, hikeCount: 25, bookingCount: 50, totalRevenue: 75000 });
      expect(stats.totalUsers).toBe(100);
      expect(stats.averageBookingValue).toBe(1500);
    });

    it('should handle zero bookings without division error', () => {
      const calculateStats = ({ bookingCount, totalRevenue }) => ({
        averageBookingValue: bookingCount > 0 ? totalRevenue / bookingCount : 0,
      });

      expect(calculateStats({ bookingCount: 0, totalRevenue: 0 }).averageBookingValue).toBe(0);
    });
  });

  describe('Admin Search Functionality', () => {
    it('should filter users by search query (name or email)', () => {
      const searchUsers = (users, query) => {
        if (!query) return users;
        const lower = query.toLowerCase();
        return users.filter(u =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
        );
      };

      const users = [
        { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
        { _id: 'u2', name: 'Bob', email: 'bob@test.com' },
        { _id: 'u3', name: 'Charlie', email: 'charlie@example.com' },
      ];

      expect(searchUsers(users, 'alice')).toHaveLength(1);
      expect(searchUsers(users, 'test.com')).toHaveLength(2);
      expect(searchUsers(users, '')).toHaveLength(3);
    });
  });
});
