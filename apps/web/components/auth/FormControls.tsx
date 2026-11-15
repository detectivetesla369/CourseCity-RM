'use client';

import { useId, useState, type ReactNode, type Ref, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, AlertCircle, Check, ArrowRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Text / email / password field                                      */
/* ------------------------------------------------------------------ */

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'size'> {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  /** Optional element rendered on the right of the label row (e.g. "Forgot password?"). */
  labelAside?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
}

export function FormField({
  label,
  error,
  hint,
  labelAside,
  inputRef,
  type = 'text',
  className = '',
  ...input
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const trackCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPassword) setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-bottle">
          {label}
        </label>
        {labelAside}
      </div>

      <div className="relative">
        <input
          {...input}
          id={id}
          ref={inputRef}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onKeyDown={(e) => {
            trackCaps(e);
            input.onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            trackCaps(e);
            input.onKeyUp?.(e);
          }}
          className={`
            w-full rounded-2xl border-2 bg-white/80 px-4 py-3.5 text-base text-bottle
            placeholder:text-bottle/30
            transition-[border-color,box-shadow] duration-200
            focus:outline-none
            ${isPassword ? 'pr-12' : ''}
            ${error
              ? 'border-red-500/70 focus:border-red-600 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.1)]'
              : 'border-bottle/8 hover:border-orange/20 focus:border-orange/50 focus:shadow-[0_0_0_4px_rgba(255,100,0,0.08)]'
            }
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            aria-pressed={reveal}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-bottle/50 transition-colors hover:bg-egg hover:text-bottle focus-visible:outline-2 focus-visible:outline-bottle"
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Caps Lock warning — a common cause of "wrong password" */}
      {isPassword && capsLock && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-orange-ink">
          <AlertCircle size={13} /> Caps Lock is on
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={13} className="mt-px shrink-0" />
          {error}
        </p>
      )}

      {hint && !error && (
        <div id={hintId} className="mt-2 text-xs text-muted">
          {hint}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkbox                                                           */
/* ------------------------------------------------------------------ */

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string | null;
  inputRef?: Ref<HTMLInputElement>;
}

export function Checkbox({ checked, onChange, children, error, inputRef }: CheckboxProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3 text-sm text-muted">
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0">
          <input
            id={id}
            ref={inputRef}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="peer absolute inset-0 h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-bottle/20 bg-white transition-colors checked:border-bottle checked:bg-bottle group-hover:border-bottle/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bottle aria-[invalid=true]:border-red-500/70"
          />
          <Check
            size={13}
            strokeWidth={3.5}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </span>
        <span className="leading-relaxed">{children}</span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 pl-8 text-xs font-medium text-red-600">
          <AlertCircle size={13} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Submit button                                                      */
/* ------------------------------------------------------------------ */

export function SubmitButton({ loading, children, loadingText }: { loading: boolean; children: ReactNode; loadingText: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-egg transition-all duration-300 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-orange"
      style={{
        background: loading
          ? '#003223'
          : 'linear-gradient(135deg, #003223 0%, #005a3c 50%, #004d34 100%)',
        boxShadow: '0 4px 16px rgba(0,50,35,0.22), 0 0 0 0 rgba(255,100,0,0)',
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,50,35,0.25), 0 0 20px rgba(255,100,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,50,35,0.22), 0 0 0 0 rgba(255,100,0,0)';
      }}
    >
      {loading ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-egg/30 border-t-egg" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Form-level alert (e.g. "Incorrect email or password")              */
/* ------------------------------------------------------------------ */

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border-2 border-red-500/20 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    >
      <AlertCircle size={18} className="mt-px shrink-0" />
      <div>{children}</div>
    </div>
  );
}
