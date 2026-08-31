import { REAL_JOB_SEEDS } from '@ogonggo/api/src/mocks/fixtures/real-jobs-seed';

/**
 * 회사명 → 실제 로고 이미지 URL. `REAL_JOB_SEEDS`(크롤러 운영 DB의 `companies.logo_url`,
 * 크롤러가 실제로 수집해 둔 값)에서 회사명별로 한 번만 뽑아 맵으로 만든다 — 도메인을
 * 추측하지 않는다. 크롤러가 그 회사의 로고를 못 찾았으면 여기 없고, `getCompanyLogoUrl`이
 * `undefined`를 돌려줘 컴포넌트가 회색 placeholder로 그대로 둔다.
 *
 * (이전엔 도메인을 손으로 추측해 Clearbit Logo API로 우회했는데, 이 개발 환경에서 확실한
 * 도메인들(samsung.com 등)도 전부 로드 실패하는 걸 실측으로 확인해 — Clearbit이 2024년
 * 이후 접근 제한된 것으로 보인다 — 크롤러가 직접 수집한 로고로 완전히 대체했다.)
 */
const COMPANY_LOGO_URLS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const seed of REAL_JOB_SEEDS) {
    if (seed.logoUrl && !map[seed.company]) {
      map[seed.company] = seed.logoUrl;
    }
  }
  return map;
})();

export function getCompanyLogoUrl(companyName: string): string | undefined {
  return COMPANY_LOGO_URLS[companyName];
}
