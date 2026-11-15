'use client';

import { type ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { useRequireAuth } from '@/lib/auth-guard';

export default function LearnLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-egg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-orange/20 border-t-orange" />
          <p className="text-sm font-medium text-muted">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell requireAuth>
      {children}
    </AppShell>
  );
}
