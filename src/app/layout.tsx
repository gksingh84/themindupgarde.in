import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { LayoutWrapper } from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: {
    default: 'The Mind Upgrade | Fresh Insights for a Smarter Life',
    template: '%s | The Mind Upgrade',
  },
  description:
    'A premium independent publishing platform exploring Personal Finance, Insurance, Psychology, Economy, and Practical Daily Wisdom.',
  keywords: [
    'The Mind Upgrade',
    'Personal Finance',
    'Insurance Guide',
    'Psychology and Decision Making',
    'Economy and Current Affairs',
    'Daily Insights',
    'Financial Literacy',
    'Mental Models',
    'themindupgrade.in',
  ],
  authors: [{ name: 'The Mind Upgrade Team', url: 'https://themindupgrade.in' }],
  metadataBase: new URL('https://themindupgrade.in'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'The Mind Upgrade | Fresh Insights for a Smarter Life',
    description:
      'Discover practical insights on money, psychology, economics and everyday life. Because better understanding leads to better decisions.',
    url: 'https://themindupgrade.in',
    siteName: 'The Mind Upgrade',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'The Mind Upgrade Emblem',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Mind Upgrade',
    description: 'Fresh Insights for a Smarter Life',
    images: ['/logo.png'],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://themindupgrade.in/#website',
                  url: 'https://themindupgrade.in',
                  name: 'The Mind Upgrade',
                  description:
                    'A premium independent publishing platform exploring Personal Finance, Insurance, Psychology, Economy, and Practical Daily Wisdom.',
                  publisher: {
                    '@id': 'https://themindupgrade.in/#organization',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://themindupgrade.in/#organization',
                  name: 'The Mind Upgrade',
                  url: 'https://themindupgrade.in',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://themindupgrade.in/logo.png',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className="min-h-screen flex flex-col antialiased selection:bg-amber-500 selection:text-white bg-[#FAFAF7] text-[#252B32] dark:bg-[#0E1724] dark:text-[#E2E8F0] transition-colors duration-200"
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
