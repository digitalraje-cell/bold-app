import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-2.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm transition-all duration-200',
            'placeholder:text-muted-foreground/70',
            'focus:border-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/8',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/15',
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
