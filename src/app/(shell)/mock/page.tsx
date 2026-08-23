import type { Metadata } from 'next';
import { PracticeCatalogScreen } from '@/features/reading/practice-catalog-screen';

export const metadata: Metadata = { title: 'Mock Tests' };

export default function MockPage() {
  return <PracticeCatalogScreen mode="mock" />;
}
