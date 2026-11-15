'use client';

import { useState, useRef, type FormEvent } from 'react';
import {
  Shield,
  Key,
  Monitor,
  Smartphone,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Clock,
} from 'lucide-react';
import { useAuth, ApiClientError } from '@/lib/auth-context';
import { FormField, SubmitButton, FormAlert } from '@/components/auth/FormControls';
import { validateNewPassword, validateExistingPassword } from '@/components/auth/validation';
import type { AuthSessionDTO } from '@coursecity/contracts';

export default function SecurityPage() {
  const { api, user } = useAuth();

  /* ---- Change password ---- */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState<Record<string, string | null>>({});
  const [pwFormError, setPwFormError] = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const currentPwRef = useRef<HTMLInputElement>(null);
  const newPwRef = useRef<HTMLInputElement>(null);
  const confirmPwRef = useRef<HTMLInputElement>(null);

  const handleChangePw = async (e: FormEvent) => {
    e.preventDefault();
    if (pwSubmitting) return;

    const errors: Record<string, string | null> = {
      current: validateExistingPassword(currentPw),
      new: validateNewPassword(newPw),
      confirm: newPw !== confirmPw ? 'Passwords do not match.' : null,
    };
    setPwErrors(errors);
    if (errors.current) return currentPwRef.current?.focus();
    if (errors.new) return newPwRef.current?.focus();
    if (errors.confirm) return confirmPwRef.current?.focus();

    setPwSubmitting(true);
    setPwFormError(null);

    try {
      // TODO: call api.changePassword({ currentPassword: currentPw, newPassword: newPw }) when ready
      await new Promise((r) => setTimeout(r, 1000));
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setPwFormError(err.problem.detail || 'Failed to change password.');
      } else {
        setPwFormError('Something went wrong. Please try again.');
      }
    } finally {
      setPwSubmitting(false);
    }
  };

  /* ---- Sessions ---- */
  const [sessions, setSessions] = useState<AuthSessionDTO[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useState(() => {
    api.getSessions()
      .then((res) => {
        setSessions(res.sessions);
        setSessionsLoading(false);
      })
      .catch(() => {
        setSessionsLoading(false);
      });
  });

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // silently fail
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Monitor;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return Smartphone;
    return Monitor;
  };

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <p className="eyebrow mb-2">Your account</p>
        <h1 className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem]" style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          Security
        </h1>
        <p className="mt-1 text-[14px] text-muted/60">Manage your password and active sessions.</p>
      </div>

      {/* Change password section */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/8">
            <Key size={20} className="text-orange" />
          </div>
          <div>
            <h2 className="text-[1.2rem] font-bold text-bottle">Change password</h2>
            <p className="text-[12px] text-muted/60">Update your password to keep your account secure.</p>
          </div>
        </div>

        <form onSubmit={handleChangePw} noValidate className="max-w-md space-y-4 rounded-[20px] bg-white p-6 shadow-lift-sm">
          {pwFormError && <FormAlert>{pwFormError}</FormAlert>}
          {pwSuccess && (
            <div className="flex items-center gap-2 rounded-2xl bg-salad/10 px-4 py-3 text-sm font-medium text-bottle">
              <CheckCircle2 size={16} className="text-salad" />
              Password changed successfully.
            </div>
          )}

          <FormField
            label="Current password"
            type="password"
            name="current-password"
            autoComplete="current-password"
            placeholder="Enter current password"
            value={currentPw}
            inputRef={currentPwRef}
            error={pwErrors.current}
            onChange={(e) => {
              setCurrentPw(e.target.value);
              setPwFormError(null);
              if (pwErrors.current) setPwErrors((prev) => ({ ...prev, current: validateExistingPassword(e.target.value) }));
            }}
          />

          <FormField
            label="New password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={newPw}
            inputRef={newPwRef}
            error={pwErrors.new}
            onChange={(e) => {
              setNewPw(e.target.value);
              if (pwErrors.new) setPwErrors((prev) => ({ ...prev, new: validateNewPassword(e.target.value) }));
            }}
          />

          <FormField
            label="Confirm new password"
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={confirmPw}
            inputRef={confirmPwRef}
            error={pwErrors.confirm}
            onChange={(e) => {
              setConfirmPw(e.target.value);
              if (pwErrors.confirm && e.target.value === newPw) setPwErrors((prev) => ({ ...prev, confirm: null }));
            }}
          />

          <button
            type="submit"
            disabled={pwSubmitting}
            className="btn btn-primary !min-h-[44px] !rounded-xl gap-2 text-sm disabled:opacity-60"
          >
            {pwSubmitting ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : <><Key size={16} /> Update password</>}
          </button>
        </form>
      </section>

      {/* Active sessions */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-wash">
            <Shield size={20} className="text-blue" />
          </div>
          <div>
            <h2 className="text-[1.2rem] font-bold text-bottle">Active sessions</h2>
            <p className="text-[12px] text-muted/60">Devices currently signed in to your account.</p>
          </div>
        </div>

        <div className="space-y-3">
          {sessionsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-[16px] bg-bottle/5" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-[16px] bg-white p-5 shadow-lift-sm text-center">
              <p className="text-sm text-muted">No active sessions found.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.userAgent);
              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-4 rounded-[16px] bg-white p-4 shadow-lift-sm ${session.isCurrent ? 'border-2 border-salad/30' : ''}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bottle/5">
                    <DeviceIcon size={20} className="text-bottle/50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-bottle truncate">
                        {session.userAgent?.split('/')[0] || 'Unknown device'}
                      </p>
                      {session.isCurrent && (
                        <span className="rounded-md bg-salad/10 px-1.5 py-0.5 text-[10px] font-bold text-bottle">This device</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                      {session.ipAddress && (
                        <span className="flex items-center gap-1"><Globe size={11} /> {session.ipAddress}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Last active {new Date(session.lastActivityAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevoke(session.id)}
                      disabled={revokingId === session.id}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted/40 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      aria-label="Revoke session"
                      title="Sign out this device"
                    >
                      {revokingId === session.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
