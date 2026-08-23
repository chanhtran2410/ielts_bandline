import type { Metadata } from 'next';
import { ErrorBankScreen } from '@/features/mistakes/error-bank-screen';

export const metadata: Metadata = { title: 'My Mistakes' };

export default function MistakesPage() {
  return <ErrorBankScreen />;
}
