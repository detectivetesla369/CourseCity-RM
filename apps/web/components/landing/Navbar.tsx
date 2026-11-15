'use client';

import { useRef, useState, useCallback } from 'react';
import { useMotion, gsap, ScrollTrigger } from '@/lib/motion';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Courses', href: '#courses' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
] as const;

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotion(navRef, () => {
    const el = navRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      start: 80,
      end: 99999,
      onToggle: (self: { isActive: boolean }) => setScrolled(self.isActive),
    });
    return () => trigger.kill();
  });

  const toggle = useCallback(() => setMobileOpen((o) => !o), []);

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled
            ? 'bg-egg/95 backdrop-blur-md shadow-lift-sm border-b border-bottle/5'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8 lg:px-12">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-lg transition-colors duration-500 ${
                scrolled
                  ? 'bg-orange text-bottle'
                  : 'bg-egg/20 text-egg'
              }`}
            >
              CC
            </div>
            <span
              className={`text-lg font-bold tracking-tight transition-colors duration-500 ${
                scrolled ? 'text-bottle' : 'text-egg'
              }`}
            >
              CourseCity
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`relative text-sm font-semibold transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full ${
                  scrolled
                    ? 'text-bottle/70 hover:text-bottle'
                    : 'text-egg/80 hover:text-egg'
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/auth/signin"
              className={`btn btn-sm transition-colors duration-500 ${
                scrolled
                  ? 'btn-ghost text-bottle'
                  : 'btn-ghost text-egg'
              }`}
            >
              Sign In
            </a>
            <a
              href="/auth/signup"
              className={`btn btn-sm ${
                scrolled ? 'btn-primary' : 'btn-light'
              }`}
            >
              Get Started
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={toggle}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className={`flex h-10 w-10 items-center justify-center rounded-xl md:hidden transition-colors ${
              scrolled ? 'text-bottle' : 'text-egg'
            }`}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[49] flex flex-col bg-bottle pt-16 md:hidden">
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={toggle}
                className="text-3xl font-bold tracking-tight text-egg transition-opacity hover:opacity-80"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-8 flex flex-col gap-4">
              <a href="/auth/signin" className="btn btn-ghost text-egg">
                Sign In
              </a>
              <a href="/auth/signup" className="btn btn-light">
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
