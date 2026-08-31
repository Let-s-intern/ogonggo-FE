/**
 * 회사명 → 실제 로고(파비콘) 이미지 URL. 크롤러(`job-crawler-automation`)의
 * `normalized_jobs`에는 로고 필드가 없어 이 목록은 직접 확인한 것이다 — 확신 있는 대기업(삼성·
 * LG 계열·현대자동차·롯데 일부·SK 일부)만 넣었고, 나머지는 여기 없으므로 `getCompanyLogoUrl`이
 * `undefined`를 돌려줘 컴포넌트가 회색 placeholder로 그대로 둔다 — 확신 없는 회사 도메인을
 * 지어내지 않는다.
 *
 * `https://logo.clearbit.com/{domain}`을 먼저 썼다가 이 개발 환경(Chrome 확장 포함)에서
 * 매핑해둔 도메인 전부(samsung.com·hyundai.com 등 확실한 것들도) 로드 실패하는 것을 실측으로
 * 확인했다 — Clearbit Logo API가 2024년 이후 접근 제한된 것으로 보인다. 구글 파비콘 서비스
 * (`https://www.google.com/s2/favicons?domain={domain}&sz=128`)로 바꿔 같은 도메인 목록으로
 * 실제 로드되는 것까지 확인했다. 다만 이건 정식 로고가 아니라 그 사이트의 파비콘이라 해상도가
 * 낮을 수 있다(회사에 따라 16~128px) — 로고 필드 자체가 없는 크롤러 데이터의 현실적인 대안이다.
 */
const COMPANY_DOMAINS: Record<string, string> = {
  현대자동차: 'hyundai.com',
  '삼성전자 DX부문': 'samsung.com',
  '삼성전자 DS부문': 'samsung.com',
  삼성디스플레이: 'samsungdisplay.com',
  LG유플러스: 'lguplus.com',
  'LG CNS': 'lgcns.com',
  LG전자: 'lge.com',
  LG화학: 'lgchem.com',
  LG이노텍: 'lginnotek.com',
  LG에너지솔루션: 'lgensol.com',
  롯데월드: 'lotteworld.com',
  롯데케미칼: 'lottechem.com',
  'SK hynix': 'skhynix.com',
  'SK telecom': 'sktelecom.com',
  'SK on': 'skon.com',
  'SK ecoplant': 'skecoplant.com',
  'SK networks service': 'sknetworks.co.kr',
};

export function getCompanyLogoUrl(companyName: string): string | undefined {
  const domain = COMPANY_DOMAINS[companyName];
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : undefined;
}
