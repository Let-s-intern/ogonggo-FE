import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/shared/config/site';

/** robots 가 막는 `/apply/ad` 는 싣지 않는다. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_ORIGIN}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_ORIGIN}/apply`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
