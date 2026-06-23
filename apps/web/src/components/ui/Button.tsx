import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary:
        'btn-primary-gradient active:scale-[0.98]',
      secondary:
        'border border-[var(--accent-purple)]/35 bg-surface text-[var(--accent-purple-dark)] shadow-[var(--shadow-soft)] hover:border-[var(--accent-purple)] hover:bg-[var(--badge-bg)] hover:shadow-[var(--primary-glow)]',
      ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      danger:
        'bg-destructive text-destructive-foreground shadow-[var(--shadow-soft)] hover:opacity-90 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-5 py-2 text-sm rounded-full',
      md: 'px-6 py-2.5 text-sm rounded-full',
      lg: 'px-8 py-3.5 text-base rounded-full',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-purple)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
