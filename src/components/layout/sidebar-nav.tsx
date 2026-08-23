'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isNavItemActive } from '@/constants/navigation';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';

/**
 * The primary nav list. Shared verbatim by the desktop sidebar and the mobile
 * drawer so the two can never drift apart.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-colors',
              active
                ? 'bg-fill font-semibold text-ink'
                : 'font-medium text-muted hover:bg-line-soft hover:text-ink',
            )}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
