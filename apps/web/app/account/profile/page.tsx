'use client';

import { useState, type FormEvent } from 'react';
import { User, Mail, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();

  const displayName = (user as unknown as Record<string, unknown>)?.displayName as string || '';
  const firstName = (user as unknown as Record<string, unknown>)?.firstName as string || '';
  const lastName = (user as unknown as Record<string, unknown>)?.lastName as string || '';

  const [form, setForm] = useState({
    displayName: displayName || user?.email?.split('@')[0] || '',
    firstName,
    lastName,
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = form.displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CC';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaved(false);

    // TODO: call api.updateProfile(form) when endpoint is ready
    await new Promise((r) => setTimeout(r, 800));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="eyebrow mb-2">Your account</p>
        <h1 className="text-[1.8rem] font-extrabold text-bottle md:text-[2.2rem]" style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          Profile
        </h1>
        <p className="mt-1 text-[14px] text-muted/60">Manage your personal information.</p>
      </div>

      {/* Avatar section */}
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange/10 text-2xl font-bold text-orange-ink">
          {initials}
        </div>
        <div>
          <h2 className="text-[1.2rem] font-bold text-bottle">{form.displayName || 'Your Profile'}</h2>
          <p className="text-[14px] text-muted/60">{user?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Display name */}
        <div>
          <label htmlFor="displayName" className="mb-2 block text-[14px] font-semibold text-bottle">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full rounded-2xl border-2 border-bottle/8 bg-white px-4 py-3 text-[14px] text-bottle placeholder:text-muted/40 transition-colors focus:border-orange/40 focus:outline-none"
            placeholder="How you want to be known"
          />
        </div>

        {/* First / Last name */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-[14px] font-semibold text-bottle">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full rounded-2xl border-2 border-bottle/8 bg-white px-4 py-3 text-[14px] text-bottle placeholder:text-muted/40 transition-colors focus:border-orange/40 focus:outline-none"
              placeholder="First name"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-2 block text-[14px] font-semibold text-bottle">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full rounded-2xl border-2 border-bottle/8 bg-white px-4 py-3 text-[14px] text-bottle placeholder:text-muted/40 transition-colors focus:border-orange/40 focus:outline-none"
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="mb-2 block text-[14px] font-semibold text-bottle">
            Bio <span className="text-[12px] text-muted/60 font-normal">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full rounded-2xl border-2 border-bottle/8 bg-white px-4 py-3 text-[14px] text-bottle placeholder:text-muted/40 transition-colors focus:border-orange/40 focus:outline-none resize-none"
            placeholder="Tell us a little about yourself…"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-bottle">
            Email address
          </label>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-bottle/5 bg-egg/50 px-4 py-3 text-[14px] text-muted/60">
            <Mail size={16} />
            {user?.email}
          </div>
          <p className="mt-1.5 text-[12px] text-muted/50">Contact support to change your email address.</p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary !min-h-[44px] !rounded-xl gap-2 text-[14px] disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving…</>
            ) : (
              <><Save size={16} /> Save changes</>
            )}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-[14px] font-medium text-salad animate-[fade-in_0.3s_ease-out]">
              <CheckCircle2 size={16} /> Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
