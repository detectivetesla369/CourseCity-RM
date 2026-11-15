'use client';

import { ArrowUpRight } from 'lucide-react';

const LINK_GROUPS = [
  {
    title: 'Platform',
    links: ['Courses', 'Categories', 'Teachers', 'Verify'],
  },
  {
    title: 'Learn',
    links: ['How It Works', 'Reading Experience', 'Assessments', 'Certificates'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  },
] as const;

export function Footer() {
  return (
    <footer className="on-dark bg-bottle">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20 lg:px-12">
        {/* Top row */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange text-bottle font-bold text-lg">
              CC
            </div>
            <span className="text-lg font-bold text-egg tracking-tight">
              CourseCity
            </span>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            {['Twitter', 'GitHub', 'LinkedIn'].map((s) => (
              <a
                key={s}
                href="#"
                className="flex items-center gap-1 text-sm text-egg/60 transition-colors hover:text-egg"
              >
                {s} <ArrowUpRight size={12} />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-bottle-soft" />

        {/* Link grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-egg/40">
                {group.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-egg/60 transition-colors hover:text-egg"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-bottle-soft pt-8 text-xs text-egg/40 md:flex-row">
          <p>© 2026 CourseCity. All rights reserved.</p>
          <p>Made for learners, built for trust.</p>
        </div>
      </div>
    </footer>
  );
}
