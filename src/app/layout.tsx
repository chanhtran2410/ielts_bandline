import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Sora } from 'next/font/google';
import { AppProviders } from '@/components/layout/app-providers';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Bandline — AI IELTS coach',
    template: '%s · Bandline',
  },
  description:
    'Your AI IELTS coach finds your weaknesses, builds your practice plan, and tracks your path to your target band.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafaf8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable + ' ' + instrumentSans.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-on-dark"
        >
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
