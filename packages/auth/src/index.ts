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

// ==========================================
// 4. ACCESS TOKEN (JWT HS256) HELPERS
// ==========================================
export interface AccessTokenPayload {
  sub: string;
  email: string;
  sessionId: string;
  roles: string[];
  exp: number; // in seconds
  iat?: number;
}

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str, 'utf8') : str;
  return buf.toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function signAccessToken(payload: AccessTokenPayload, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iat: now,
    ...payload,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${data}.${encodedSignature}`;
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Malformed token');
  }
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest();
  const actualSignature = Buffer.from(encodedSignature, 'base64url');

  if (
    expectedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error('Invalid token signature');
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader));
  if (header.alg !== 'HS256') {
    throw new Error('Unsupported algorithm');
  }

  const payload: AccessTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
}

