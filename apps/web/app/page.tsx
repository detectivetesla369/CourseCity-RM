import React from 'react';
import { Button, Badge, Card } from '@coursecity/design-system';
import { BookOpen, ShieldCheck, Award, ArrowRight, Search, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Top Utility Layer */}
      <header className="sticky top-0 z-40 w-full border-b border-[#EDE3DA] bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-bold text-xl shadow-sm">
              CC
            </div>
            <span className="font-bold text-xl tracking-tight text-[#17130F]">CourseCity</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#453B33]">
            <a href="#catalog" className="hover:text-[#F97316] transition-colors">
              Catalog
            </a>
            <a href="#experience" className="hover:text-[#F97316] transition-colors">
              Learning Reader
            </a>
            <a href="#verification" className="hover:text-[#F97316] transition-colors">
              Public Verification
            </a>
            <a href="/docs" className="hover:text-[#F97316] transition-colors">
              Developers
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-[#FFF9F4] to-[#FFFCF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2">
                <Badge variant="orange">CourseCity 1.0 Active Release</Badge>
                <Badge variant="success">Cryptographically Verifiable</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#17130F] leading-[1.15]">
                Mastery through <span className="text-[#F97316]">focused reading</span> and rigorous
                proof.
              </h1>

              <p className="text-lg sm:text-xl text-[#453B33] max-w-2xl leading-relaxed">
                An authoritative learning platform engineered around distraction-free ebook
                tutorials, server-verified assessments, and mathematically tamper-evident digital
                credentials.
              </p>

              {/* Search Bar */}
              <div className="pt-2 max-w-xl">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-[#766B61]" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search systems architecture, distributed databases, cryptography..."
                    className="w-full pl-12 pr-32 py-3.5 rounded-xl border border-[#EDE3DA] bg-white text-[#17130F] placeholder-[#766B61] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-sm"
                  />
                  <div className="absolute right-2">
                    <Button variant="primary" size="sm">
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4 text-xs text-[#766B61]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
                  Zero Client-Side Gating
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
                  Ed25519 Signed Receipts
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
                  Server-Enforced Timing
                </span>
              </div>
            </div>

            {/* Hero Visual Card / 3D Metaphor Placeholder */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-2xl border border-[#EDE3DA] p-6 shadow-xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-[#EDE3DA]">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-[#F97316]" aria-hidden="true" />
                    <span className="font-semibold text-sm">CourseCity Digital Reader</span>
                  </div>
                  <Badge variant="accent">Module 01</Badge>
                </div>

                <div className="py-6 space-y-4">
                  <h3 className="font-bold text-lg text-[#17130F]">
                    Distributed Systems Architecture
                  </h3>
                  <p className="text-sm text-[#453B33] leading-relaxed">
                    Understanding consensus protocols, monotonic state updates, and transaction
                    boundaries across isolated networks.
                  </p>

                  <div className="bg-[#FFF9F4] p-3 rounded-lg border border-[#EDE3DA] text-xs font-mono text-[#453B33]">
                    $ POST /api/v1/orders
                    <br />
                    ↳ Entitlement: VERIFIED
                    <br />↳ Ed25519 Fingerprint: 8k9f2m...
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EDE3DA] flex items-center justify-between">
                  <span className="text-xs text-[#766B61]">Lesson 1 of 12</span>
                  <Button variant="secondary" size="sm">
                    Resume Reading <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Architecture Pillars */}
      <section id="experience" className="py-16 md:py-24 bg-white border-t border-[#EDE3DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="orange">The CourseCity Standard</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17130F]">
              Engineered for academic integrity and mathematical trust.
            </h2>
            <p className="text-[#453B33] text-base sm:text-lg">
              Every component is built around authoritative server verification, mobile-first
              performance, and cryptographic proof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#F97316]">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#17130F]">Distraction-Free Reader</h3>
              <p className="text-sm text-[#453B33] leading-relaxed">
                Atomic content blocks for code, mathematical KaTeX, diagrams, and exercises.
                Responsive recomposition designed for deep study across mobile, tablet, and desktop.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#F97316]">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#17130F]">Ed25519 Cryptographic Receipts</h3>
              <p className="text-sm text-[#453B33] leading-relaxed">
                Receipts are signed using asymmetric cryptography. Fake PDFs that mimic CourseCity
                branding fail instant server verification on the public verification engine.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#F97316]">
                <Award className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#17130F]">Verifiable Credentials</h3>
              <p className="text-sm text-[#453B33] leading-relaxed">
                Certificates are issued strictly after meeting server-side completion rules and
                passing timed examinations. Publicly verifiable at verify.coursecity.com.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Public Verification Callout */}
      <section id="verification" className="py-16 bg-[#FFF9F4] border-t border-[#EDE3DA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="accent">Public Verification Engine</Badge>
          <h2 className="text-3xl font-bold text-[#17130F]">
            Validate any CourseCity Receipt or Certificate
          </h2>
          <p className="text-[#453B33] max-w-2xl mx-auto text-base">
            Employers, institutions, and learners can verify digital credentials in real time using
            the canonical business reference number.
          </p>

          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              placeholder="e.g. CC-RCP-20261003-8K9F2M"
              className="flex-1 px-4 py-3 rounded-lg border border-[#EDE3DA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
            <Button variant="primary">Verify</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EDE3DA] bg-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#766B61]">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-[#17130F]">CourseCity 1.0</span>
            <span>— Authoritative Learning Platform</span>
          </div>
          <div>
            © 2026 CourseCity. Built with Node.js LTS, Fastify, Next.js, PostgreSQL & Ed25519
            Cryptography.
          </div>
        </div>
      </footer>
    </div>
  );
}
