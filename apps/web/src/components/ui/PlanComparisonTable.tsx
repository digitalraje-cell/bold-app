import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export type ComparisonColumn = { key: string; label: string };
export type ComparisonRow = { feature: string; values: Record<string, string | boolean> };

function formatCell(value: string | boolean | undefined): string {
  if (value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '—';
  return value;
}

export function PlanComparisonTable({
  columns,
  rows,
  className,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  className?: string;
}) {
  return (
    <>
      <div className={cn('space-y-3 md:hidden', className)}>
        {rows.map((row) => (
          <div key={row.feature} className={cardClass({ className: 'p-4' })}>
            <p className="text-sm font-medium">{row.feature}</p>
            <dl className="mt-3 space-y-2 border-t border-border pt-3">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">{col.label}</dt>
                  <dd className="font-medium">{formatCell(row.values[col.key])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className={cn(cardClass(), 'hidden md:block', className)}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-[var(--badge-bg)]">
              <th className="px-6 py-4 font-semibold">Feature</th>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-border/80 last:border-0">
                <td className="px-6 py-4 font-medium">{row.feature}</td>
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-muted-foreground">
                    {formatCell(row.values[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
