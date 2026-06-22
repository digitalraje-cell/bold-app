import { Shield, Clock, Mail } from 'lucide-react';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function TrustStrip({ className }: { className?: string }) {
  const items = [
    {
      icon: Shield,
      label: 'Operated by',
      value: LEGAL_CONFIG.companyName,
    },
    {
      icon: Clock,
      label: 'Support response',
      value: LEGAL_CONFIG.responseTime,
    },
    {
      icon: Mail,
      label: 'Support',
      value: LEGAL_CONFIG.supportEmail,
    },
  ];

  return (
    <div className={cn('grid gap-3 sm:grid-cols-3', className)}>
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className={cn(cardClass({ bordered: true }), 'flex items-start gap-3 p-4')}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--badge-bg)]">
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
