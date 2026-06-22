import type { LucideIcon } from 'lucide-react';

export type SidebarNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

/** Returns the id of the single active nav item for a pathname. */
export function getActiveNavId(items: SidebarNavItem[], pathname: string): string | null {
  const normalized = pathname.split('?')[0]?.replace(/\/$/, '') || '/';
  const matches = items.filter((item) => item.isActive(normalized));
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0]!.id;
  // Prefer the most specific match (longest href prefix)
  return matches.sort((a, b) => b.href.length - a.href.length)[0]!.id;
}

export function isSidebarItemActive(
  item: SidebarNavItem,
  pathname: string,
  activeId: string | null,
): boolean {
  return activeId === item.id;
}
