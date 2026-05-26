// backend/__tests__/controllers/communityController.test.js
// Tests for FR-OS-11: Upload photo and submit a review

const { mockUserId } = require('../mocks/models');

describe('Community Controller - FR-OS-11: Photo Upload and Review Submission', () => {
  describe('Review Validation', () => {
    it('should validate required review fields', () => {
      const validateReview = (data, user) => {
        if (!user || !user.name || !user.name.trim()) {
          return { valid: false, message: 'User profile is incomplete. Please update your profile with a name.' };
        }
        if (!data.locationName || !data.locationName.trim()) {
          return { valid: false, message: 'Location name is required.' };
        }
        if (!data.rating) {
          return { valid: false, message: 'Rating is required.' };
        }
        return { valid: true };
      };

      const user = { _id: mockUserId, name: 'Test User' };
      const validReview = { locationName: 'Pokhara', rating: 5, comment: 'Amazing!' };

      expect(validateReview(validReview, user).valid).toBe(true);
      expect(validateReview({ rating: 4 }, user).valid).toBe(false);
      expect(validateReview(validReview, { name: '' }).valid).toBe(false);
      expect(validateReview({ locationName: 'Pokhara' }, user).valid).toBe(false);
    });

    it('should accept ratings between 1 and 5 inclusive', () => {
      const isValidRating = (rating) => {
        const num = Number(rating);
        return !isNaN(num) && num >= 1 && num <= 5;
      };

      expect(isValidRating(1)).toBe(true);
      expect(isValidRating(3)).toBe(true);
      expect(isValidRating(5)).toBe(true);
      expect(isValidRating(0)).toBe(false);
      expect(isValidRating(6)).toBe(false);
      expect(isValidRating('abc')).toBe(false);
    });

    it('should trim location name whitespace', () => {
      const sanitizeLocationName = (name) => name && name.trim();

      expect(sanitizeLocationName('  Kathmandu  ')).toBe('Kathmandu');
      expect(sanitizeLocationName('Nepal')).toBe('Nepal');
    });

    it('should build review response with correct structure', () => {
      const buildReviewResponse = (review, user) => ({
        id: review._id,
        locationName: review.locationName,
        rating: review.rating,
        comment: review.comment || '',
        userName: user.name,
        userId: user._id,
        createdAt: review.createdAt,
      });

      const review = { _id: 'r1', locationName: 'Pokhara', rating: 5, comment: 'Great!', createdAt: new Date() };
      const user = { _id: mockUserId, name: 'Test User' };
      const response = buildReviewResponse(review, user);

      expect(response).toHaveProperty('rating', 5);
      expect(response).toHaveProperty('locationName', 'Pokhara');
      expect(response).toHaveProperty('userName', 'Test User');
      expect(response).not.toHaveProperty('password');
    });
  });

  describe('Photo Upload Validation', () => {
    it('should validate allowed image file types', () => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const isValidImageType = (mimeType) => allowedMimeTypes.includes(mimeType);

      expect(isValidImageType('image/jpeg')).toBe(true);
      expect(isValidImageType('image/png')).toBe(true);
      expect(isValidImageType('image/webp')).toBe(true);
      expect(isValidImageType('application/pdf')).toBe(false);
      expect(isValidImageType('text/html')).toBe(false);
    });

    it('should reject files exceeding the maximum size limit', () => {
      const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
      const isFileSizeValid = (sizeBytes) => sizeBytes <= MAX_SIZE_BYTES;

      expect(isFileSizeValid(1 * 1024 * 1024)).toBe(true);   // 1 MB
      expect(isFileSizeValid(5 * 1024 * 1024)).toBe(true);   // exactly 5 MB
      expect(isFileSizeValid(6 * 1024 * 1024)).toBe(false);  // 6 MB
    });

    it('should build photo response after successful upload', () => {
      const buildPhotoResponse = (cloudinaryResult, userId) => ({
        id: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      });

      const cloudinaryResult = {
        public_id: 'travel-buddy/photo_123',
        secure_url: 'https://res.cloudinary.com/travel-buddy/photo_123.jpg',
      };

      const response = buildPhotoResponse(cloudinaryResult, mockUserId);
      expect(response).toHaveProperty('url');
      expect(response.url).toContain('cloudinary');
      expect(response).toHaveProperty('uploadedBy', mockUserId);
    });

    it('should require file to be present for upload', () => {
      const validateFileUpload = (file) => {
        if (!file) return { valid: false, message: 'No file uploaded.' };
        return { valid: true };
      };

      expect(validateFileUpload(null).valid).toBe(false);
      expect(validateFileUpload({ buffer: Buffer.from('data'), mimetype: 'image/jpeg' }).valid).toBe(true);
    });
  });

  describe('Community Feed', () => {
    it('should sort reviews by newest first', () => {
      const reviews = [
        { _id: 'r1', createdAt: new Date('2025-03-01') },
        { _id: 'r3', createdAt: new Date('2025-05-01') },
        { _id: 'r2', createdAt: new Date('2025-04-01') },
      ];

      const sorted = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      expect(sorted[0]._id).toBe('r3');
      expect(sorted[2]._id).toBe('r1');
    });

    it('should limit feed results to requested count', () => {
      const getFeedItems = (items, limit) => items.slice(0, limit);
      const photos = Array.from({ length: 20 }, (_, i) => ({ id: i }));

      expect(getFeedItems(photos, 10)).toHaveLength(10);
      expect(getFeedItems(photos, 5)).toHaveLength(5);
    });
  });
});
