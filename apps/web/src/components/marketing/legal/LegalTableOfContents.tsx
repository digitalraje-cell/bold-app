'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type LegalTocItem = {
  id: string;
  label: string;
};

export function LegalTableOfContents({ items }: { items: LegalTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  }, []);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {/* Mobile: compact jump menu */}
      <div className="mb-8 lg:hidden">
        <label htmlFor="legal-toc-mobile" className="mb-2 block text-sm font-medium text-foreground">
          Jump to section
        </label>
        <select
          id="legal-toc-mobile"
          value={activeId}
          onChange={(e) => scrollToSection(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: sticky sidebar TOC */}
      <nav
        aria-label="Table of contents"
        className="hidden w-56 shrink-0 lg:block"
      >
        <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </p>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left text-sm transition',
                    activeId === item.id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
