import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeaturedCourses } from '@/components/landing/FeaturedCourses';
import { EditorialStatement } from '@/components/landing/EditorialStatement';
import { HowItWorks } from '@/components/landing/HowItWorks';
import {
  FeatureDiscover,
  FeatureLearn,
  FeatureProgress,
} from '@/components/landing/Features';
import { Categories } from '@/components/landing/Categories';
import { Certificate } from '@/components/landing/Certificate';
import { SuccessStories } from '@/components/landing/SuccessStories';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

/**
 * CourseCity Landing Page
 *
 * Section sequence:
 *   HERO → FEATURED COURSES → EDITORIAL STATEMENT → HOW IT WORKS →
 *   DISCOVER → LEARN → PROGRESS → CATEGORIES → CERTIFICATE →
 *   FINAL CTA → FOOTER
 *
 * Each section owns its own GSAP animation context (no global timeline).
 * Reduced motion users see settled states with simple fades only.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeaturedCourses />
        <EditorialStatement />
        <HowItWorks />
        <FeatureDiscover />
        <FeatureLearn />
        <FeatureProgress />
        <Categories />
        <Certificate />
        <SuccessStories />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
