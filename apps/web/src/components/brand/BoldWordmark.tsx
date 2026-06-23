import { cn } from '@/lib/utils';

type BoldWordmarkProps = {
  className?: string;
  /** Display size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const sizeClass = {
  sm: 'text-lg tracking-tight',
  md: 'text-xl tracking-tight',
  lg: 'text-2xl tracking-tight',
  xl: 'text-3xl tracking-tight sm:text-4xl',
} as const;

/** Marketing wordmark — gradient BOLD text, no icon. */
export function BoldWordmark({ className, size = 'md' }: BoldWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-block font-black italic leading-none text-gradient-purple',
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      BOLD
    </span>
  );
}
