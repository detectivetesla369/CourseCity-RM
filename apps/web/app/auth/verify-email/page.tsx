'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth, ApiClientError } from '@/lib/auth-context';

type VerifyState = 'loading' | 'success' | 'error' | 'no-token';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { api } = useAuth();

  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'no-token');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    api
      .verifyEmail({ token })
      .then((res) => {
        setState('success');
        setMessage(res.message || 'Your email has been verified.');
      })
      .catch((err) => {
        setState('error');
        if (err instanceof ApiClientError) {
          setMessage(err.problem.detail || 'Verification failed. The link may have expired.');
        } else {
          setMessage('Something went wrong. Please try again.');
        }
      });
  }, [token, api]);

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        {state === 'loading' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange/8">
              <Loader2 size={32} className="animate-spin text-orange" />
            </div>
            <h1 className="text-2xl font-extrabold text-bottle">Verifying your email…</h1>
            <p className="mt-2 text-sm text-muted">This will only take a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-salad/10">
              <CheckCircle2 size={32} className="text-salad" />
            </div>
            <h1 className="text-2xl font-extrabold text-bottle">Email verified!</h1>
            <p className="mt-2 text-sm text-muted">{message}</p>
            <Link href="/auth/signin" className="btn btn-primary mt-8 gap-2">
              Sign in to start learning
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-bottle">Verification failed</h1>
            <p className="mt-2 text-sm text-muted">{message}</p>
            <Link href="/auth/signin" className="btn btn-primary mt-8 gap-2">
              Go to sign in
            </Link>
          </>
        )}

        {state === 'no-token' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-wash">
              <Mail size={32} className="text-blue" />
            </div>
            <h1 className="text-2xl font-extrabold text-bottle">Check your email</h1>
            <p className="mt-2 max-w-xs text-sm text-muted leading-relaxed">
              We&apos;ve sent you a verification link. Click the link in your email to activate your account.
            </p>
            <Link href="/auth/signin" className="btn btn-ghost mt-8 !border-bottle/15 text-sm gap-2">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
