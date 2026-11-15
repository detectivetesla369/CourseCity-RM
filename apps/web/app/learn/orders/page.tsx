'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { OrderDTO } from '@coursecity/contracts';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  PAID: { label: 'Paid', icon: CheckCircle2, color: 'text-salad', bg: 'bg-salad/10' },
  CREATED: { label: 'Created', icon: Clock, color: 'text-muted', bg: 'bg-bottle/5' },
  PENDING_PAYMENT: { label: 'Pending', icon: Clock, color: 'text-orange-ink', bg: 'bg-orange/8' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  PAYMENT_FAILED: { label: 'Failed', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  REFUNDED: { label: 'Refunded', icon: Receipt, color: 'text-blue', bg: 'bg-blue-wash' },
  REFUND_PENDING: { label: 'Refund pending', icon: Clock, color: 'text-blue', bg: 'bg-blue-wash' },
};

function OrderCard({ order }: { order: OrderDTO }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.CREATED;
  const StatusIcon = config.icon;

  const formatPrice = (minor: number, currency: string) => {
    const amount = minor / 100;
    try {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="rounded-[20px] bg-white p-5 shadow-lift-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-mono text-muted/60">{order.orderReference}</p>
          <div className="mt-1 space-y-1">
            {order.items.map((item) => (
              <p key={item.id} className="text-[14px] font-bold text-bottle truncate">{item.title}</p>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-muted">
            {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-bottle">{formatPrice(order.totalAmountMinor, order.currency)}</p>
          <div className={`mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${config.bg} ${config.color}`}>
            <StatusIcon size={12} />
            {config.label}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { api } = useAuth();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // The API client doesn't have a getOrders method yet — will show empty state gracefully
    setLoading(false);
    setOrders([]);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded-xl bg-bottle/5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[20px] bg-bottle/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Commerce</p>
        <h1 className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem] leading-[1.05]" style={{ letterSpacing: '-0.02em' }}>
          Orders &amp; Payments
        </h1>
        <p className="mt-1 text-[14px] text-muted/60">Your purchase history and payment records.</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange/8">
            <ShoppingBag size={28} className="text-orange" />
          </div>
          <h2 className="text-[1.2rem] font-bold text-bottle">No orders yet</h2>
          <p className="mt-2 max-w-sm text-[14px] text-muted/55 leading-relaxed">
            When you purchase a course, your orders and receipts will appear here.
          </p>
          <Link href="/courses" className="btn btn-primary mt-8 gap-2">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
