import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  canonicalJson,
  sha256,
  formatMinorUnits,
  generateBusinessReference,
  maskName,
  maskEmail,
  signEd25519,
  verifyEd25519,
} from './index.js';

describe('Shared Utilities Test Suite', () => {
  it('canonicalJson produces deterministic sorted key JSON', () => {
    const objA = { z: 1, a: 2, m: { y: 'nested', b: 'first' } };
    const objB = { a: 2, m: { b: 'first', y: 'nested' }, z: 1 };

    const canonicalA = canonicalJson(objA);
    const canonicalB = canonicalJson(objB);

    expect(canonicalA).toBe(canonicalB);
    expect(canonicalA).toBe('{"a":2,"m":{"b":"first","y":"nested"},"z":1}');
  });

  it('sha256 computes expected hash', () => {
    const hash = sha256('CourseCity');
    expect(hash).toHaveLength(64);
  });

  it('formatMinorUnits formats pesewas and cents correctly', () => {
    expect(formatMinorUnits(15000, 'GHS')).toBe('GHS 150.00');
    expect(formatMinorUnits(2550, 'USD')).toBe('USD 25.50');
  });

  it('generateBusinessReference generates formatted identifiers', () => {
    const ref = generateBusinessReference('RCP');
    expect(ref).toMatch(/^CC-RCP-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  });

  it('maskName and maskEmail protect PII', () => {
    expect(maskName('Kofi Mensah')).toBe('K*** M***');
    expect(maskEmail('kofi.mensah@example.com')).toBe('k***h@example.com');
  });

  it('signEd25519 and verifyEd25519 sign and verify accurately', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const payload = 'CourseCity Canonical Payload Data';
    const signature = signEd25519(payload, privateKey);
    const isValid = verifyEd25519(payload, signature, publicKey);
    expect(isValid).toBe(true);

    const isTamperedValid = verifyEd25519(payload + 'TAMPERED', signature, publicKey);
    expect(isTamperedValid).toBe(false);
  });
});
