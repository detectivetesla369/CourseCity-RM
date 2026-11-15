'use client';

import { useState } from 'react';
import { Bell, BellOff, Check, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const ICON_MAP = {
  info: { icon: Info, color: 'text-blue', bg: 'bg-blue-wash' },
  success: { icon: CheckCircle2, color: 'text-salad', bg: 'bg-salad/10' },
  warning: { icon: AlertTriangle, color: 'text-orange', bg: 'bg-orange/8' },
};

export default function NotificationsPage() {
  // Notifications will be loaded from API when ready
  const [notifications] = useState<Notification[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Activity</p>
          <h1 className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem] leading-[1.05]" style={{ letterSpacing: '-0.02em' }}>
            Notifications
          </h1>
          <p className="mt-1 text-[14px] text-muted/60">Stay updated on your learning activity.</p>
        </div>

        {notifications.length > 0 && (
          <button className="flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-medium text-muted hover:text-bottle transition-colors">
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-bottle/5">
            <BellOff size={28} className="text-muted/40" />
          </div>
          <h2 className="text-[1.2rem] font-bold text-bottle">All caught up!</h2>
          <p className="mt-2 max-w-sm text-[14px] text-muted/55 leading-relaxed">
            You don&apos;t have any notifications right now. We&apos;ll let you know when something important happens —
            like assessment results, certificate issuance, or course updates.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = ICON_MAP[n.type];
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-[16px] p-4 transition-colors ${
                  n.read ? 'bg-white' : 'bg-orange/4 border-l-4 border-orange'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] ${n.read ? 'text-bottle' : 'font-semibold text-bottle'}`}>{n.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted/50">
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
