/**
 * `matches`는 그 메뉴에 밑줄이 붙는 경로들이다. 채용공고는 목록(`/`)과 상세(`/jobs/1`)가
 * 경로 접두사를 공유하지 않아 따로 적는다 — 접두사만 보면 `/`가 모든 경로에 걸린다.
 *
 * `mobileLabel` 은 모바일 헤더 탭의 글자다. 시안(`docs/asset/v9 mobile/`)은 가운뎃점 앞뒤를 띄운다.
 */
export const NAV_ITEMS = [
  {
    href: '/',
    label: '채용공고',
    mobileLabel: '채용공고',
    matches: (path: string) => path === '/' || path.startsWith('/jobs'),
  },
  {
    href: '/bootcamps',
    label: '교육·부트캠프',
    mobileLabel: '교육 · 부트캠프',
    matches: (path: string) => path.startsWith('/bootcamps'),
  },
  {
    href: '/side-studies',
    label: '사이드·스터디',
    mobileLabel: '사이드 · 스터디',
    matches: (path: string) => path.startsWith('/side-studies'),
  },
] as const;
