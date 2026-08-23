import type { Metadata } from 'next';
import { WritingCatalogScreen } from '@/features/writing/writing-catalog-screen';

export const metadata: Metadata = { title: 'Writing' };

export default function WritingPage() {
  return <WritingCatalogScreen />;
}
