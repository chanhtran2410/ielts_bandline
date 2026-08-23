'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Drawer } from '@/components/ui/overlay';
import { Icon } from '@/components/ui/icon';
import { Brand } from './brand';
import { SidebarNav } from './sidebar-nav';
import { UserChip } from './user-chip';

/**
 * The sidebar shell used by every non-exam screen.
 *
 * Desktop keeps the 224px rail from the design. Below `lg` the rail becomes a
 * drawer behind a top bar — a genuine mobile layout rather than a squeezed
 * desktop one (§20).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-0.5 border-r border-line bg-paper px-3 pb-4 pt-5 lg:flex">
        <Brand className="px-2.5 pb-[18px] pt-1" />
        <SidebarNav />
        <div className="flex-1" />
        <UserChip className="border-t border-line px-2.5 pt-3" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="grid size-9 place-items-center rounded-md border border-line bg-surface text-muted transition-colors hover:text-ink"
          >
            <Icon name="menu" size={16} />
          </button>
          <Brand />
        </header>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <Drawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        title="Navigation"
        side="left"
        key={pathname}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <SidebarNav onNavigate={() => setNavOpen(false)} />
          <div className="flex-1" />
          <UserChip className="border-t border-line px-2.5 pt-3" />
        </div>
      </Drawer>
    </div>
  );
}

/**
 * The page header used across the sidebar screens: title, optional description,
 * and an action slot on the right.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow}
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** The content column: the design's 36/44px padding and max width. */
export function PageBody({
  children,
  width = 'wide',
}: {
  children: React.ReactNode;
  width?: 'wide' | 'narrow';
}) {
  return (
    <div
      className={
        'px-5 pb-14 pt-7 sm:px-8 lg:px-11 lg:pt-9 ' +
        (width === 'wide' ? 'max-w-[1080px]' : 'max-w-[920px]')
      }
    >
      {children}
    </div>
  );
}
