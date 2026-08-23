import type { Metadata } from 'next';
import { AttemptResultScreen } from '@/features/reading/attempt-result-screen';

export const metadata: Metadata = { title: 'Mock Result' };

export default async function MockResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return (
    <AttemptResultScreen
      attemptId={attemptId}
      backHref="/mock"
      backLabel="Back to mock tests"
      practiceHref="/practice/session/test_drill_headings"
    />
  );
}
