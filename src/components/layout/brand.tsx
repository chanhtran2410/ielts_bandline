import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface BrandProps {
  href?: string;
  /** Hides the wordmark, leaving only the mark. */
  markOnly?: boolean;
  className?: string;
}

export function Brand({ href = '/dashboard', markOnly = false, className }: BrandProps) {
  return (
    <Link href={href} className={cn('flex items-center gap-[9px]', className)}>
      <span
        className="grid size-[22px] shrink-0 place-items-center rounded-sm bg-accent font-display text-xs font-bold text-on-dark"
        aria-hidden="true"
      >
        B
      </span>
      <span
        className={cn(
          'font-display text-[15px] font-semibold tracking-[-0.01em] text-ink',
          markOnly && 'sr-only',
        )}
      >
        Bandline
      </span>
    </Link>
  );
}
