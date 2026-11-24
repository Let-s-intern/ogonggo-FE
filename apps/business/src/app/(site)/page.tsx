import type { Metadata } from 'next';
import {
  CONTACT_EMAIL,
  OGONGGO_WEB_ORIGIN,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
} from '@/shared/config/site';
import { FAQ, PLACEMENT_PAGES, PLACEMENTS } from '@/widgets/landing/content';
import { LandingPage } from '@/widgets/landing/LandingPage';
import { loadPlacementPrices } from '@/widgets/landing/loadPlacementPrices';
import type { PlacementPrices } from '@/widgets/landing/price';

/** 가격은 어드민에서 바뀌므로 소개 화면을 5분마다 다시 만든다. 정적 분석 때문에 숫자로 적고, 값은 `loadPlacementPrices` 의 `PLACEMENT_PRICE_REVALIDATE` 와 같다. */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * 검색 결과에 회사·상품·FAQ 를 함께 알린다. 화면에 보이는 내용과 같은 값만 싣는다. 가격이 없는(견적 문의) 상품은
 * 가격 없이 알리지 않고 뺀다.
 */
const buildJsonLd = (prices: PlacementPrices) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: '오늘의 공고',
      url: OGONGGO_WEB_ORIGIN,
      email: CONTACT_EMAIL,
      logo: `${SITE_ORIGIN}/icon.svg`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: SITE_NAME,
      url: SITE_ORIGIN,
      inLanguage: 'ko-KR',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
    {
      '@type': 'Service',
      name: '채용공고·교육 모집 광고',
      serviceType: '채용 광고',
      description: SITE_DESCRIPTION,
      provider: { '@id': `${SITE_ORIGIN}/#organization` },
      areaServed: 'KR',
      offers: PLACEMENT_PAGES.flatMap((page) => page.spots).flatMap((spot) => {
        const product = PLACEMENTS.find((p) => p.id === spot.productId);
        const price = prices[spot.position];
        if (!product || price == null) return [];
        return [
          {
            '@type': 'Offer',
            name: product.title,
            price,
            priceCurrency: 'KRW',
            description: `1주 · VAT 별도. ${product.description.join(' ')}`,
          },
        ];
      }),
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
});

export default async function Page() {
  const prices = await loadPlacementPrices();
  return (
    <>
      <script
        type="application/ld+json"
        // 정적 상수만 직렬화한다. `<` 를 이스케이프해 스크립트 태그가 닫히지 않게 한다.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd(prices)).replace(/</g, '\\u003c'),
        }}
      />
      <LandingPage placementPrices={prices} />
    </>
  );
}
