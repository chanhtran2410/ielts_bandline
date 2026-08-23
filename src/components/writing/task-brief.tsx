import type { WritingTask } from '@/types/writing';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

export interface TaskBriefProps {
  task: WritingTask;
  /** A coach note drawn from the learner's recent feedback. */
  coachReminder?: string;
}

/** The left rail of the editor: the prompt, and one thing to keep in mind. */
export function TaskBrief({ task, coachReminder }: TaskBriefProps) {
  return (
    <div>
      <p className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint">
        {task.label}
      </p>

      <Card className="mb-5 px-[22px] py-5 text-sm leading-[1.65] text-ink-soft shadow-none">
        <p>{task.prompt}</p>
        <p className="mt-4 font-semibold text-ink">{task.instruction}</p>
        <p className="mt-4 text-[12.5px] text-faint">
          Write at least {task.minWords} words. Recommended time: {task.recommendedMinutes} minutes.
        </p>
      </Card>

      {coachReminder ? (
        <Card tone="accent" className="px-[18px] py-4">
          <p className="mb-2 flex items-center gap-[7px] text-xs font-semibold text-accent-hover">
            <Icon name="sparkle" size={12} />
            Coach reminder
          </p>
          <p className="text-[12.5px] leading-relaxed text-accent-ink">{coachReminder}</p>
        </Card>
      ) : null}
    </div>
  );
}
