import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';

/**
 * Full-height chrome for focused sessions: reading practice, the writing
 * editor, and mock mode. Deliberately has no sidebar — nothing should invite
 * the learner away mid-attempt.
 */
export function ExamShell({ children }: { children: React.ReactNode }) {
  return (
    /*
     * Pinned to the viewport rather than merely sized to it. `h-dvh` inside
     * normal flow still lets the document grow — measured at 1487px of stray
     * page scroll — which means the whole exam drifts under a fixed top bar
     * while the learner is trying to scroll a pane. Taking the shell out of
     * flow makes the panes the only scrollers, which is the intended behaviour.
     */
    <div className="fixed inset-0 flex flex-col overflow-hidden">{children}</div>
  );
}

export interface ExamTopBarProps {
  exitHref: string;
  exitLabel?: string;
  title: string;
  /** Mode chip, draft number, or any short status. */
  chip?: React.ReactNode;
  /** Right-hand cluster: timer, save state, actions. */
  children?: React.ReactNode;
}

export function ExamTopBar({
  exitHref,
  exitLabel = 'Exit',
  title,
  chip,
  children,
}: ExamTopBarProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-paper px-4 py-3 sm:px-5">
      <Link
        href={exitHref}
        className="flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        <Icon name="chevron-left" size={14} />
        {exitLabel}
      </Link>
      <ExamDivider />
      <h1 className="font-display text-[13.5px] font-semibold">{title}</h1>
      {chip}
      <div className="ml-auto flex items-center gap-3 sm:gap-4">{children}</div>
    </header>
  );
}

export function ExamDivider({ className }: { className?: string }) {
  return <span className={cn('hidden h-[18px] w-px bg-line sm:block', className)} aria-hidden="true" />;
}

/** The slim result-screen header: a back link and a right-aligned caption. */
export function ResultTopBar({
  backHref,
  backLabel,
  title,
  caption,
}: {
  backHref: string;
  backLabel: string;
  title?: string;
  caption?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-paper px-5 py-3.5 sm:px-6">
      <Link
        href={backHref}
        className="flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        <Icon name="chevron-left" size={14} />
        {backLabel}
      </Link>
      {title ? (
        <>
          <ExamDivider />
          <h1 className="font-display text-[13.5px] font-semibold">{title}</h1>
        </>
      ) : null}
      {caption ? <p className="ml-auto text-[12.5px] text-faint">{caption}</p> : null}
    </header>
  );
}
