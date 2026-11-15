'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { FormField, SubmitButton, FormAlert } from '@/components/auth/FormControls';
import { validateNewPassword } from '@/components/auth/validation';
import { useAuth, ApiClientError } from '@/lib/auth-context';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { api } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) passwordRef.current?.focus();
  }, []);

  if (!token) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-bottle">Invalid reset link</h1>
          <p className="mt-2 text-sm text-muted">This password reset link is invalid or has expired.</p>
          <Link href="/auth/forgot-password" className="btn btn-primary mt-8 gap-2">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-salad/10">
            <CheckCircle2 size={32} className="text-salad" />
          </div>
          <h1 className="text-2xl font-extrabold text-bottle">Password reset!</h1>
          <p className="mt-2 text-sm text-muted">Your password has been updated successfully.</p>
          <Link href="/auth/signin" className="btn btn-primary mt-8 gap-2">
            Sign in with new password
          </Link>
        </div>
      </AuthShell>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const pwError = validateNewPassword(password);
    const confirmError = password !== confirmPassword ? 'Passwords do not match.' : null;
    setErrors({ password: pwError, confirm: confirmError });

    if (pwError) return passwordRef.current?.focus();
    if (confirmError) return confirmRef.current?.focus();

    setSubmitting(true);
    setFormError(null);

    try {
      await api.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.problem.detail || 'Password reset failed. The link may have expired.');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <Link href="/auth/signin" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted hover:text-bottle transition-colors">
        <ArrowLeft size={16} />
        Back to sign in
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
        Set a new{' '}
        <span style={{ background: 'linear-gradient(135deg, #FF6400, #ff8a3d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          password
        </span>
      </h1>
      <p className="mt-2 text-base text-bottle/50">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <FormField
          label="New password"
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          value={password}
          inputRef={passwordRef}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFormError(null);
            if (errors.password) setErrors((prev) => ({ ...prev, password: validateNewPassword(e.target.value) }));
          }}
          onBlur={(e) => {
            if (e.target.value) setErrors((prev) => ({ ...prev, password: validateNewPassword(e.target.value) }));
          }}
        />

        <FormField
          label="Confirm password"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          inputRef={confirmRef}
          error={errors.confirm}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirm && e.target.value === password) setErrors((prev) => ({ ...prev, confirm: null }));
          }}
          onBlur={(e) => {
            if (e.target.value && e.target.value !== password) {
              setErrors((prev) => ({ ...prev, confirm: 'Passwords do not match.' }));
            }
          }}
        />

        <SubmitButton loading={submitting} loadingText="Resetting password…">
          Reset password
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
