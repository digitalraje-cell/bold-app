'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id: idProp,
}: ToggleProps) {
  const generatedId = useId();
  const switchId = idProp ?? generatedId;
  const labelId = `${switchId}-label`;
  const descId = description ? `${switchId}-desc` : undefined;

  return (
    <label
      htmlFor={switchId}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4 rounded-[var(--radius-md)] py-1',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/15 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <div className="min-w-0 flex-1 select-none">
        <p id={labelId} className="text-sm font-medium text-foreground">
          {label}
        </p>
        {description && (
          <p id={descId} className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descId}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-all duration-200',
          'focus-visible:outline-none',
          checked
            ? 'border-primary bg-primary'
            : 'border-[var(--toggle-track-off-border)] bg-[var(--toggle-track-off)]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </label>
  );
}
