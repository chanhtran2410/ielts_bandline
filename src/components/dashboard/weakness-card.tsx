import type { Weakness } from '@/types/dashboard';
import type { AttemptWeakness } from '@/types/attempt';
import { formatBand } from '@/lib/band';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EyebrowLabel } from '@/components/ui/badge';

/**
 * The dark "biggest blocker" card. It names the weakness, gives the evidence,
 * and offers exactly one way to act on it (§32).
 */
export function WeaknessCard({ weakness }: { weakness: Weakness }) {
  return (
    <Card tone="dark" as="section" aria-labelledby="blocker-heading" className="flex flex-col p-7">
      <EyebrowLabel tone="gold" className="mb-4 tracking-[0.08em]">
        Biggest blocker
      </EyebrowLabel>
      <h2
        id="blocker-heading"
        className="mb-1.5 font-display text-[22px] font-semibold leading-tight tracking-[-0.01em]"
      >
        {weakness.title}
      </h2>
      <p className="mb-3.5 font-display text-[15px] font-bold text-accent-gold">
        Band {formatBand(weakness.band)}
      </p>
      <p className="mb-5 text-[13.5px] leading-relaxed text-on-dark-muted">{weakness.diagnosis}</p>
      <div className="mt-auto">
        <ButtonLink href={weakness.href} variant="accent">
          Fix this weakness
        </ButtonLink>
      </div>
    </Card>
  );
}

/**
 * The result-screen variant: same diagnosis treatment, but with the two actions
 * the learner needs straight after a test.
 */
export function ResultWeaknessCard({
  weakness,
  practiceHref,
  mistakesHref,
}: {
  weakness: AttemptWeakness;
  practiceHref: string;
  mistakesHref: string;
}) {
  return (
    <Card
      tone="dark"
      as="section"
      aria-labelledby="weakness-heading"
      className="flex flex-col gap-7 p-7 sm:px-8 md:flex-row md:items-start md:gap-10"
    >
      <div className="flex-1">
        <EyebrowLabel tone="gold" className="mb-3 tracking-[0.08em]">
          Biggest weakness
        </EyebrowLabel>
        <h2
          id="weakness-heading"
          className="mb-2.5 font-display text-[21px] font-semibold tracking-[-0.01em]"
        >
          {weakness.title}
        </h2>
        <p className="max-w-[480px] text-sm leading-relaxed text-on-dark-muted">
          {weakness.diagnosis}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2.5 md:pt-6">
        <ButtonLink href={practiceHref} variant="accent" size="md" className="justify-center">
          Practice this skill
        </ButtonLink>
        <ButtonLink href={mistakesHref} variant="on-dark" size="md" className="justify-center">
          Review mistakes
        </ButtonLink>
      </div>
    </Card>
  );
}
