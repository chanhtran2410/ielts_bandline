import type { Metadata } from 'next';
import { WritingAnalysisScreen } from '@/features/writing/writing-analysis-screen';

export const metadata: Metadata = { title: 'AI Analysis' };

export default async function WritingAnalysisPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <WritingAnalysisScreen submissionId={submissionId} />;
}
