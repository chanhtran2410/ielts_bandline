'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WritingIssue } from '@/types/writing';
import { track } from '@/lib/analytics';
import { formatBand } from '@/lib/band';
import { formatShortDate } from '@/lib/date';
import { queryKeys } from '@/lib/query-client';
import { writingService } from '@/services/writing.service';
import { ResultTopBar } from '@/components/layout/exam-shell';
import { EyebrowLabel } from '@/components/ui/badge';
import { Card, CardHeader, CardNote, CardTitle } from '@/components/ui/card';
import { AsyncBoundary, ErrorState, LoadingState } from '@/components/ui/states';
import { AnnotatedEssay } from '@/components/writing/annotated-essay';
import { CriteriaBreakdown, CriteriaDetail } from '@/components/writing/criteria-breakdown';
import { IssueDetailCard } from '@/components/writing/issue-detail-card';
import { SentenceLadderCard } from '@/components/writing/sentence-ladder';

export function WritingAnalysisScreen({ submissionId }: { submissionId: string }) {
  const queryClient = useQueryClient();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);

  const submissionQuery = useQuery({
    queryKey: queryKeys.writingSubmission(submissionId),
    queryFn: () => writingService.getSubmission(submissionId),
    staleTime: Infinity,
  });

  const feedbackQuery = useQuery({
    queryKey: queryKeys.writingFeedback(submissionId),
    queryFn: async () => {
      const result = await writingService.getFeedback(submissionId);
      track({ name: 'writing_feedback_viewed', submissionId, band: result.overallBand });
      return result;
    },
    staleTime: Infinity,
    retry: 0,
  });

  const applyFix = useMutation({
    mutationFn: async (issue: WritingIssue) => {
      const submission = submissionQuery.data;
      if (!submission) return;
      const next =
        submission.body.slice(0, issue.start) + issue.suggestion + submission.body.slice(issue.end);
      await writingService.saveDraft(submissionId, next, submission.timeSpentSeconds);
    },
    onSuccess: (_data, issue) => {
      setAppliedFixes((prev) => [...prev, issue.id]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.writingSubmission(submissionId) });
    },
  });

  const feedback = feedbackQuery.data;
  const selectedIssue = useMemo(() => {
    if (!feedback) return null;
    return feedback.issues.find((i) => i.id === selectedIssueId) ?? feedback.issues[0] ?? null;
  }, [feedback, selectedIssueId]);

  const selectedLadder = useMemo(() => {
    if (!feedback || !selectedIssue) return null;
    return (
      feedback.ladders.find((l) => l.issueId === selectedIssue.id) ?? feedback.ladders[0] ?? null
    );
  }, [feedback, selectedIssue]);

  return (
    <div className="min-h-dvh">
      <ResultTopBar
        backHref={'/writing/' + submissionId}
        backLabel="Back to editor"
        title="AI Analysis · Writing Task 2"
        caption={
          feedback
            ? 'Analyzed in ' +
              feedback.analysisSeconds +
              's · ' +
              formatShortDate(feedback.analyzedAt)
            : undefined
        }
      />

      <div className="mx-auto max-w-[920px] px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
        <AsyncBoundary
          isLoading={feedbackQuery.isPending || submissionQuery.isPending}
          isError={feedbackQuery.isError}
          data={feedback && submissionQuery.data ? { feedback, submission: submissionQuery.data } : undefined}
          loading={
            <LoadingState
              title="Analyzing your essay…"
              detail="Usually takes 10–20 seconds. We are scoring all four criteria and checking every sentence."
            />
          }
          error={
            <ErrorState
              title="We couldn't analyze your essay."
              detail="Your draft is safe and unchanged. This is almost always temporary."
              onRetry={() => void feedbackQuery.refetch()}
            />
          }
        >
          {({ feedback: fb, submission }) => (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Card
                  tone="dark"
                  className="flex shrink-0 flex-col items-center justify-center p-7 text-center sm:w-60"
                >
                  <EyebrowLabel tone="faint" className="mb-2.5 tracking-[0.08em]">
                    Estimated band
                  </EyebrowLabel>
                  <p className="tnum font-display text-[56px] font-bold leading-none tracking-[-0.03em] text-accent-gold">
                    {formatBand(fb.overallBand)}
                  </p>
                  <p className="mt-3 text-[12.5px] text-on-dark-muted">
                    {submission.wordCount} words · Draft {submission.draftNumber}
                  </p>
                </Card>

                <div className="min-w-0 flex-1">
                  <CriteriaBreakdown feedback={fb} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                <Card as="section" aria-labelledby="sentences-heading" className="p-6 sm:px-7">
                  <CardHeader className="mb-1">
                    <CardTitle id="sentences-heading">Sentence-level feedback</CardTitle>
                    <CardNote className="shrink-0">
                      {fb.issues.length} {fb.issues.length === 1 ? 'issue' : 'issues'} found
                    </CardNote>
                  </CardHeader>
                  <p className="mb-4 text-[12.5px] text-faint">
                    Select a highlighted sentence to see why it was flagged.
                  </p>
                  <AnnotatedEssay
                    body={submission.body}
                    issues={fb.issues}
                    selectedIssueId={selectedIssue?.id ?? null}
                    onSelectIssue={setSelectedIssueId}
                  />
                </Card>

                {selectedIssue ? (
                  <IssueDetailCard
                    issue={selectedIssue}
                    index={fb.issues.findIndex((i) => i.id === selectedIssue.id) + 1}
                    total={fb.issues.length}
                    onApplyFix={(issue) => applyFix.mutate(issue)}
                    applied={appliedFixes.includes(selectedIssue.id)}
                  />
                ) : null}
              </div>

              {selectedLadder ? <SentenceLadderCard ladder={selectedLadder} /> : null}

              <CriteriaDetail feedback={fb} />
            </div>
          )}
        </AsyncBoundary>
      </div>
    </div>
  );
}
