/**
 * Client-side validation for the auth forms.
 * These give fast feedback only — the server must re-validate everything.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Please enter your name.';
  if (v.length < 2) return 'Name should be at least 2 characters.';
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Please enter your email address.';
  if (!EMAIL_RE.test(v)) return 'That doesn’t look like a valid email — check for typos.';
  return null;
}

/** Sign-in: we only check presence — never hint at the password rules of an existing account. */
export function validateExistingPassword(value: string): string | null {
  if (!value) return 'Please enter your password.';
  return null;
}

export interface PasswordCheck {
  id: string;
  label: string;
  met: boolean;
}

export function passwordChecks(value: string): PasswordCheck[] {
  return [
    { id: 'length', label: 'At least 8 characters', met: value.length >= 8 },
    { id: 'letter', label: 'One letter', met: /[A-Za-z]/.test(value) },
    { id: 'number', label: 'One number', met: /\d/.test(value) },
    { id: 'symbol', label: 'One symbol (optional, but stronger)', met: /[^A-Za-z0-9]/.test(value) },
  ];
}

/** Required checks are length + letter + number; symbol only boosts strength. */
export function validateNewPassword(value: string): string | null {
  if (!value) return 'Please create a password.';
  const [length, letter, number] = passwordChecks(value);
  if (!length!.met) return 'Use at least 8 characters.';
  if (!letter!.met || !number!.met) return 'Include at least one letter and one number.';
  return null;
}

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export function passwordStrength(value: string): { level: StrengthLevel; label: string } {
  if (!value) return { level: 0, label: '' };
  let score = passwordChecks(value).filter((c) => c.met).length;
  if (value.length >= 12) score += 1;
  const level = Math.min(4, Math.max(1, score - 1)) as StrengthLevel;
  const labels: Record<StrengthLevel, string> = { 0: '', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
  return { level, label: labels[level] };
}

/** Catch the most common domain typos and offer a one-tap fix. */
const DOMAIN_FIXES: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'icloud.co': 'icloud.com',
};

export function suggestEmail(value: string): string | null {
  const at = value.lastIndexOf('@');
  if (at < 1) return null;
  const domain = value.slice(at + 1).toLowerCase().trim();
  const fix = DOMAIN_FIXES[domain];
  return fix ? `${value.slice(0, at)}@${fix}` : null;
}
