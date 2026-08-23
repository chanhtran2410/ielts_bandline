import type { IconName } from '@/components/ui/icon';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Also mark this item active for these path prefixes. */
  alsoMatches?: string[];
}

/** The primary navigation, in the order the design puts it. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { href: '/practice', label: 'Practice', icon: 'book' },
  { href: '/mock', label: 'Mock Tests', icon: 'clock' },
  { href: '/writing', label: 'Writing', icon: 'pencil' },
  { href: '/progress', label: 'Progress', icon: 'trend' },
  { href: '/mistakes', label: 'Mistakes', icon: 'alert' },
  { href: '/vocabulary', label: 'Vocabulary', icon: 'bookmark' },
  { href: '/coach', label: 'AI Coach', icon: 'sparkles' },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const matches = [item.href, ...(item.alsoMatches ?? [])];
  return matches.some((base) => pathname === base || pathname.startsWith(base + '/'));
}
