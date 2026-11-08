import type { Metadata } from 'next';
import {
  CONTACT_EMAIL,
  OGONGGO_WEB_ORIGIN,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
} from '@/shared/config/site';
import { FAQ, PLACEMENTS } from '@/widgets/landing/content';
import { LandingPage } from '@/widgets/landing/LandingPage';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** 검색 결과에 회사·상품·FAQ 를 함께 알린다. 화면에 보이는 내용과 같은 값만 싣는다. */
const jsonLd = {
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
      offers: PLACEMENTS.map((p) => ({
        '@type': 'Offer',
        name: p.title,
        price: p.price,
        priceCurrency: 'KRW',
        description: `1주 · VAT 별도. ${p.description.join(' ')}`,
      })),
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
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // 정적 상수만 직렬화한다. `<` 를 이스케이프해 스크립트 태그가 닫히지 않게 한다.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <LandingPage />
    </>
  );
}
