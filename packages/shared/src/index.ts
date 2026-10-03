import crypto from 'node:crypto';

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS)
 * Recursively orders object keys lexicographically and produces deterministic JSON string.
 */
export function canonicalJson(data: unknown): string {
  if (data === null || typeof data !== 'object') {
    return JSON.stringify(data);
  }

  if (Array.isArray(data)) {
    return '[' + data.map(canonicalJson).join(',') + ']';
  }

  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries: string[] = [];

  for (const key of keys) {
    if (obj[key] !== undefined) {
      entries.push(`${JSON.stringify(key)}:${canonicalJson(obj[key])}`);
    }
  }

  return '{' + entries.join(',') + '}';
}

/**
 * Computes hexadecimal SHA-256 hash
 */
export function sha256(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Formats minor currency units into human-readable currency strings
 * e.g. (15000, "GHS") -> "GHS 150.00"
 */
export function formatMinorUnits(minorUnits: number | bigint, currency = 'GHS'): string {
  const units = Number(minorUnits) / 100;
  return `${currency} ${units.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generates structured, high-entropy business identifiers
 * Format: CC-<PREFIX>-YYYYMMDD-<6_ALPHANUMERIC>
 */
export function generateBusinessReference(prefix: 'ORD' | 'PAY' | 'RCP' | 'CERT'): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Crockford-style without confusing chars (0, O, 1, I)
  const randomBytes = crypto.randomBytes(6);
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    const byte = randomBytes[i] ?? 0;
    randomCode += chars[byte % chars.length];
  }

  return `CC-${prefix}-${dateStr}-${randomCode}`;
}

/**
 * Masks customer name for public verification privacy (e.g. "John Doe" -> "J*** D**")
 */
export function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 3));
    })
    .join(' ');
}

/**
 * Masks email address for public verification privacy (e.g. "john.doe@example.com" -> "j***e@example.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = email.split('@') as [string, string];
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Signs data using Ed25519 asymmetric cryptography
 */
export function signEd25519(payload: string, privateKeyPem: string): string {
  const signature = crypto.sign(null, Buffer.from(payload, 'utf8'), privateKeyPem);
  return signature.toString('base64url');
}

/**
 * Verifies Ed25519 asymmetric signature
 */
export function verifyEd25519(
  payload: string,
  signatureBase64Url: string,
  publicKeyPem: string,
): boolean {
  try {
    const signatureBuffer = Buffer.from(signatureBase64Url, 'base64url');
    return crypto.verify(null, Buffer.from(payload, 'utf8'), publicKeyPem, signatureBuffer);
  } catch {
    return false;
  }
}
