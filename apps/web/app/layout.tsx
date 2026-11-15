import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ScrollProgress, ScrollFX } from '@/components/motion/ScrollEffects';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CourseCity — A Learning City for Curious People',
  description:
    'Structured courses, expert instructors, and credentials that prove it — all in one place. CourseCity is an authoritative learning platform with cryptographically verifiable credentials.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FF6400',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakartaSans.variable}`} suppressHydrationWarning>
      <head>
        {/* Add .js class to <html> so motion-safe CSS (opacity:0 for [data-reveal-item]) activates only with JS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-egg text-bottle font-sans antialiased">
        <AuthProvider>
          <ScrollProgress />
          <ScrollFX />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
