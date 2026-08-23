import type { Metadata } from 'next';
import { AttemptLauncher } from '@/features/reading/attempt-launcher';

export const metadata: Metadata = { title: 'Mock Test' };

export default async function MockSessionPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  return <AttemptLauncher testId={testId} mode="mock" basePath="/mock" />;
}
