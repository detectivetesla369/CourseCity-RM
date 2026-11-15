'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

/**
 * Client-side route guard hook.
 * Redirects to sign-in if not authenticated once loading completes.
 * NOTE: This is a UX convenience, not a security boundary.
 * All protected data is gated server-side by API authorization.
 */
export function useRequireAuth(redirectTo = '/auth/signin') {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`${redirectTo}?returnTo=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading, isAuthenticated };
}

/**
 * Redirect away from auth pages if already signed in.
 */
export function useRedirectIfAuthenticated(redirectTo = '/learn') {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading, isAuthenticated };
}
