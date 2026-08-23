import type { Metadata } from 'next';
import { WritingEditorScreen } from '@/features/writing/writing-editor-screen';

export const metadata: Metadata = { title: 'Writing Editor' };

export default async function WritingEditorPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <WritingEditorScreen submissionId={submissionId} />;
}
