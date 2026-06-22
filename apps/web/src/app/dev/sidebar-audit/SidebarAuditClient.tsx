'use client';

import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navLinkClass } from '@/lib/ui';
import { appConfig } from '@/lib/app-config';
import { getActiveNavId, isSidebarItemActive } from '@/lib/sidebar-nav';
import { isNavActiveBefore, primaryNavItems } from '@/lib/sidebar-nav-config';

function SidebarPreview({
  pathname,
  variant,
  mobile,
}: {
  pathname: string;
  variant: 'before' | 'after';
  mobile?: boolean;
}) {
  const activeId =
    variant === 'after' ? getActiveNavId(primaryNavItems, pathname) : null;

  return (
    <div
      className={cn(
        'flex flex-col bg-surface border border-border/50',
        mobile ? 'w-[280px] h-[600px]' : 'w-64 min-h-[480px]',
      )}
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {appConfig.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-lg font-semibold tracking-tight">{appConfig.name}</span>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {primaryNavItems.map((item) => {
          const active =
            variant === 'before'
              ? isNavActiveBefore(item, pathname)
              : isSidebarItemActive(item, pathname, activeId);
          return (
            <div key={item.id} className={navLinkClass(active)}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          );
        })}
      </nav>
      <p className="border-t border-border/50 p-4 text-xs text-muted-foreground">
        {variant === 'before' ? 'Before (buggy)' : 'After (fixed)'} · {pathname}
      </p>
    </div>
  );
}

export function SidebarAuditClient() {
  const searchParams = useSearchParams();
  const pathname = searchParams.get('path') ?? '/dashboard';
  const view = searchParams.get('view') ?? 'compare';

  if (view === 'desktop') {
    return (
      <div className="p-8 bg-background min-h-screen">
        <SidebarPreview pathname={pathname} variant="after" />
      </div>
    );
  }

  if (view === 'mobile') {
    return (
      <div className="p-4 bg-background min-h-screen flex justify-center">
        <SidebarPreview pathname={pathname} variant="after" mobile />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-2 text-xl font-semibold">Sidebar active state — {pathname}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Only the &quot;After&quot; column should have a single active item.
      </p>
      <div className="flex flex-wrap gap-8">
        <SidebarPreview pathname={pathname} variant="before" />
        <SidebarPreview pathname={pathname} variant="after" />
      </div>
    </div>
  );
}
