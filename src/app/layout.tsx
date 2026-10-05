import type { Metadata } from 'next';
import { Instrument_Serif, Work_Sans, Poppins } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { LayoutWrapper } from '@/components/LayoutWrapper';

const spaceGrotesk = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

const inter = Work_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'The Mind Upgrade | Level Up Your Mind, One Idea at a Time',
    template: '%s | The Mind Upgrade',
  },
  description:
    'A modern publication for growth-minded thinkers. Explore mental models, deep work protocols, AI technology, health neurobiology, and financial sovereignty.',
  keywords: [
    'The Mind Upgrade',
    'Mental Models',
    'Productivity Systems',
    'Deep Work',
    'Stoic Philosophy',
    'AI Technology',
    'Self Improvement',
    'themindupgrade.in',
  ],
  authors: [{ name: 'The Mind Upgrade Team', url: 'https://themindupgrade.in' }],
  metadataBase: new URL('https://themindupgrade.in'),
  openGraph: {
    title: 'The Mind Upgrade | Level Up Your Mind, One Idea at a Time',
    description:
      'High-leverage mental models, productivity, tech, and philosophy for intentional thinkers.',
    url: 'https://themindupgrade.in',
    siteName: 'The Mind Upgrade',
    images: [
      {
        url: '/images/deep-work.svg',
        width: 1200,
        height: 630,
        alt: 'The Mind Upgrade Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Mind Upgrade',
    description: 'Level Up Your Mind, One Idea at a Time.',
    images: ['/images/deep-work.svg'],
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white text-slate-900 dark:text-slate-100"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ToastProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
