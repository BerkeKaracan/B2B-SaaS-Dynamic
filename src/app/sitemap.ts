import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getSiteUrl } from '@/lib/siteUrl';

/** Public marketing / docs paths (no auth). Locale prefix applied below. */
const PUBLIC_PATHS = [
  '',
  '/pricing',
  '/features',
  '/docs',
  '/changelog',
  '/blog',
  '/templates',
  '/community',
  '/integrations',
  '/about',
  '/careers',
  '/contact',
  '/privacy',
  '/terms',
  '/demo',
  '/solutions/engineering',
  '/solutions/hr',
  '/solutions/sales',
  '/solutions/operations',
  '/platform/canvas',
  '/platform/sync',
  '/platform/rbac',
  '/platform/storage',
] as const;

function localizedUrl(site: string, locale: string, path: string): string {
  const normalized = path === '' ? '' : path;
  if (locale === routing.defaultLocale) {
    return `${site}${normalized || '/'}`;
  }
  return `${site}/${locale}${normalized}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of PUBLIC_PATHS) {
      const isHome = path === '';
      entries.push({
        url: localizedUrl(site, locale, path),
        lastModified,
        changeFrequency: isHome ? 'weekly' : 'monthly',
        priority: isHome ? 1 : path.startsWith('/pricing') ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
