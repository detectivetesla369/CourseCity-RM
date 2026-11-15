import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome — CourseCity',
  description: 'Set up your CourseCity profile and discover courses tailored for you.',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-bottle">
      {children}
    </div>
  );
}
