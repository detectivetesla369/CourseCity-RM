import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — CourseCity',
  description: 'Sign in to CourseCity with your Google account.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-egg font-sans antialiased text-bottle">
      {children}
    </div>
  );
}
