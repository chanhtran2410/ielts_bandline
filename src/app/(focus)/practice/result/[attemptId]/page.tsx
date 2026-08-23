import type { Metadata } from 'next';
import { AttemptResultScreen } from '@/features/reading/attempt-result-screen';

export const metadata: Metadata = { title: 'Practice Result' };

export default async function PracticeResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return (
    <AttemptResultScreen
      attemptId={attemptId}
      backHref="/dashboard"
      backLabel="Back to dashboard"
      practiceHref="/practice/session/test_drill_headings"
    />
  );
}
