import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ==========================================
// 1. BUTTON COMPONENT (Accessible, 44px touch target)
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] min-w-[44px] select-none';

    const variants = {
      primary: 'bg-[#F97316] hover:bg-[#EA580C] text-white focus-visible:ring-[#F97316] shadow-sm',
      secondary: 'bg-[#FFEDD5] hover:bg-[#FED7AA] text-[#9A3412] focus-visible:ring-[#F97316]',
      outline:
        'border border-[#EDE3DA] hover:bg-[#FFF9F4] text-[#17130F] focus-visible:ring-[#F97316]',
      ghost: 'hover:bg-[#FFF7ED] text-[#453B33] hover:text-[#17130F] focus-visible:ring-[#F97316]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

// ==========================================
// 2. BADGE COMPONENT (Semantic Pastels)
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'orange' | 'success' | 'warning' | 'accent' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'orange',
  children,
  ...props
}) => {
  const styles = {
    orange: 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
    success: 'bg-[#DDF3E7] text-[#065F46] border-[#A7F3D0]',
    warning: 'bg-[#FFF0B8] text-[#92400E] border-[#FDE68A]',
    accent: 'bg-[#EEE7FF] text-[#5B21B6] border-[#DDD6FE]',
    neutral: 'bg-[#FFF9F4] text-[#453B33] border-[#EDE3DA]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// ==========================================
// 3. CARD COMPONENT
// ==========================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#EDE3DA] shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// 4. SKELETON LOADERS
// ==========================================
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return <div className={cn('animate-pulse rounded bg-[#EDE3DA]/60', className)} {...props} />;
};

export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#EDE3DA] p-4 flex flex-col space-y-3">
      <Skeleton className="h-44 w-full rounded-lg" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="pt-2 flex justify-between items-center">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
};
