'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  MessageCircle,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/* ── Dynamic sidebar content ── */
import DashboardSidebar from '@/components/learn/sidebars/DashboardSidebar';
import CoursesCatalogSidebar from '@/components/learn/sidebars/CoursesCatalogSidebar';
import EbookSidebar from '@/components/learn/sidebars/EbookSidebar';
import VideoCourseSidebar from '@/components/learn/sidebars/VideoCourseSidebar';
import LiveSessionSidebar from '@/components/learn/sidebars/LiveSessionSidebar';
import CourseDetailSidebar from '@/components/learn/sidebars/CourseDetailSidebar';

/* ------------------------------------------------------------------ */
/*  Navigation — 4 items only (Hick's Law)                             */
/* ------------------------------------------------------------------ */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const navItems: NavItem[] = [
  { href: '/learn', label: 'Home', icon: Home },
  { href: '/courses', label: 'Courses', icon: Compass },
  { href: '/learn/notifications', label: 'Messages', icon: MessageCircle },
  { href: '/account/profile', label: 'Settings', icon: Settings },
];

function isNavActive(href: string, pathname: string): boolean {
  if (href === '/learn') return pathname === '/learn';
  if (href === '/courses') return pathname.startsWith('/courses');
  if (href === '/learn/notifications') return pathname === '/learn/notifications';
  if (href === '/account/profile') return pathname.startsWith('/account');
  return pathname.startsWith(href);
}

/* ------------------------------------------------------------------ */
/*  Desktop Sidebar — thin icon strip, full height, anchored left      */
/*  Modeled after reference image 1 (travel dashboard sidebar)         */
/* ------------------------------------------------------------------ */
function DesktopSidebar({
  pathname,
  initials,
  isAuthenticated,
  signOut,
}: {
  pathname: string;
  initials: string;
  isAuthenticated: boolean;
  signOut: () => void;
}) {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[72px] flex-col items-center bg-white py-6">
      {/* ── Brand logo ── */}
      <Link href="/" className="mb-10" title="CourseCity">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary-500 transition-transform duration-100 hover:scale-105">
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6c1.1 0 2.13-.3 3.01-.82"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </Link>

      {/* ── Nav icons ── */}
      <nav className="flex flex-col items-center gap-3" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-[14px] transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:bg-white hover:text-neutral-600'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.8} />
              {/* Tooltip on hover */}
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-[8px] bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Bottom: user avatar + sign-out ── */}
      <div className="flex flex-col items-center gap-3">
        {isAuthenticated ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-[12px] font-bold text-primary-700">
              {initials}
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] text-neutral-400 transition-colors duration-100 hover:bg-white hover:text-error"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <LogOut size={18} strokeWidth={1.8} />
            </button>
          </>
        ) : (
          <Link
            href="/auth/signin"
            title="Sign in"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary-500 text-white transition-opacity duration-100 hover:opacity-90"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <LogOut size={18} strokeWidth={1.8} />
          </Link>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Bottom Tab Bar — 44px+ touch targets                         */
/* ------------------------------------------------------------------ */
function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-neutral-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden"
      aria-label="Mobile navigation"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isNavActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 rounded-[8px] px-4 py-2 text-[11px] font-medium transition-colors duration-100 ${
              active ? 'text-primary-500' : 'text-neutral-400'
            }`}
            style={{ minHeight: '44px', minWidth: '44px' }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Slide-Out Menu                                               */
/* ------------------------------------------------------------------ */
function MobileMenu({
  isOpen,
  onClose,
  pathname,
  displayName,
  initials,
  isAuthenticated,
  signOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  displayName: string;
  initials: string;
  isAuthenticated: boolean;
  signOut: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-5 shadow-lg lg:hidden">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6c1.1 0 2.13-.3 3.01-.82" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[14px] font-bold text-neutral-800">
              Course<span className="text-primary-500">City</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-neutral-400 hover:text-neutral-800"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-[12px] px-3 py-3 text-[14px] font-medium transition-colors duration-100 ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                }`}
                style={{ minHeight: '44px' }}
              >
                <Icon size={18} strokeWidth={1.8} className={active ? 'text-primary-500' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User — pushed to bottom */}
        <div className="mt-auto pt-8">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 rounded-[12px] bg-neutral-50 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[13px] font-bold text-primary-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-neutral-800">{displayName}</p>
                <p className="truncate text-[11px] text-neutral-500">{`@${displayName.toLowerCase().replace(/\s/g, '')}`}</p>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              onClick={onClose}
              className="btn btn-primary w-full text-[13px]"
            >
              Sign in
            </Link>
          )}
          {isAuthenticated && (
            <button
              onClick={() => { signOut(); onClose(); }}
              className="mt-2 flex w-full items-center gap-2 rounded-[8px] px-3 py-3 text-[13px] font-medium text-neutral-500 hover:bg-error-light hover:text-error"
              style={{ minHeight: '44px' }}
            >
              <LogOut size={16} strokeWidth={1.8} />
              Sign out
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop Right Sidebar — DYNAMIC contextual panel                   */
/*  Content changes based on the current route                         */
/* ------------------------------------------------------------------ */
function getSidebarContent(pathname: string): React.ReactNode {
  // E-Book reader
  if (pathname.includes('/ebook')) return <EbookSidebar />;
  // Live session
  if (pathname.includes('/live')) return <LiveSessionSidebar />;
  // Video course (learn/courses/[id] but NOT ebook or live)
  if (/^\/learn\/courses\/[^/]+$/.test(pathname)) return <VideoCourseSidebar />;
  // Course detail page (/courses/[slug])
  if (/^\/courses\/[^/]+$/.test(pathname)) return <CourseDetailSidebar />;
  // Courses catalog
  if (pathname === '/courses') return <CoursesCatalogSidebar />;
  // Dashboard / default
  return <DashboardSidebar />;
}

function DesktopRightSidebar({
  displayName,
  initials,
  pathname,
}: {
  displayName: string;
  initials: string;
  pathname: string;
}) {
  return (
    <aside className="hidden xl:flex fixed inset-y-0 right-0 z-20 w-[272px] flex-col gap-4 overflow-y-auto border-l border-neutral-200 bg-white/60 p-4 backdrop-blur-sm">
      {/* ── Dynamic content based on route ── */}
      {getSidebarContent(pathname)}

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── User card at bottom (always visible) ── */}
      <div className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white">
          {initials}
        </div>
        <p className="truncate text-[13px] font-medium text-neutral-800">{displayName}</p>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Main App Shell                                                      */
/* ------------------------------------------------------------------ */
export function AppShell({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const pathname = usePathname();
  const { user, signOut, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName =
    ((user as unknown as Record<string, unknown>)?.displayName as string) ||
    user?.email ||
    'Learner';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* ── Mobile top bar ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-neutral-100 px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6c1.1 0 2.13-.3 3.01-.82" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[14px] font-bold text-neutral-800">
            Course<span className="text-primary-500">City</span>
          </span>
        </Link>
        <button
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-[8px] text-neutral-500 hover:bg-white"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Mobile slide-out ── */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
        displayName={displayName}
        initials={initials}
        isAuthenticated={isAuthenticated}
        signOut={signOut}
      />

      {/* ── Desktop sidebar (fixed, full height) ── */}
      <DesktopSidebar
        pathname={pathname}
        initials={initials}
        isAuthenticated={isAuthenticated}
        signOut={signOut}
      />

      {/* ── Desktop right sidebar ── */}
      <DesktopRightSidebar displayName={displayName} initials={initials} pathname={pathname} />

      {/* ── Main content — offset by both sidebars on desktop ── */}
      <div className="lg:ml-[72px] xl:mr-[272px]">
        <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-4 sm:px-6 lg:pb-8 lg:pt-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <MobileTabBar pathname={pathname} />
    </div>
  );
}
