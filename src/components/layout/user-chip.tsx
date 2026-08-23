'use client';

import { examCountdownLabel, useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/states';

/** The learner identity block in the sidebar footer. */
export function UserChip({ className }: { className?: string }) {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className={cn('flex items-center gap-[9px]', className)}>
        <Skeleton className="size-7 rounded-pill" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-[9px]', className)}>
      <span
        className="grid size-7 shrink-0 place-items-center rounded-pill bg-ink text-[10.5px] font-semibold text-on-dark"
        aria-hidden="true"
      >
        {profile.user.initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-semibold">{profile.user.name}</p>
        <p className="truncate text-[11px] text-faint">{examCountdownLabel(profile.weeksToExam)}</p>
      </div>
    </div>
  );
}
