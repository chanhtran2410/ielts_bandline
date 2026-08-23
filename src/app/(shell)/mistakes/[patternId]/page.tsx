import type { Metadata } from 'next';
import { MistakeDetailScreen } from '@/features/mistakes/mistake-detail-screen';

export const metadata: Metadata = { title: 'Mistake' };

export default async function MistakeDetailPage({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  return <MistakeDetailScreen patternId={patternId} />;
}
