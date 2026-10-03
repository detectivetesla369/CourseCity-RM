import { describe, it, expect } from 'vitest';
import {
  signupInputSchema,
  receiptVerificationParamsSchema,
  catalogFilterQuerySchema,
} from './index.js';

describe('Validation Schemas Test Suite', () => {
  it('validates robust password in signup schema', () => {
    const validData = {
      email: 'learner@coursecity.com',
      password: 'SecurePassword123!',
      displayName: 'Jane Doe',
    };
    expect(signupInputSchema.safeParse(validData).success).toBe(true);

    const weakPasswordData = {
      email: 'learner@coursecity.com',
      password: 'password', // Missing uppercase, digit, symbol, too short
      displayName: 'Jane Doe',
    };
    expect(signupInputSchema.safeParse(weakPasswordData).success).toBe(false);
  });

  it('validates receipt reference format in verification params', () => {
    const valid = { receiptReference: 'CC-RCP-20261003-8K9F2M' };
    expect(receiptVerificationParamsSchema.safeParse(valid).success).toBe(true);

    const invalid = { receiptReference: 'INVALID-REFERENCE' };
    expect(receiptVerificationParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('applies defaults to catalog filter queries', () => {
    const result = catalogFilterQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sort).toBe('newest');
  });
});
