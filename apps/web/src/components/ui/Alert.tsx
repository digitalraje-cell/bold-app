import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'destructive' | 'info';
  className?: string;
}

export function Alert({ children, variant = 'destructive', className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm',
        variant === 'destructive' && 'border-destructive/25 bg-destructive/10 text-destructive',
        variant === 'info' && 'border-border bg-muted/30 text-muted-foreground',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="line-clamp-3 leading-snug">{children}</p>
    </div>
  );
}
