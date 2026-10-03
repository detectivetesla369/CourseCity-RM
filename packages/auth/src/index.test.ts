import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  hasPermission,
  hasAnyPermission,
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
});
