import { cn } from '@/lib/utils';

export function LegalSection({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('legal-section scroll-mt-28', className)}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
