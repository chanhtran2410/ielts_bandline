'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { CoachMessage } from '@/types/coach';
import { track } from '@/lib/analytics';
import { queryKeys } from '@/lib/query-client';
import { createLocalId } from '@/utils/id';
import { coachService } from '@/services/coach.service';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ErrorState, LoadingState, Spinner } from '@/components/ui/states';
import { CoachMessageBubble } from '@/components/coach/coach-message';

export function CoachScreen() {
  const [draft, setDraft] = useState('');
  /**
   * Only the turns added in this session live in state; the seeded history stays
   * owned by the query. Composing the two at render avoids copying server data
   * into state with an effect.
   */
  const [appended, setAppended] = useState<CoachMessage[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const sessionQuery = useQuery({
    queryKey: queryKeys.coachSession,
    queryFn: () => coachService.getSession(),
    staleTime: Infinity,
  });

  // The learning context is fetched, never derived here (§18).
  const contextQuery = useQuery({
    queryKey: queryKeys.coachContext,
    queryFn: () => coachService.getContext(),
    staleTime: 60_000,
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const context = contextQuery.data ?? (await coachService.getContext());
      return coachService.sendMessage(text, context);
    },
    onSuccess: (reply) => {
      setAppended((prev) => [...prev, reply]);
    },
    onError: () => {
      setSendError("Your coach couldn't reply. Your message is still in the box — try again.");
    },
  });

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setSendError(null);
    track({ name: 'ai_coach_message_sent', characters: trimmed.length });

    const userMessage: CoachMessage = {
      id: createLocalId('msg'),
      role: 'user',
      paragraphs: [trimmed],
      recommendations: [],
      recommendationsAfter: 0,
      createdAt: new Date().toISOString(),
      status: 'complete',
    };
    setAppended((prev) => [...prev, userMessage]);
    setDraft('');
    send.mutate(trimmed);
  }

  const isPending = send.isPending;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [appended, isPending]);

  if (sessionQuery.isPending) {
    return <LoadingState title="Opening your coach…" detail="Loading what it knows about you." />;
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <ErrorState
        title="We couldn't reach your coach."
        detail="Your progress is unaffected. Try again in a moment."
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  const session = sessionQuery.data;
  const messages = [...session.messages, ...appended];

  return (
    <div className="flex h-full min-h-dvh flex-col lg:h-dvh lg:min-h-0">
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-paper px-5 py-4 sm:px-8">
        <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-ink" aria-hidden="true">
          <Icon name="sparkle" size={15} className="text-accent-gold" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-sm font-semibold">Your coach</h1>
          <p className="truncate text-[11.5px] text-faint">{session.contextSummary}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-8">
        <ul className="mx-auto flex max-w-[680px] flex-col gap-5 px-5 sm:px-8">
          {messages.map((message) => (
            <CoachMessageBubble key={message.id} message={message} />
          ))}

          {send.isPending ? (
            <li className="flex items-center gap-3 text-[13px] text-faint">
              <Spinner className="size-4" />
              Thinking about your last 12 tests and 90 mistakes…
            </li>
          ) : null}
        </ul>
        <div ref={endRef} />
      </div>

      <div className="shrink-0 px-5 pb-6 sm:px-8">
        <div className="mx-auto max-w-[680px]">
          {sendError ? (
            <p role="alert" className="mb-3 text-[12.5px] font-medium text-bad">
              {sendError}
            </p>
          ) : null}

          <div className="mb-3 flex flex-wrap gap-2">
            {session.suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submit(prompt)}
                disabled={send.isPending}
                className="rounded-pill border border-line bg-surface px-3.5 py-[7px] text-[12.5px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface py-1.5 pl-[18px] pr-1.5 shadow-card"
          >
            <label htmlFor="coach-input" className="sr-only">
              Ask your coach
            </label>
            <input
              id="coach-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about your progress, mistakes, or study plan…"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-ink placeholder:text-faint focus:outline-none"
            />
            <Button
              type="submit"
              aria-label="Send message"
              disabled={draft.trim() === '' || send.isPending}
              className="size-9 shrink-0 rounded-lg p-0"
            >
              <Icon name="arrow-up" size={15} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
