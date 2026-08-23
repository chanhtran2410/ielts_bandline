import Link from 'next/link';
import { Brand } from '@/components/layout/brand';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { EyebrowLabel } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress';

const HOW_IT_WORKS = [
  {
    step: '01 — Diagnose',
    title: 'A 30-minute diagnostic',
    body: 'Reading, writing, vocabulary and grammar — scored to a starting band and a skill map.',
  },
  {
    step: '02 — Explain',
    title: "Know exactly why you're stuck",
    body: 'Not "you got 32/40" — but which skill, which question type, and which habit is costing you.',
  },
  {
    step: '03 — Practice',
    title: 'A daily plan built for you',
    body: 'Short, targeted sessions aimed at your weakest skills — sized to the time you actually have.',
  },
  {
    step: '04 — Measure',
    title: 'Watch weaknesses close',
    body: "Every mistake is tracked until you've mastered it. Your plan adapts each week.",
  },
];

const CRITERIA = [
  { label: 'Task Response', band: '6.5', fill: 72, tone: 'good' as const, weak: false },
  { label: 'Coherence & Cohesion', band: '5.5', fill: 50, tone: 'bad' as const, weak: true },
  { label: 'Lexical Resource', band: '6.0', fill: 61, tone: 'accent' as const, weak: false },
  { label: 'Grammar', band: '6.0', fill: 61, tone: 'accent' as const, weak: false },
];

const NAV_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#writing', label: 'Writing AI' },
  { href: '#pricing', label: 'Pricing' },
];

export function LandingScreen() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-6 px-6 py-4 lg:px-12">
          <Brand href="/" />
          <nav aria-label="Marketing" className="flex items-center gap-5 text-[13.5px] font-medium lg:gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden text-muted transition-colors hover:text-ink sm:block"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/dashboard" className="text-muted transition-colors hover:text-ink">
              Sign in
            </Link>
            <ButtonLink href="/onboarding">Find My IELTS Level</ButtonLink>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="mx-auto max-w-[1080px] px-6 pb-20 pt-16 text-center lg:px-12 lg:pt-24">
          <p className="mb-7 inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
            <span className="size-1.5 rounded-pill bg-accent" aria-hidden="true" />
            AI coaching for IELTS Academic · Reading &amp; Writing
          </p>
          <h1 className="mx-auto mb-6 max-w-[800px] font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[44px] lg:text-[52px]">
            Stop guessing why you&rsquo;re stuck at your IELTS band.
          </h1>
          <p className="mx-auto mb-9 max-w-[560px] text-base leading-relaxed text-muted sm:text-lg">
            Your AI IELTS coach finds your weaknesses, builds your practice plan, and tracks your
            path to your target band.
          </p>
          <div className="mb-16 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/onboarding" size="lg" className="rounded-lg px-[30px] py-3.5 text-[15px]">
              Find My IELTS Level
            </ButtonLink>
            <ButtonLink
              href="/practice"
              variant="secondary"
              size="lg"
              className="rounded-lg px-[30px] py-3.5 text-[15px] text-ink"
            >
              Explore Practice
            </ButtonLink>
          </div>

          <Card
            tone="dark"
            className="flex flex-col gap-8 rounded-4xl p-9 text-left shadow-hero lg:flex-row lg:items-center lg:gap-12"
          >
            <div className="shrink-0">
              <EyebrowLabel tone="faint" className="mb-2 tracking-[0.08em]">
                Your current estimated band
              </EyebrowLabel>
              <p className="tnum font-display text-[54px] font-bold leading-none tracking-[-0.03em]">
                6.0
              </p>
              <p className="mt-2.5 text-[13px] font-medium text-accent-gold">
                Target 7.0 · exam in 8 weeks
              </p>
            </div>
            <div className="hidden w-px self-stretch bg-on-dark-line lg:block" aria-hidden="true" />
            <div className="flex-1">
              <EyebrowLabel tone="gold" className="mb-2.5 tracking-[0.08em]">
                Biggest blocker
              </EyebrowLabel>
              <p className="mb-2 font-display text-xl font-semibold">Coherence &amp; Cohesion</p>
              <p className="text-[13.5px] leading-relaxed text-on-dark-muted">
                You have made 23 related mistakes in your last 8 writing submissions. Here&rsquo;s
                the 35-minute plan to fix it.
              </p>
            </div>
            <ul className="flex shrink-0 flex-col gap-2 text-[13px] font-medium">
              {[
                ['10 min', 'Topic sentence practice'],
                ['10 min', 'Paragraph organization'],
                ['15 min', 'Rewrite previous paragraph'],
              ].map(([minutes, label]) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="tnum font-display text-xs font-semibold text-accent-gold">
                    {minutes}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section id="how" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-[1080px] px-6 py-20 lg:px-12">
            <EyebrowLabel tone="accent" className="mb-3">
              How it works
            </EyebrowLabel>
            <h2 className="mb-12 max-w-[520px] font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">
              A coach that diagnoses before it prescribes.
            </h2>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((item) => (
                <li key={item.step}>
                  <p className="mb-3 font-display text-[13px] font-bold text-accent">{item.step}</p>
                  <p className="mb-1.5 text-[15px] font-semibold">{item.title}</p>
                  <p className="text-[13px] leading-relaxed text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="writing" className="border-t border-line">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-12 px-6 py-20 lg:flex-row lg:items-center lg:gap-16 lg:px-12">
            <div className="flex-1">
              <EyebrowLabel tone="accent" className="mb-3">
                Writing AI feedback
              </EyebrowLabel>
              <h2 className="mb-4 font-display text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">
                Examiner-style feedback on every sentence.
              </h2>
              <p className="mb-6 text-[14.5px] leading-relaxed text-muted">
                Submit an essay and get a band estimate across all four IELTS criteria,
                sentence-level corrections, and higher-band rewrites — with the reasoning behind
                each one.
              </p>
              <Link
                href="/writing/sub_task2_d2/analysis"
                className="text-sm font-semibold text-accent hover:text-accent-hover"
              >
                See a sample analysis →
              </Link>
            </div>

            <Card className="flex-1 p-7 shadow-lift">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <CardTitle as="h3" className="text-[13px]">
                  Criteria breakdown
                </CardTitle>
                <span className="tnum font-display text-base font-bold text-accent">Band 6.0</span>
              </div>
              <ul className="flex flex-col gap-3">
                {CRITERIA.map((criterion) => (
                  <li key={criterion.label} className="flex items-center gap-3">
                    <span
                      className={
                        'w-[120px] shrink-0 text-[12.5px] sm:w-[150px] ' +
                        (criterion.weak ? 'font-semibold text-bad' : 'font-medium')
                      }
                    >
                      {criterion.label}
                    </span>
                    <ProgressBar
                      value={criterion.fill}
                      tone={criterion.tone}
                      height={5}
                      className="flex-1"
                      label={criterion.label}
                    />
                    <span
                      className={
                        'tnum shrink-0 font-display text-[12.5px] font-bold ' +
                        (criterion.weak ? 'text-bad' : '')
                      }
                    >
                      {criterion.band}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg border border-accent-soft-line bg-accent-soft px-3.5 py-3 text-xs leading-relaxed text-accent-ink">
                <strong className="font-semibold">Why:</strong> your ideas are relevant, but
                paragraph progression is inconsistent.
              </p>
            </Card>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-[1080px] gap-6 px-6 py-20 lg:grid-cols-3 lg:px-12">
            <Card tone="sunken" className="border-line bg-paper p-7">
              <CardTitle as="h3" className="mb-2">
                Mistake analysis
              </CardTitle>
              <p className="mb-4 text-[13px] leading-relaxed text-muted">
                Every error joins your personal Error Bank, grouped into patterns you can actually
                fix.
              </p>
              <ul className="flex flex-col gap-1.5 text-[12.5px] font-medium">
                {[
                  ['Grammar', '42', 'text-accent'],
                  ['Vocabulary', '21', ''],
                  ['Coherence', '18', ''],
                ].map(([label, count, tone]) => (
                  <li key={label} className={'flex justify-between ' + (tone ? '' : 'text-muted')}>
                    <span>{label}</span>
                    <span className={'tnum font-display text-[13px] font-bold ' + tone}>{count}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card tone="sunken" className="border-line bg-paper p-7">
              <CardTitle as="h3" className="mb-2">
                Progress you can trust
              </CardTitle>
              <p className="mb-4 text-[13px] leading-relaxed text-muted">
                Band journey, skill trends and per-question-type accuracy — not vanity streaks.
              </p>
              <div className="flex items-center gap-2.5">
                <span className="tnum font-display text-xl font-bold text-muted">61%</span>
                <Icon name="arrow-right" size={16} className="text-faint" />
                <span className="tnum font-display text-xl font-bold">84%</span>
                <span className="tnum ml-auto text-[13px] font-semibold text-good">+23%</span>
              </div>
            </Card>

            <Card tone="sunken" className="border-line bg-paper p-7">
              <CardTitle as="h3" className="mb-2">
                Real mock tests
              </CardTitle>
              <p className="mb-4 text-[13px] leading-relaxed text-muted">
                Full, mini and skill-specific mocks in a distraction-free, exam-faithful interface.
              </p>
              <ul className="flex flex-wrap gap-2 text-[11.5px] font-medium">
                {['Full · 60 min', 'Mini · 20 min', 'Skill · 15 min'].map((chip) => (
                  <li
                    key={chip}
                    className="rounded-pill border border-line bg-surface px-2.5 py-1"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section id="pricing" className="border-t border-line">
          <div className="mx-auto max-w-[840px] px-6 py-20 text-center lg:px-12">
            <h2 className="mb-10 font-display text-[26px] font-semibold tracking-[-0.02em] sm:text-[30px]">
              Simple pricing
            </h2>
            <div className="grid gap-5 text-left sm:grid-cols-2">
              <Card className="rounded-3xl p-8">
                <CardTitle as="h3" className="mb-1.5">
                  Free
                </CardTitle>
                <p className="mb-4 font-display text-[32px] font-bold">$0</p>
                <ul className="mb-5 flex flex-col gap-1.5 text-[13px] leading-relaxed text-muted">
                  <li>Diagnostic test &amp; skill map</li>
                  <li>1 daily practice session</li>
                  <li>2 AI essay reviews per month</li>
                </ul>
                <ButtonLink href="/onboarding" variant="secondary" className="w-full text-ink">
                  Start free
                </ButtonLink>
              </Card>

              <Card className="relative rounded-3xl border-[1.5px] border-accent p-8">
                <span className="absolute -top-2.5 left-7 rounded-pill bg-accent px-3 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-on-dark">
                  Most popular
                </span>
                <CardTitle as="h3" className="mb-1.5">
                  Coach
                </CardTitle>
                <p className="mb-4 flex items-baseline gap-1 font-display text-[32px] font-bold">
                  $19
                  <span className="font-sans text-[13px] font-normal text-faint">/ month</span>
                </p>
                <ul className="mb-5 flex flex-col gap-1.5 text-[13px] leading-relaxed text-muted">
                  <li>Unlimited practice &amp; mocks</li>
                  <li>Unlimited AI essay analysis</li>
                  <li>Full Error Bank &amp; adaptive plan</li>
                  <li>AI Coach conversations</li>
                </ul>
                <ButtonLink href="/onboarding" className="w-full">
                  Start 7-day trial
                </ButtonLink>
              </Card>
            </div>
          </div>
        </section>

        <footer className="border-t border-line bg-ink">
          <div className="mx-auto max-w-[1080px] px-6 py-16 text-center lg:px-12">
            <h2 className="mb-3 font-display text-[24px] font-semibold tracking-[-0.02em] text-on-dark sm:text-[28px]">
              Find out what&rsquo;s holding you back.
            </h2>
            <p className="mb-7 text-sm text-on-dark-faint">
              Free 30-minute diagnostic. No credit card.
            </p>
            <ButtonLink
              href="/onboarding"
              variant="accent"
              size="lg"
              className="rounded-lg px-[30px] py-3.5 text-[15px]"
            >
              Find My IELTS Level
            </ButtonLink>
            <div className="mt-12 flex flex-wrap justify-center gap-7 border-t border-on-dark-line pt-7 text-xs text-on-dark-dim">
              <span>© 2026 Bandline</span>
              <Link href="/" className="text-on-dark-dim hover:text-on-dark-muted">
                Privacy
              </Link>
              <Link href="/" className="text-on-dark-dim hover:text-on-dark-muted">
                Terms
              </Link>
              <Link href="/" className="text-on-dark-dim hover:text-on-dark-muted">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
