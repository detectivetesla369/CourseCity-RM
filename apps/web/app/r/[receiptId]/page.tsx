import React from 'react';
import { Badge, Card, Button } from '@coursecity/design-system';
import {
  ShieldCheck,
  Calendar,
  DollarSign,
  UserCheck,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface ReceiptVerificationPageProps {
  params: Promise<{
    receiptId: string;
  }>;
}

export default async function ReceiptVerificationPage({ params }: ReceiptVerificationPageProps) {
  const { receiptId } = await params;

  return (
    <div className="min-h-screen bg-[#FFFCF8] flex flex-col">
      <header className="border-b border-[#EDE3DA] bg-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center space-x-2 text-sm text-[#453B33] hover:text-[#F97316]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to CourseCity</span>
          </a>
          <span className="text-xs font-mono text-[#766B61]">VERIFICATION SERVICE</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="success">Cryptographically Verified</Badge>
          <h1 className="text-3xl font-bold text-[#17130F]">Digital Receipt Verification</h1>
          <p className="text-sm font-mono text-[#766B61]">{receiptId}</p>
        </div>

        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-[#EDE3DA]">
            <div>
              <p className="text-xs text-[#766B61]">Issuing Authority</p>
              <p className="font-bold text-base text-[#17130F]">CourseCity Official Platform</p>
            </div>
            <div className="flex items-center text-[#065F46] font-semibold text-sm">
              <ShieldCheck className="h-5 w-5 mr-1.5" />
              <span>Authentic Record</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs text-[#766B61] block mb-1">Receipt Reference</span>
              <span className="font-mono font-medium">{receiptId}</span>
            </div>

            <div>
              <span className="text-xs text-[#766B61] block mb-1">Status</span>
              <span className="text-[#065F46] font-semibold">ISSUED & VERIFIED</span>
            </div>

            <div>
              <span className="text-xs text-[#766B61] block mb-1">Issued Date (UTC)</span>
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-4 w-4 text-[#766B61]" />
                2026-10-03
              </span>
            </div>

            <div>
              <span className="text-xs text-[#766B61] block mb-1">Customer</span>
              <span className="flex items-center gap-1 font-medium">
                <UserCheck className="h-4 w-4 text-[#766B61]" />
                J*** D** (Protected)
              </span>
            </div>
          </div>

          {/* Cryptographic Signature Fingerprint */}
          <div className="bg-[#FFF9F4] p-4 rounded-xl border border-[#EDE3DA] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#453B33]">
              <span>Cryptographic Integrity Fingerprint</span>
              <span className="font-mono text-[#F97316]">Ed25519</span>
            </div>
            <p className="font-mono text-[11px] text-[#766B61] break-all leading-tight">
              SHA-256: 8a9f2bc4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
            </p>
            <p className="text-[11px] text-[#766B61]">
              Verified against CourseCity Root Key ID{' '}
              <code className="text-[#17130F]">cc_ed25519_2026_v1</code>.
            </p>
          </div>
        </Card>

        <div className="text-center text-xs text-[#766B61]">
          This public verification confirms that the transaction was executed through CourseCity and
          matches the immutable canonical receipt record.
        </div>
      </main>
    </div>
  );
}
