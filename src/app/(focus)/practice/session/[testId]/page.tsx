import type { Metadata } from 'next';
import { AttemptLauncher } from '@/features/reading/attempt-launcher';

export const metadata: Metadata = { title: 'Reading Practice' };

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  return <AttemptLauncher testId={testId} mode="practice" basePath="/practice" />;
}
