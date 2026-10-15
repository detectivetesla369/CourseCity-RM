import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  hasPermission,
  hasAnyPermission,
  signAccessToken,
  verifyAccessToken,
} from './index.js';

describe('Auth Security Test Suite', () => {
  it('hashes and successfully verifies password using Argon2id', async () => {
    const password = 'StrongPassword2026!';
    const hash = await hashPassword(password);

    expect(hash).toContain('$argon2id$');
    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);

    const isWrongValid = await verifyPassword(hash, 'WrongPassword');
    expect(isWrongValid).toBe(false);
  });

  it('generates secure tokens and validates matching hashes', () => {
    const { plaintextToken, hashedToken } = generateSecureToken();
    expect(plaintextToken).toHaveLength(64);
    expect(hashedToken).toHaveLength(64);
    expect(hashToken(plaintextToken)).toBe(hashedToken);
  });

  it('enforces RBAC permissions and SuperAdmin wildcards', () => {
    expect(hasPermission('LEARNER', 'courses:read')).toBe(true);
    expect(hasPermission('LEARNER', 'refunds:create')).toBe(false);
    expect(hasPermission('FINANCE_ADMIN', 'refunds:create')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'any:arbitrary:permission')).toBe(true);
    expect(hasAnyPermission(['LEARNER', 'INSTRUCTOR'], 'courses:create')).toBe(true);
  });

  it('signs and verifies access tokens (JWT HS256) and rejects tampering', () => {
    const secret = 'super-secret-key-for-test-32bytes-minimum!';
    const payload = {
      sub: 'usr_12345678',
      email: 'user@example.com',
      sessionId: 'ses_12345678',
      roles: ['LEARNER'],
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    const token = signAccessToken(payload, secret);
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token, secret);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.roles).toEqual(['LEARNER']);

    // Rejects wrong secret
    expect(() => verifyAccessToken(token, 'wrong-secret-key-12345678901234')).toThrow();

    // Rejects expired token
    const expiredToken = signAccessToken(
      { ...payload, exp: Math.floor(Date.now() / 1000) - 10 },
      secret,
    );
    expect(() => verifyAccessToken(expiredToken, secret)).toThrow('Token expired');

    // Rejects tampered token
    const tamperedToken = token.substring(0, token.length - 4) + 'abcd';
    expect(() => verifyAccessToken(tamperedToken, secret)).toThrow();
  });
});

