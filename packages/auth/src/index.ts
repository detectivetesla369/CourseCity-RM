import argon2 from 'argon2';
import crypto from 'node:crypto';
import { sha256 } from '@coursecity/shared';

// ==========================================
// 1. ARGON2ID PASSWORD SECURITY
// ==========================================
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 threads
  });
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

// ==========================================
// 2. HIGH-ENTROPY TOKEN UTILITIES
// ==========================================
export interface GeneratedTokenPair {
  plaintextToken: string;
  hashedToken: string;
}

export function generateSecureToken(): GeneratedTokenPair {
  const plaintextToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = sha256(plaintextToken);
  return { plaintextToken, hashedToken };
}

export function hashToken(token: string): string {
  return sha256(token);
}

// ==========================================
// 3. FINE-GRAINED PERMISSION MATRIX
// ==========================================
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  LEARNER: [
    'catalog:read',
    'courses:read',
    'profile:read',
    'profile:write',
    'enrollments:read',
    'progress:read',
    'progress:write',
    'bookmarks:read',
    'bookmarks:write',
    'notes:read',
    'notes:write',
    'assessments:read',
    'assessments:attempt',
    'assignments:read',
    'assignments:submit',
    'examinations:read',
    'examinations:attempt',
    'grades:read',
    'certificates:read',
    'receipts:read',
    'receipts:verify',
    'orders:create',
    'orders:read',
    'payments:read',
  ],
  INSTRUCTOR: [
    'publisher:read',
    'courses:read',
    'courses:create',
    'courses:update',
    'content:manage',
    'assessments:manage',
    'learners:read',
  ],
  ORGANIZATION_ADMIN: [
    'publisher:read',
    'publisher:manage',
    'courses:read',
    'courses:create',
    'courses:update',
    'courses:publish',
    'content:manage',
    'assessments:manage',
    'learners:read',
    'analytics:read',
    'staff:invite',
    'staff:remove',
  ],
  ADMIN: [
    'users:read',
    'users:manage',
    'courses:read',
    'courses:manage',
    'publishers:read',
    'orders:read',
    'payments:read',
    'reports:read',
    'receipts:verify',
  ],
  FINANCE_ADMIN: [
    'finance:read',
    'payments:read',
    'orders:read',
    'refunds:create',
    'receipts:verify',
    'receipts:revoke',
    'payouts:read',
  ],
  SUPER_ADMIN: [
    '*', // Global wildcard permission
  ],
};

export function hasPermission(roleName: string, requiredPermission: string): boolean {
  if (roleName === 'SUPER_ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[roleName];
  if (!permissions) return false;
  return permissions.includes(requiredPermission) || permissions.includes('*');
}

export function hasAnyPermission(roles: string[], requiredPermission: string): boolean {
  return roles.some((role) => hasPermission(role, requiredPermission));
}
