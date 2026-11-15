'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { AuthShell, AuthDivider } from '@/components/auth/AuthShell';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { FormField, Checkbox, SubmitButton, FormAlert } from '@/components/auth/FormControls';
import {
  validateName,
  validateEmail,
  validateNewPassword,
  passwordChecks,
  passwordStrength,
  suggestEmail,
} from '@/components/auth/validation';
import { useAuth, ApiClientError } from '@/lib/auth-context';
import { useRedirectIfAuthenticated } from '@/lib/auth-guard';

type Field = 'name' | 'email' | 'password';
type Errors = Partial<Record<Field | 'terms', string | null>>;

const STRENGTH_COLORS = ['bg-bottle/10', 'bg-red-500', 'bg-orange', 'bg-salad', 'bg-bottle'] as const;

/** Live strength meter + requirements checklist under the password field. */
function PasswordGuide({ value }: { value: string }) {
  const { level, label } = passwordStrength(value);
  const checks = passwordChecks(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= level ? STRENGTH_COLORS[level] : 'bg-bottle/10'
              }`}
            />
          ))}
        </div>
        <span className="w-12 text-right text-xs font-semibold text-bottle" aria-live="polite">
          {label}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              c.met ? 'text-bottle' : 'text-muted'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                c.met ? 'bg-salad text-white' : 'bg-bottle/8'
              }`}
            >
              {c.met && <Check size={10} strokeWidth={3.5} />}
            </span>
            {c.label}
            <span className="sr-only">{c.met ? '(met)' : '(not met)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { isLoading: authLoading } = useRedirectIfAuthenticated();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const suggestion = suggestEmail(email);

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) nameRef.current?.focus();
  }, []);

  const validators: Record<Field, (v: string) => string | null> = {
    name: validateName,
    email: validateEmail,
    password: validateNewPassword,
  };

  const onBlur = (field: Field, value: string) => {
    if (!value) return;
    setErrors((e) => ({ ...e, [field]: validators[field](value) }));
  };

  const onChange = (field: Field, value: string, set: (v: string) => void) => {
    set(value);
    setFormError(null);
    if (errors[field]) setErrors((e) => ({ ...e, [field]: validators[field](value) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const next: Errors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
      terms: agreed ? null : 'Please accept the Terms and Privacy Policy to continue.',
    };
    setErrors(next);
    if (next.password) setShowGuide(true);

    // Move focus to the first problem so keyboard and screen-reader users land on it.
    if (next.name) return nameRef.current?.focus();
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();
    if (next.terms) return termsRef.current?.focus();

    setSubmitting(true);
    setFormError(null);

    try {
      await signUp({
        email,
        password,
        displayName: name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });
      // Redirect to verify-email page (no token = "check your inbox" state)
      router.push('/auth/verify-email');
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.problem.code === 'CONFLICT' || err.problem.status === 409) {
          setErrors({ email: 'An account with this email already exists.' });
          emailRef.current?.focus();
        } else {
          setFormError(err.problem.detail || 'Something went wrong. Please try again.');
        }
      } else {
        setFormError('Unable to connect. Please check your internet connection and try again.');
      }
      setSubmitting(false);
    }
  };

  /* TODO(auth): replace with `signIn('google', { callbackUrl: '/onboarding' })`. */
  const handleGoogle = useCallback(() => {
    // Google OAuth not yet implemented
  }, []);

  return (
    <AuthShell>
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
        Create your{' '}
        <span style={{ background: 'linear-gradient(135deg, #FF6400, #ff8a3d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          account
        </span>
      </h1>
      <p className="mt-2 text-base text-bottle/50">Start learning in under a minute — it&apos;s free to join.</p>

      <div className="mt-8">
        <GoogleButton onSignIn={handleGoogle} />
      </div>

      <AuthDivider label="or sign up with email" />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <FormField
          label="Full name"
          name="name"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Ada Lovelace"
          value={name}
          inputRef={nameRef}
          error={errors.name}
          onChange={(e) => onChange('name', e.target.value, setName)}
          onBlur={(e) => onBlur('name', e.target.value)}
        />

        <FormField
          label="Email address"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
          value={email}
          inputRef={emailRef}
          error={errors.email}
          onChange={(e) => onChange('email', e.target.value, setEmail)}
          onBlur={(e) => onBlur('email', e.target.value)}
          hint={
            suggestion ? (
              <span>
                Did you mean{' '}
                <button
                  type="button"
                  onClick={() => {
                    setEmail(suggestion);
                    setErrors((er) => ({ ...er, email: null }));
                  }}
                  className="font-semibold text-bottle underline underline-offset-2 hover:text-orange-ink"
                >
                  {suggestion}
                </button>
                ?
              </span>
            ) : (
              'We’ll send your receipts and certificates here.'
            )
          }
        />

        <div>
          <FormField
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            inputRef={passwordRef}
            error={errors.password}
            onFocus={() => setShowGuide(true)}
            onChange={(e) => onChange('password', e.target.value, setPassword)}
            onBlur={(e) => onBlur('password', e.target.value)}
          />
          {(showGuide || password) && (
            <div className="mt-3 animate-[fade-in_0.3s_ease-out_both]">
              <PasswordGuide value={password} />
            </div>
          )}
        </div>

        <Checkbox
          checked={agreed}
          inputRef={termsRef}
          error={errors.terms}
          onChange={(v) => {
            setAgreed(v);
            if (v) setErrors((e) => ({ ...e, terms: null }));
          }}
        >
          I agree to CourseCity&apos;s{' '}
          <a href="#" className="font-semibold text-bottle underline underline-offset-2 hover:text-orange-ink">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-semibold text-bottle underline underline-offset-2 hover:text-orange-ink">
            Privacy Policy
          </a>
          .
        </Checkbox>

        <SubmitButton loading={submitting} loadingText="Creating your account…">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-bold text-bottle underline-offset-2 hover:text-orange-ink hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
