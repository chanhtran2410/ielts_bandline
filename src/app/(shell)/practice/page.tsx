import type { Metadata } from 'next';
import { PracticeCatalogScreen } from '@/features/reading/practice-catalog-screen';

export const metadata: Metadata = { title: 'Practice' };

export default function PracticePage() {
  return <PracticeCatalogScreen mode="practice" />;
}
