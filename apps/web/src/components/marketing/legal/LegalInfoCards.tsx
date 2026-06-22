import { LEGAL_CONFIG } from '@/lib/legal-config';

export function LegalInfoCards() {
  const { supportEmail, companyName, productName } = LEGAL_CONFIG;

  const cards = [
    {
      label: 'Email Support',
      value: supportEmail,
      href: `mailto:${supportEmail}`,
    },
    {
      label: 'Business',
      value: companyName,
    },
    {
      label: 'Product',
      value: `${productName} Meeting Platform`,
    },
  ] as const;

  return (
    <div className="mb-10 grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {card.label}
          </p>
          {'href' in card && card.href ? (
            <a
              href={card.href}
              className="mt-2 block text-sm font-semibold text-primary hover:underline"
            >
              {card.value}
            </a>
          ) : (
            <p className="mt-2 text-sm font-semibold text-foreground">{card.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
