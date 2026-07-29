import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import CookieConsent from '@/components/CookieConsent';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/ThemeProvider';
import WakeUpBackend from '@/components/WakeUpBackend';
import { getSiteUrl } from '@/lib/siteUrl';
import {
  BRAND_DESCRIPTION,
  BRAND_NAME,
  BRAND_TITLE,
  BRAND_TITLE_TEMPLATE,
} from '@/lib/brand';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = getSiteUrl();
/** Skip Vercel beacons outside Vercel (Docker/local) — prevents script/network noise. */
const enableVercelMetrics = process.env.VERCEL === '1';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: BRAND_TITLE,
    template: BRAND_TITLE_TEMPLATE,
  },
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  keywords: [
    'WORKSPACE OS',
    'workspace OS',
    'spatial canvas',
    'multi-tenant',
    'project management',
    'RBAC',
  ],
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  manifest: '/manifest.json',
  icons: {
    // Prefer App Router generated icons (same B2 mark as BrandMark / logo.svg)
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['tr_TR'],
    url: siteUrl,
    siteName: BRAND_NAME,
    title: BRAND_TITLE,
    description:
      'Spatial canvas, real-time sync, and enterprise RBAC. Ship company workflows without rebuilding your stack.',
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE,
    description:
      'Spatial canvas, real-time sync, and enterprise RBAC for modern teams.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.className} suppressHydrationWarning>
      <head></head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <WakeUpBackend />
            {children}
            <CookieConsent />
            <Toaster position="bottom-right" />
            {enableVercelMetrics ? (
              <>
                <Analytics />
                <SpeedInsights />
              </>
            ) : null}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
