import { SITE_ORIGIN } from '@/shared/config/site';

/**
 * 홈에 싣는 `Organization`·`WebSite` 구조화 데이터.
 *
 * 검색 엔진과 AI 검색이 "오늘의 공고" 가 누구의 어떤 서비스인지, 사이트 검색을 어떤 주소로
 * 하는지 읽는다. 운영 주체 값은 푸터(`widgets/site-footer`)와 같다.
 *
 * 검색 주소는 홈의 `q` 다(`app/(site)/(home)/page.tsx`).
 */
export function buildSiteJsonLd(): Record<string, unknown> {
  const home = `${SITE_ORIGIN}/`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${home}#organization`,
        name: '오늘의 공고',
        alternateName: '오공고',
        url: home,
        logo: `${SITE_ORIGIN}/icon-512.png`,
        email: 'official@letscareer.co.kr',
        parentOrganization: {
          '@type': 'Organization',
          name: '렛츠커리어',
          url: 'https://www.letscareer.co.kr',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        name: '오늘의 공고',
        alternateName: '오공고',
        url: home,
        inLanguage: 'ko-KR',
        description: '커리어 여정에 딱 맞는 채용공고, 교육·부트캠프, 사이드·스터디를 모아 봅니다.',
        publisher: { '@id': `${home}#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${home}?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}
