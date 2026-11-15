'use client';

import { useState, useRef, useEffect, Suspense, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { FormField, SubmitButton, FormAlert } from '@/components/auth/FormControls';
import { validateEmail } from '@/components/auth/validation';
import { useAuth, ApiClientError } from '@/lib/auth-context';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const { api } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return emailRef.current?.focus();

    setSubmitting(true);
    setFormError(null);

    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      // Always show success to avoid revealing whether the email exists
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-salad/10">
            <Mail size={32} className="text-bottle" />
          </div>
          <h1 className="text-2xl font-extrabold text-bottle">Check your email</h1>
          <p className="mt-2 max-w-xs text-sm text-muted leading-relaxed">
            If an account exists for <strong className="text-bottle">{email}</strong>, you&apos;ll receive a password reset link shortly.
          </p>
          <Link href="/auth/signin" className="btn btn-primary mt-8 gap-2">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Link href="/auth/signin" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted hover:text-bottle transition-colors">
        <ArrowLeft size={16} />
        Back to sign in
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
        Forgot your{' '}
        <span style={{ background: 'linear-gradient(135deg, #FF6400, #ff8a3d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          password?
        </span>
      </h1>
      <p className="mt-2 text-base text-bottle/50">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
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
          error={error}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError(null);
            if (error) setError(validateEmail(e.target.value));
          }}
          onBlur={(e) => {
            if (e.target.value) setError(validateEmail(e.target.value));
          }}
        />

        <SubmitButton loading={submitting} loadingText="Sending reset link…">
          Send reset link
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
