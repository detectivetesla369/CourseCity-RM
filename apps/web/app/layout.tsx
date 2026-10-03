import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CourseCity — Authoritative Learning Platform & Course Marketplace',
  description:
    'CourseCity 1.0 is an enterprise-grade learning platform providing verified courses, interactive tutorial reading, and cryptographically verifiable receipts and certificates.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FFFCF8] text-[#17130F]">{children}</body>
    </html>
  );
}
