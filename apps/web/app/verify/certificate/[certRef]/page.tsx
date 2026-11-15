'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldX,
  Loader2,
  ArrowLeft,
  Award,
  Calendar,
  User,
  BookOpen,
  Building2,
} from 'lucide-react';
import { ApiClientError } from '@coursecity/api-client';
import { useAuth } from '@/lib/auth-context';
import type { CertificateVerificationResultDTO } from '@coursecity/contracts';

export default function CertificateVerifyPage() {
  const params = useParams();
  const certRef = params.certRef as string;
  const { api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CertificateVerificationResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certRef) return;
    api.verifyCertificate(certRef)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.problem.detail : 'Verification failed.');
        setLoading(false);
      });
  }, [certRef]);

  const isVerified = result?.outcome === 'VERIFIED';

  return (
    <div className="min-h-screen bg-egg flex flex-col">
      {/* Header */}
      <header className="border-b border-egg-deep bg-white py-4">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-bottle transition-colors">
            <ArrowLeft size={16} />
            Return to CourseCity
          </Link>
          <span className="text-xs font-mono text-muted/50 uppercase tracking-wider">Certificate Verification</span>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-12 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Loader2 size={32} className="animate-spin text-orange mb-4" />
            <p className="text-sm text-muted">Verifying certificate…</p>
          </div>
        ) : error || !result ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50">
              <ShieldX size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-bottle">Verification failed</h1>
            <p className="mt-2 text-sm text-muted">{error || 'This certificate could not be verified.'}</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3">
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                isVerified ? 'bg-salad/10 text-bottle' : 'bg-red-50 text-red-700'
              }`}>
                {isVerified ? <ShieldCheck size={16} className="text-salad" /> : <ShieldX size={16} />}
                {result.outcome === 'VERIFIED' ? 'Verified Certificate' : result.outcome === 'REVOKED' ? 'Revoked' : 'Invalid'}
              </div>
              <h1 className="text-3xl font-extrabold text-bottle">Certificate Verification</h1>
              <p className="text-sm font-mono text-muted">{certRef}</p>
            </div>

            <div className="rounded-[28px] bg-white p-8 shadow-lift-md space-y-6">
              {isVerified && (
                <>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    {result.recipientName && (
                      <div>
                        <span className="text-xs text-muted block mb-1 flex items-center gap-1"><User size={12} /> Recipient</span>
                        <span className="font-semibold text-bottle">{result.recipientName}</span>
                      </div>
                    )}
                    {result.courseTitle && (
                      <div>
                        <span className="text-xs text-muted block mb-1 flex items-center gap-1"><BookOpen size={12} /> Course</span>
                        <span className="font-semibold text-bottle">{result.courseTitle}</span>
                      </div>
                    )}
                    {result.publisherName && (
                      <div>
                        <span className="text-xs text-muted block mb-1 flex items-center gap-1"><Building2 size={12} /> Publisher</span>
                        <span className="font-semibold text-bottle">{result.publisherName}</span>
                      </div>
                    )}
                    {result.issuedAt && (
                      <div>
                        <span className="text-xs text-muted block mb-1 flex items-center gap-1"><Calendar size={12} /> Issued</span>
                        <span className="font-semibold text-bottle">
                          {new Date(result.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {result.finalGrade !== undefined && result.finalGrade !== null && (
                      <div>
                        <span className="text-xs text-muted block mb-1 flex items-center gap-1"><Award size={12} /> Final grade</span>
                        <span className="font-semibold text-bottle">{result.finalGrade}%</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[16px] bg-egg p-4 text-xs text-muted leading-relaxed">
                    <p>
                      This certificate was cryptographically signed and issued by CourseCity.
                      Verified at {new Date(result.verifiedAt).toLocaleString()}.
                    </p>
                  </div>
                </>
              )}

              {result.outcome === 'REVOKED' && (
                <div className="rounded-[16px] bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  This certificate has been revoked and is no longer valid.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
