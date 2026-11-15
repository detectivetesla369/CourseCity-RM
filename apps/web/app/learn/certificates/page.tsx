'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, Search, ShieldCheck } from 'lucide-react';

export default function CertificatesPage() {
  const [certificates] = useState<unknown[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Credentials</p>
        <h1
          className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem] leading-[1.05]"
          style={{ letterSpacing: '-0.02em' }}
        >
          Certificates
        </h1>
        <p className="mt-1 text-[14px] text-muted/60">
          Verifiable credentials for completed courses.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-[28px] bg-white p-8 shadow-lift-sm">
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-salad/10">
              <Award size={24} className="text-bottle" />
            </div>
            <h2 className="text-[1.2rem] font-bold text-bottle">No certificates yet</h2>
            <p className="mt-2 max-w-sm text-[14px] text-muted/55 leading-relaxed">
              Complete a course to earn a cryptographically verifiable certificate.
            </p>

            {/* How it works */}
            <div className="mt-8 grid max-w-lg gap-4 text-left sm:grid-cols-3">
              {[
                { step: '1', title: 'Complete a course', desc: 'Finish all required lessons and assessments.' },
                { step: '2', title: 'Certificate issued', desc: 'Generated and digitally signed by the server.' },
                { step: '3', title: 'Share & verify', desc: 'Share the verification link with anyone.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-xl bg-egg/50 p-4">
                  <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-orange/8 text-[12px] font-bold text-orange">
                    {step}
                  </div>
                  <p className="text-[14px] font-bold text-bottle">{title}</p>
                  <p className="mt-1 text-[12px] text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-[12px] text-muted/50">
              <ShieldCheck size={14} />
              <span>Certificates are verified with cryptographic signatures</span>
            </div>

            <Link href="/courses" className="mt-6 inline-flex items-center gap-2 rounded-full bg-bottle px-6 py-2.5 text-[14px] font-semibold text-egg shadow-lift-sm">
              <Search size={16} />
              Browse courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{/* Certificate cards */}</div>
      )}
    </div>
  );
}
