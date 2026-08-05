import type { MetadataRoute } from 'next';

import { MODULES } from '@/lib/marketing-content';

const BASE_URL = 'https://opsagenda.com';

const STATIC_ROUTES = [
  '',
  '/how',
  '/modules',
  '/security',
  '/pricing',
  '/about',
  '/changelog',
  '/waitlist',
  '/legal/privacy',
  '/legal/terms',
];

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const moduleRoutes = MODULES.map((module) => `/modules/${module.key}`);

  return [...STATIC_ROUTES, ...moduleRoutes].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
