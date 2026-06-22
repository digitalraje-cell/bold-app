import { cn } from '@/lib/utils';

export function LegalSection({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={cn(
        'scroll-mt-28 border-t border-border pt-10 text-2xl font-bold tracking-tight text-foreground first:border-t-0 first:pt-0 sm:text-[1.625rem]',
        className,
      )}
    >
      {children}
    </h2>
  );
}
