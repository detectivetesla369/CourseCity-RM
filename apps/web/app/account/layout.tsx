'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth-guard';
import { AppShell } from '@/components/app-shell';

const tabs = [
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/security', label: 'Security', icon: Shield },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-egg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-orange/20 border-t-orange" />
          <p className="text-sm font-medium text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell requireAuth>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <p className="eyebrow mb-1">Account</p>
          <h1 className="text-2xl font-extrabold text-bottle md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            Settings
          </h1>
        </div>

        {/* Tab navigation */}
        <div className="mb-8 flex items-center gap-1">
          {tabs.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-bottle text-egg' : 'text-muted hover:bg-white hover:text-bottle'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </AppShell>
  );
}
