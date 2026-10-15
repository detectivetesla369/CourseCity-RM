import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  signAccessToken,
  hasPermission,
  hasAnyPermission,
} from '@coursecity/auth';
import { AuthService } from './services/auth.service.js';
import { AppError } from './errors/app-error.js';

describe('Authentication & Authorization Integration Test Suite', () => {
  let app: FastifyInstance;
  const testSecret = 'test_jwt_secret_must_be_minimum_32_chars_long_2026';

  beforeAll(async () => {
    process.env.JWT_SECRET = testSecret;
    app = await buildServer({ logLevel: 'silent' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // 1. INPUT VALIDATION & RFC 7807 ERROR MODEL
  // ==========================================
  describe('Input Validation & RFC 7807 Problem Details', () => {
    it('POST /api/v1/auth/signup rejects passwords under 10 chars or lacking complexity', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: {
          email: 'test@example.com',
          password: 'weak',
          displayName: 'Test User',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toContain('application/problem+json');
      const problem = response.json();
      expect(problem.status).toBe(400);
      expect(problem.details).toBeDefined();
    });

    it('POST /api/v1/auth/signup rejects invalid email formats', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: {
          email: 'not-an-email',
          password: 'ValidPassword123!',
          displayName: 'Test User',
        },
      });

      expect(response.statusCode).toBe(400);
      const problem = response.json();
      expect(problem.status).toBe(400);
    });

    it('POST /api/v1/auth/signin rejects missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signin',
        payload: {
          email: 'user@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toContain('application/problem+json');
    });

    it('POST /api/v1/auth/refresh rejects missing token when neither body nor cookie provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {},
      });

      expect(response.statusCode).toBe(401);
      const problem = response.json();
      expect(problem.code).toBe('MISSING_REFRESH_TOKEN');
    });

    it('POST /api/v1/auth/verify-email rejects short/invalid token format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: { token: 'short' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & ACCESS TOKEN PLUGIN
  // ==========================================
  describe('Fastify Auth Plugin & Token Guards', () => {
    it('GET /api/v1/auth/me returns 401 when no token is present', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      const problem = response.json();
      expect(problem.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/auth/me returns 401 when token is expired', async () => {
      const expiredToken = signAccessToken(
        {
          sub: 'usr_123',
          email: 'user@example.com',
          sessionId: 'ses_123',
          roles: ['LEARNER'],
          exp: Math.floor(Date.now() / 1000) - 60, // 1 min ago
        },
        testSecret,
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const problem = response.json();
      expect(problem.code).toBe('TOKEN_EXPIRED');
    });

    it('GET /api/v1/auth/me returns 401 when token is tampered', async () => {
      const validToken = signAccessToken(
        {
          sub: 'usr_123',
          email: 'user@example.com',
          sessionId: 'ses_123',
          roles: ['LEARNER'],
          exp: Math.floor(Date.now() / 1000) + 900,
        },
        testSecret,
      );

      const tamperedToken = validToken.substring(0, validToken.length - 5) + 'zzzzz';

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${tamperedToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const problem = response.json();
      expect(problem.code).toBe('INVALID_TOKEN');
    });

    it('reads authentication token from cc_access_token cookie when authorization header is absent', async () => {
      const validToken = signAccessToken(
        {
          sub: 'usr_123',
          email: 'user@example.com',
          sessionId: 'ses_123',
          roles: ['LEARNER'],
          exp: Math.floor(Date.now() / 1000) + 900,
        },
        testSecret,
      );

      // We expect the auth plugin to parse the cookie and proceed to the service
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        cookies: {
          cc_access_token: validToken,
        },
      });

      // Even if mock DB has no user usr_123, it got past auth token validation!
      expect([200, 404, 500]).toContain(response.statusCode);
      expect(response.statusCode).not.toBe(401);
    });
  });

  // ==========================================
  // 3. FINE-GRAINED RBAC & SCOPED PERMISSIONS
  // ==========================================
  describe('RBAC Permission Matrix & Scope Evaluation', () => {
    it('grants catalog and learning progress permissions to LEARNER', () => {
      expect(hasPermission('LEARNER', 'catalog:read')).toBe(true);
      expect(hasPermission('LEARNER', 'courses:read')).toBe(true);
      expect(hasPermission('LEARNER', 'progress:write')).toBe(true);
      expect(hasPermission('LEARNER', 'receipts:read')).toBe(true);
      expect(hasPermission('LEARNER', 'orders:create')).toBe(true);
    });

    it('strictly denies administrative and financial permissions to LEARNER', () => {
      expect(hasPermission('LEARNER', 'courses:create')).toBe(false);
      expect(hasPermission('LEARNER', 'courses:publish')).toBe(false);
      expect(hasPermission('LEARNER', 'refunds:create')).toBe(false);
      expect(hasPermission('LEARNER', 'users:manage')).toBe(false);
      expect(hasPermission('LEARNER', 'publisher:manage')).toBe(false);
    });

    it('grants content creation and curriculum management to INSTRUCTOR', () => {
      expect(hasPermission('INSTRUCTOR', 'courses:create')).toBe(true);
      expect(hasPermission('INSTRUCTOR', 'content:manage')).toBe(true);
      expect(hasPermission('INSTRUCTOR', 'refunds:create')).toBe(false);
    });

    it('grants publishing and staff management to ORGANIZATION_ADMIN', () => {
      expect(hasPermission('ORGANIZATION_ADMIN', 'courses:publish')).toBe(true);
      expect(hasPermission('ORGANIZATION_ADMIN', 'staff:invite')).toBe(true);
      expect(hasPermission('ORGANIZATION_ADMIN', 'refunds:create')).toBe(false);
    });

    it('grants refunds and revenue auditing to FINANCE_ADMIN', () => {
      expect(hasPermission('FINANCE_ADMIN', 'refunds:create')).toBe(true);
      expect(hasPermission('FINANCE_ADMIN', 'receipts:revoke')).toBe(true);
      expect(hasPermission('FINANCE_ADMIN', 'payouts:read')).toBe(true);
      expect(hasPermission('FINANCE_ADMIN', 'courses:create')).toBe(false);
    });

    it('SUPER_ADMIN bypasses all checks with global wildcard', () => {
      expect(hasPermission('SUPER_ADMIN', 'anything:at:all')).toBe(true);
      expect(hasPermission('SUPER_ADMIN', 'emergency:kill_switch')).toBe(true);
    });

    it('evaluates multi-role union memberships accurately', () => {
      const userRoles = ['LEARNER', 'INSTRUCTOR'];
      expect(hasAnyPermission(userRoles, 'progress:write')).toBe(true);
      expect(hasAnyPermission(userRoles, 'courses:create')).toBe(true);
      expect(hasAnyPermission(userRoles, 'refunds:create')).toBe(false);
    });
  });

  // ==========================================
  // 4. ARGON2ID PASSWORD SECURITY & TOKENS
  // ==========================================
  describe('Cryptographic Invariants & Argon2id Security', () => {
    it('hashes passwords using Argon2id parameters (m=65536, t=3, p=4)', async () => {
      const password = 'StrongCourseCity#2026';
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=4\$/);
      const isMatch = await verifyPassword(hash, password);
      expect(isMatch).toBe(true);

      const isMismatch = await verifyPassword(hash, 'WrongPassword#2026');
      expect(isMismatch).toBe(false);
    });

    it('generates 32-byte cryptographic entropy tokens and SHA-256 hashes', () => {
      const { plaintextToken, hashedToken } = generateSecureToken();
      expect(plaintextToken).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(hashedToken).toHaveLength(64); // SHA-256 = 64 hex characters
      expect(hashToken(plaintextToken)).toBe(hashedToken);
    });
  });

  // ==========================================
  // 5. REFRESH TOKEN ROTATION & REUSE DETECTION
  // ==========================================
  describe('Token Rotation & Reuse Detection Invariant', () => {
    it('detects refresh token reuse and immediately revokes entire user session family', async () => {
      // Create a mock DB that simulates a reused refresh token
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({
            id: 'tok_reused_123',
            user_id: 'usr_compromised_456',
            session_id: 'ses_789',
            token_hash: 'hash_123',
            revoked_at: new Date('2026-10-01T12:00:00Z'), // ALREADY REVOKED!
            expires_at: new Date(Date.now() + 1000000),
            sequence_number: 1,
          }),
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const authService = new AuthService(mockDb, testSecret);

      // Attempting to use the already revoked refresh token
      await expect(authService.refresh('some_replayed_token')).rejects.toThrow(
        AppError.unauthorized(
          'TOKEN_REUSE_DETECTED',
          'Security violation: Refresh token reuse detected. All active sessions have been terminated.',
        ),
      );

      // Invariant: Both refresh_tokens and sessions must have been updated to revoked!
      expect(mockDb.updateTable).toHaveBeenCalledWith('refresh_tokens');
      expect(mockDb.updateTable).toHaveBeenCalledWith('sessions');

      // Invariant: A security incident outbox event was recorded!
      expect(mockDb.insertInto).toHaveBeenCalledWith('outbox_events');
    });
  });
});
