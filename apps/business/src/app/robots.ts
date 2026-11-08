import type { MetadataRoute } from 'next';
import { IS_INDEXABLE_DEPLOYMENT, SITE_ORIGIN } from '@/shared/config/site';

/** 운영이 아닌 배포본은 전부 막는다. 신청서는 입력 절차라 수집할 내용이 없어 막는다. */
export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE_DEPLOYMENT) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/apply/ad', '/api/'] },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
