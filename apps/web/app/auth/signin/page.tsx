'use client';

import { useState, useRef, useEffect, useCallback, Suspense, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, AuthDivider, AuthTerms } from '@/components/auth/AuthShell';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { FormField, Checkbox, SubmitButton, FormAlert } from '@/components/auth/FormControls';
import { validateEmail, validateExistingPassword, suggestEmail } from '@/components/auth/validation';
import { useAuth, ApiClientError } from '@/lib/auth-context';
import { useRedirectIfAuthenticated } from '@/lib/auth-guard';

type Field = 'email' | 'password';
type Errors = Partial<Record<Field, string | null>>;

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const { isLoading: authLoading } = useRedirectIfAuthenticated();

  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const suggestion = suggestEmail(email);

  /* Focus the first field on devices with a precise pointer (avoids popping the mobile keyboard). */
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) emailRef.current?.focus();
  }, []);

  const validators: Record<Field, (v: string) => string | null> = {
    email: validateEmail,
    password: validateExistingPassword,
  };

  /* "Reward early, punish late": validate on blur, but re-check on every keystroke once a field has an error. */
  const onBlur = (field: Field, value: string) => {
    if (!value) return; // don't scold an untouched, empty field on blur
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

    const next: Errors = { email: validateEmail(email), password: validateExistingPassword(password) };
    setErrors(next);

    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setSubmitting(true);
    setFormError(null);

    try {
      await signIn(email, password);
      const returnTo = searchParams.get('returnTo') || '/learn';
      router.push(returnTo);
    } catch (err) {
      if (err instanceof ApiClientError) {
        // Generic message: never reveal which of email/password was wrong
        if (err.problem.code === 'INVALID_CREDENTIALS') {
          setFormError('Incorrect email or password.');
        } else if (err.problem.code === 'ACCOUNT_INACTIVE') {
          setFormError('This account has been deactivated or suspended. Please contact support.');
        } else {
          setFormError(err.problem.detail || 'Something went wrong. Please try again.');
        }
      } else {
        setFormError('Unable to connect. Please check your internet connection and try again.');
      }
      setSubmitting(false);
    }
  };

  /* TODO(auth): replace with `signIn('google', { callbackUrl: '/' })`. */
  const handleGoogle = useCallback(() => {
    // Google OAuth not yet implemented
  }, []);

  return (
    <AuthShell>
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
        Welcome{' '}
        <span style={{ background: 'linear-gradient(135deg, #FF6400, #ff8a3d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          back
        </span>
      </h1>
      <p className="mt-2 text-base text-bottle/50">Sign in to continue your learning journey.</p>

      <div className="mt-8">
        <GoogleButton onSignIn={handleGoogle} />
      </div>

      <AuthDivider />

      <form action="javascript:void(0);" method="POST" onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

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
            ) : undefined
          }
        />

        <FormField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          inputRef={passwordRef}
          error={errors.password}
          onChange={(e) => onChange('password', e.target.value, setPassword)}
          onBlur={(e) => onBlur('password', e.target.value)}
          labelAside={
            <Link
              href={email ? `/auth/forgot-password?email=${encodeURIComponent(email)}` : '/auth/forgot-password'}
              className="text-xs font-semibold text-orange-ink hover:text-bottle"
            >
              Forgot password?
            </Link>
          }
        />

        <Checkbox checked={remember} onChange={setRemember}>
          Keep me signed in on this device
        </Checkbox>

        <SubmitButton loading={submitting} loadingText="Signing you in…">
          Sign in
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        New to CourseCity?{' '}
        <Link href="/auth/signup" className="font-bold text-bottle underline-offset-2 hover:text-orange-ink hover:underline">
          Create an account
        </Link>
      </p>

      <AuthTerms action="signing in" />
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
