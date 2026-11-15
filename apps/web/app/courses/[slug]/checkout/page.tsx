'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { useAuth, ApiClientError } from '@/lib/auth-context';
import type { CourseDetailDTO } from '@coursecity/contracts';

type CheckoutStep = 'loading' | 'review' | 'processing' | 'verifying' | 'success' | 'failed' | 'error';

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { api, user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('loading');
  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // Check for payment callback (returning from Paystack)
  const paymentReference = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?returnTo=${encodeURIComponent(`/courses/${slug}/checkout`)}`);
      return;
    }

    // If returning from payment provider, verify
    if (paymentReference) {
      setStep('verifying');
      verifyPayment(paymentReference);
      return;
    }

    // Load course details
    api.getCourseBySlug(slug)
      .then((data) => {
        if (data.isFree) {
          router.push(`/courses/${slug}`);
          return;
        }
        if (data.isEnrolled) {
          router.push(`/learn/courses/${data.id}`);
          return;
        }
        setCourse(data);
        setStep('review');
      })
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.problem.detail : 'Could not load course.');
        setStep('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAuthenticated]);

  const verifyPayment = async (reference: string) => {
    try {
      const result = await api.verifyPayment(reference);
      if (result.isSuccessful) {
        setStep('success');
      } else if (result.paymentStatus === 'PENDING') {
        // Poll again after a delay
        setTimeout(() => verifyPayment(reference), 3000);
      } else {
        setStep('failed');
        setError('Payment was not successful. You have not been charged.');
      }
    } catch {
      setStep('failed');
      setError('We could not verify your payment. If you were charged, please contact support.');
    }
  };

  const handlePurchase = async () => {
    if (!course) return;
    setStep('processing');
    setError(null);

    try {
      // 1. Create order
      const order = await api.createOrder({
        courseId: course.id,
        idempotencyKey: idempotencyKeyRef.current,
      });
      setOrderId(order.id);

      // 2. Initialize payment
      const callbackUrl = `${window.location.origin}/courses/${slug}/checkout`;
      const payment = await api.initializePayment(order.id, callbackUrl);

      // 3. Redirect to Paystack
      window.location.href = payment.authorizationUrl;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem.detail || 'Could not process your order. Please try again.');
      } else {
        setError('Connection error. Please check your internet and try again.');
      }
      setStep('review');
      // Generate new idempotency key for retry of a new logical operation
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  };

  const formatPrice = (minor: number, currency: string) => {
    const amount = minor / 100;
    try {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      {/* Back link */}
      {(step === 'review' || step === 'error') && (
        <Link
          href={`/courses/${slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-bottle transition-colors"
        >
          <ArrowLeft size={16} />
          Back to course
        </Link>
      )}

      {/* Loading */}
      {step === 'loading' && (
        <div className="flex flex-col items-center py-20 text-center">
          <Loader2 size={32} className="animate-spin text-orange mb-4" />
          <p className="text-sm text-muted">Loading checkout…</p>
        </div>
      )}

      {/* Review & pay */}
      {step === 'review' && course && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-bottle" style={{ letterSpacing: '-0.02em' }}>
              Checkout
            </h1>
            <p className="mt-1 text-sm text-muted">Review your order and complete your purchase.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={18} className="mt-px shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {/* Order summary */}
          <div className="rounded-[20px] bg-white p-6 shadow-lift-md">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted/60">Order summary</h2>

            <div className="flex items-start gap-4 pb-4 border-b border-egg-deep/40">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-xl font-bold text-orange">
                {course.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-bottle">{course.title}</p>
                <p className="text-xs text-muted">{course.publisher.name} · {course.level.replace('_', ' ')}</p>
              </div>
              <p className="text-lg font-bold text-bottle shrink-0">
                {formatPrice(course.priceMinor, course.currency)}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-bottle">{formatPrice(course.priceMinor, course.currency)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-egg-deep/40 pt-2">
                <span className="font-bold text-bottle">Total</span>
                <span className="text-xl font-bold text-bottle">{formatPrice(course.priceMinor, course.currency)}</span>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-3 rounded-[16px] bg-salad/5 px-4 py-3 text-sm">
            <ShieldCheck size={18} className="shrink-0 text-bottle" />
            <p className="text-bottle/70">
              Payments are processed securely via Paystack. CourseCity never stores your card details.
            </p>
          </div>

          {/* Purchase button */}
          <button
            onClick={handlePurchase}
            className="btn btn-primary w-full justify-center gap-2 !rounded-2xl text-base"
          >
            <CreditCard size={18} />
            Pay {formatPrice(course.priceMinor, course.currency)}
            <ArrowRight size={16} />
          </button>

          <p className="text-center text-xs text-muted/60">
            By completing this purchase, you agree to CourseCity&apos;s terms.
          </p>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange/8">
            <Loader2 size={32} className="animate-spin text-orange" />
          </div>
          <h2 className="text-xl font-bold text-bottle">Processing your order…</h2>
          <p className="mt-2 text-sm text-muted">You&apos;ll be redirected to complete payment.</p>
        </div>
      )}

      {/* Verifying */}
      {step === 'verifying' && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange/8">
            <Clock size={32} className="text-orange animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-bottle">Verifying your payment…</h2>
          <p className="mt-2 text-sm text-muted">
            Please wait while we confirm your payment with Paystack. This may take a moment.
          </p>
          <p className="mt-4 text-xs text-muted/60">Do not close this page.</p>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-salad/10">
            <CheckCircle2 size={32} className="text-salad" />
          </div>
          <h2 className="text-2xl font-extrabold text-bottle">You&apos;re in!</h2>
          <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
            Your payment has been verified and you now have access to the course.
            A receipt will be sent to your email.
          </p>
          <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
            <Link
              href={course ? `/learn/courses/${course.id}` : '/learn/library'}
              className="btn btn-primary w-full justify-center gap-2 !rounded-2xl"
            >
              <BookOpen size={18} />
              Start learning
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/learn/orders"
              className="btn btn-ghost !border-bottle/10 w-full justify-center gap-2 !rounded-2xl text-sm"
            >
              View orders
            </Link>
          </div>
        </div>
      )}

      {/* Failed */}
      {step === 'failed' && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-bottle">Payment unsuccessful</h2>
          <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
            {error || 'Your payment could not be completed. No charge has been made to your account.'}
          </p>
          <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => { setStep('review'); setError(null); idempotencyKeyRef.current = crypto.randomUUID(); }}
              className="btn btn-primary w-full justify-center gap-2 !rounded-2xl"
            >
              <RefreshCw size={16} />
              Try again
            </button>
            <Link
              href={`/courses/${slug}`}
              className="btn btn-ghost !border-bottle/10 w-full justify-center gap-2 !rounded-2xl text-sm"
            >
              Back to course
            </Link>
          </div>
        </div>
      )}

      {/* Error (course load failed) */}
      {step === 'error' && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-bottle">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link href="/courses" className="btn btn-primary mt-8 gap-2 !rounded-2xl">
            <ArrowLeft size={16} />
            Back to courses
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
