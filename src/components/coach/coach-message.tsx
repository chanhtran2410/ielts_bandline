import Link from 'next/link';
import type { CoachMessage as CoachMessageType } from '@/types/coach';
import type { Recommendation } from '@/types/plan';
import { Icon } from '@/components/ui/icon';

/**
 * One coach turn. Recommendations render as real, tappable rows rather than as
 * a bulleted list inside model prose (§18) — the plan is UI, not text.
 */
export function CoachMessageBubble({ message }: { message: CoachMessageType }) {
  if (message.role === 'user') {
    return (
      <li className="max-w-[70%] self-end rounded-2xl rounded-br-xs bg-ink px-[18px] py-3 text-sm leading-relaxed text-on-dark">
        {message.paragraphs.join(' ')}
      </li>
    );
  }

  return (
    <li className="flex gap-3">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-md border border-accent-soft-line bg-accent-soft text-accent"
        aria-hidden="true"
      >
        <Icon name="sparkle" size={13} />
      </span>

      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink-soft">
        {message.paragraphs.map((paragraph, index) => (
          <div key={index}>
            <p className={index < message.paragraphs.length - 1 ? 'mb-3.5' : undefined}>
              {paragraph}
            </p>
            {index === message.recommendationsAfter && message.recommendations.length > 0 ? (
              <ul className="mb-3.5 flex flex-col gap-2">
                {message.recommendations.map((rec) => (
                  <RecommendationRow key={rec.id} recommendation={rec} />
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </li>
  );
}

function RecommendationRow({ recommendation }: { recommendation: Recommendation }) {
  return (
    <li>
      <Link
        href={recommendation.href}
        className="flex items-center gap-3.5 rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong"
      >
        <span className="tnum w-11 shrink-0 font-display text-xs font-semibold text-accent">
          {recommendation.minutes} min
        </span>
        <span className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">
          {recommendation.title}
        </span>
        <Icon name="chevron-right" size={13} className="shrink-0 text-faint" />
      </Link>
    </li>
  );
}
