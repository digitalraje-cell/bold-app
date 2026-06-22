import {
  LayoutDashboard,
  Video,
  CreditCard,
  Settings,
  Shield,
  Map,
  Users,
  Rocket,
  Radio,
} from 'lucide-react';
import type { SidebarNavItem } from '@/lib/sidebar-nav';

export const primaryNavItems: SidebarNavItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === '/dashboard',
  },
  {
    id: 'meetings',
    href: '/meetings',
    label: 'Meetings',
    icon: Video,
    isActive: (pathname) =>
      pathname === '/meetings' ||
      pathname.startsWith('/meetings/') ||
      pathname.startsWith('/dashboard/meetings'),
  },
  {
    id: 'billing',
    href: '/billing',
    label: 'Billing',
    icon: CreditCard,
    isActive: (pathname) => pathname.startsWith('/billing'),
  },
  {
    id: 'roadmap',
    href: '/roadmap',
    label: 'Roadmap',
    icon: Map,
    isActive: (pathname) => pathname.startsWith('/roadmap'),
  },
  {
    id: 'settings',
    href: '/settings/profile',
    label: 'Settings',
    icon: Settings,
    isActive: (pathname) => pathname.startsWith('/settings'),
  },
];

export const adminNavItems: SidebarNavItem[] = [
  {
    id: 'admin',
    href: '/admin',
    label: 'Admin',
    icon: Shield,
    isActive: (pathname) => pathname === '/admin',
  },
  {
    id: 'admin-users',
    href: '/admin/users',
    label: 'Admin Users',
    icon: Users,
    isActive: (pathname) => pathname.startsWith('/admin/users'),
  },
  {
    id: 'admin-payments',
    href: '/admin/payments',
    label: 'Admin Payments',
    icon: Shield,
    isActive: (pathname) => pathname.startsWith('/admin/payments'),
  },
  {
    id: 'admin-releases',
    href: '/admin/releases',
    label: 'Releases',
    icon: Rocket,
    isActive: (pathname) => pathname.startsWith('/admin/releases'),
  },
  {
    id: 'admin-youtube',
    href: '/admin/youtube',
    label: 'YouTube Live',
    icon: Radio,
    isActive: (pathname) => pathname.startsWith('/admin/youtube'),
  },
  {
    id: 'admin-product-analytics',
    href: '/admin/product-analytics',
    label: 'Product Analytics',
    icon: LayoutDashboard,
    isActive: (pathname) => pathname.startsWith('/admin/product-analytics'),
  },
  {
    id: 'admin-feature-interest',
    href: '/admin/feature-interest',
    label: 'Feature Interest',
    icon: Map,
    isActive: (pathname) => pathname.startsWith('/admin/feature-interest'),
  },
];

/** Legacy buggy matcher — both Dashboard and Meetings active on /dashboard. */
export function isNavActiveBefore(item: SidebarNavItem, pathname: string): boolean {
  if (item.id === 'meetings') return pathname === '/dashboard';
  if (item.id === 'dashboard') return pathname === '/dashboard';
  return item.isActive(pathname);
}
