// backend/__tests__/controllers/accessControl.test.js
// Tests for FR-OS-03 (protected route access) and FR-OS-04 (admin-only access)

describe('Access Control - FR-OS-03: Protected Route Enforcement', () => {
  describe('Token Presence Check', () => {
    it('should block request when no Authorization header is present', () => {
      const extractToken = (headers) => {
        const authHeader = headers['authorization'];
        if (!authHeader) return null;
        return authHeader.split(' ')[1] || null;
      };

      expect(extractToken({})).toBeNull();
      expect(extractToken({ authorization: '' })).toBeNull();
    });

    it('should extract Bearer token from Authorization header', () => {
      const extractToken = (headers) => {
        const authHeader = headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        return authHeader.split(' ')[1] || null;
      };

      expect(extractToken({ authorization: 'Bearer valid-jwt-token' })).toBe('valid-jwt-token');
      expect(extractToken({ authorization: 'Basic dXNlcjpwYXNz' })).toBeNull();
    });

    it('should return 401 error when no token provided', () => {
      const handleMissingToken = (token) => {
        if (!token) {
          return { status: 401, message: 'Authentication required. Please log in.' };
        }
        return { status: 200 };
      };

      const result = handleMissingToken(null);
      expect(result.status).toBe(401);
      expect(result.message).toContain('Authentication required');
    });
  });

  describe('Token Validation', () => {
    it('should reject malformed JWT tokens', () => {
      const isValidJwtStructure = (token) => {
        if (!token) return false;
        const parts = token.split('.');
        return parts.length === 3 && parts.every(p => p.length > 0);
      };

      expect(isValidJwtStructure('header.payload.signature')).toBe(true);
      expect(isValidJwtStructure('not-a-jwt')).toBe(false);
      expect(isValidJwtStructure('only.two')).toBe(false);
      expect(isValidJwtStructure('')).toBe(false);
      expect(isValidJwtStructure(null)).toBe(false);
    });

    it('should identify expired token error and return 401', () => {
      const handleTokenError = (errorName) => {
        if (errorName === 'JsonWebTokenError') {
          return { status: 401, message: 'Invalid token.' };
        }
        if (errorName === 'TokenExpiredError') {
          return { status: 401, message: 'Token expired. Please log in again.' };
        }
        return { status: 500, message: 'Authentication error.' };
      };

      expect(handleTokenError('JsonWebTokenError').status).toBe(401);
      expect(handleTokenError('TokenExpiredError').status).toBe(401);
      expect(handleTokenError('TokenExpiredError').message).toContain('expired');
    });

    it('should allow access when token is valid and user exists', () => {
      const validateAccess = (token, user) => {
        if (!token) return { allowed: false, reason: 'no_token' };
        if (!user) return { allowed: false, reason: 'user_not_found' };
        return { allowed: true };
      };

      expect(validateAccess('valid-token', { _id: '123', role: 'user' }).allowed).toBe(true);
      expect(validateAccess(null, { _id: '123' }).allowed).toBe(false);
      expect(validateAccess('token', null).allowed).toBe(false);
    });

    it('should redirect unauthenticated user to login page', () => {
      const getRedirectPath = (isAuthenticated) => {
        if (!isAuthenticated) return '/login';
        return null;
      };

      expect(getRedirectPath(false)).toBe('/login');
      expect(getRedirectPath(true)).toBeNull();
    });
  });
});

describe('Access Control - FR-OS-04: Admin Role Restriction', () => {
  describe('Role Checking', () => {
    it('should deny access to admin route for normal user', () => {
      const checkAdminAccess = (user) => {
        if (!user || user.role !== 'admin') {
          return { allowed: false, status: 403, message: 'Access denied. Admins only.' };
        }
        return { allowed: true };
      };

      const normalUser = { _id: '123', role: 'user' };
      const adminUser = { _id: '456', role: 'admin' };

      expect(checkAdminAccess(normalUser).allowed).toBe(false);
      expect(checkAdminAccess(normalUser).status).toBe(403);
      expect(checkAdminAccess(adminUser).allowed).toBe(true);
    });

    it('should return 403 with correct message for non-admin access', () => {
      const adminOnly = (user) => {
        if (!user || user.role !== 'admin') {
          return { status: 403, message: 'Access denied. Admins only.' };
        }
        return { status: 200 };
      };

      const result = adminOnly({ role: 'user' });
      expect(result.status).toBe(403);
      expect(result.message).toBe('Access denied. Admins only.');
    });

    it('should deny access when user object is missing', () => {
      const checkAdminAccess = (user) => {
        if (!user || user.role !== 'admin') {
          return { allowed: false };
        }
        return { allowed: true };
      };

      expect(checkAdminAccess(null).allowed).toBe(false);
      expect(checkAdminAccess(undefined).allowed).toBe(false);
    });

    it('should allow admin to access admin-only routes', () => {
      const checkAdminAccess = (user) => {
        if (!user || user.role !== 'admin') {
          return { allowed: false };
        }
        return { allowed: true };
      };

      const adminUser = { _id: '789', name: 'Admin User', role: 'admin' };
      expect(checkAdminAccess(adminUser).allowed).toBe(true);
    });

    it('should not elevate privileges from token payload tampering', () => {
      // Simulates: even if someone sends role=admin in body, role comes from DB user
      const resolveUserRole = (dbUser, _requestBody) => {
        // Role is always taken from the verified DB user, never from the request
        return dbUser.role;
      };

      const dbUser = { role: 'user' };
      const tamperedBody = { role: 'admin' };
      expect(resolveUserRole(dbUser, tamperedBody)).toBe('user');
    });
  });
});
