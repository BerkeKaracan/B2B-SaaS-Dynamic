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

const inter = Inter({ subsets: ['latin'] });

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'B2 SaaS Engine — Workspace OS',
    template: '%s · B2 SaaS Engine',
  },
  description:
    'The operating system for your company. Spatial canvas, real-time sync, enterprise RBAC, and workspace AI — multi-tenant SaaS built for teams.',
  applicationName: 'B2 SaaS Engine',
  keywords: [
    'B2B SaaS',
    'workspace OS',
    'spatial canvas',
    'multi-tenant',
    'project management',
    'RBAC',
  ],
  authors: [{ name: 'B2 SaaS Engine' }],
  creator: 'B2 SaaS Engine',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['tr_TR'],
    url: siteUrl,
    siteName: 'B2 SaaS Engine',
    title: 'B2 SaaS Engine — Workspace OS',
    description:
      'Spatial canvas, real-time sync, and enterprise RBAC. Ship company workflows without rebuilding your stack.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'B2 SaaS Engine — Workspace OS',
    description:
      'Spatial canvas, real-time sync, and enterprise RBAC for modern B2B teams.',
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
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
