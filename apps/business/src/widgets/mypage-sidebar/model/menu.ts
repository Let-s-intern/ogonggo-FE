/**
 * 기업 마이페이지 좌측 메뉴 한 줄. 모양은 web 의 `apps/web/src/widgets/mypage-sidebar/model/menu.ts` 와 같다.
 */
export interface MyPageMenuItem {
  href: string;
  label: string;
  /** 이 항목 위에 구분선을 둔다. 공고·광고 메뉴와 계정 메뉴를 가른다. */
  separated?: boolean;
}

/** 기업 마이페이지 첫 화면. 모바일은 사이드바가 곧 이 화면이다. */
export const COMPANY_MYPAGE_ROOT = '/mypage/company';

/**
 * 비즈니스 앱의 기업 마이페이지 메뉴(PRD `마이페이지 > 광고`, 시안 B-02). web 의 `COMPANY_MYPAGE_MENU` 에 `광고` 를
 * 더했다.
 *
 * 경로는 web 과 같은 `/mypage/company/...` 다. web 의 옛 주소를 같은 경로의 비즈니스 주소로 넘기기 위해서다
 * (`.claude/tasks/memos/결정-광고시스템-business-앱골격-2026-11-03.md`).
 *
 * **첫 항목이 바뀌면 `/mypage/company` 가 데스크톱에서 보내는 곳도 바뀐다**(`MYPAGE_HOME`).
 */
export const COMPANY_MYPAGE_MENU: readonly MyPageMenuItem[] = [
  { href: '/mypage/company/posts/jobs', label: '채용공고' },
  { href: '/mypage/company/posts/bootcamps', label: '부트캠프' },
  { href: '/mypage/company/ads', label: '광고' },
  { href: '/mypage/company/profile', label: '기업 정보', separated: true },
];

export const MYPAGE_HOME = COMPANY_MYPAGE_MENU[0]!.href;

export function isMyPageIndex(pathname: string): boolean {
  return pathname === COMPANY_MYPAGE_ROOT;
}

/**
 * 모바일 하위 화면 머리(`< 제목`)의 제목과 `<` 가 가는 곳. 제목은 각 `page.tsx` 의 `metadata.title` 과 같다.
 * 화면이 생길 때 여기에 한 줄씩 더한다.
 */
const MOBILE_HEADERS: readonly { pattern: RegExp; title: string; back: string }[] = [
  { pattern: /^\/mypage\/company\/posts\/jobs$/, title: '채용공고', back: COMPANY_MYPAGE_ROOT },
  {
    pattern: /^\/mypage\/company\/posts\/bootcamps$/,
    title: '부트캠프',
    back: COMPANY_MYPAGE_ROOT,
  },
  {
    pattern: /^\/mypage\/company\/posts\/jobs\/new$/,
    title: '채용 공고 등록',
    back: '/mypage/company/posts/jobs',
  },
  {
    pattern: /^\/mypage\/company\/posts\/jobs\/[^/]+\/edit$/,
    title: '채용 공고 수정',
    back: '/mypage/company/posts/jobs',
  },
  {
    pattern: /^\/mypage\/company\/posts\/bootcamps\/new$/,
    title: '교육 · 부트캠프 공고 등록',
    back: '/mypage/company/posts/bootcamps',
  },
  {
    pattern: /^\/mypage\/company\/posts\/bootcamps\/[^/]+\/edit$/,
    title: '교육 · 부트캠프 공고 수정',
    back: '/mypage/company/posts/bootcamps',
  },
  { pattern: /^\/mypage\/company\/ads$/, title: '광고', back: COMPANY_MYPAGE_ROOT },
  { pattern: /^\/mypage\/company\/profile$/, title: '기업 정보', back: COMPANY_MYPAGE_ROOT },
];

export function myPageMobileHeaderOf(
  pathname: string,
): { title: string; back: string } | undefined {
  const found = MOBILE_HEADERS.find(({ pattern }) => pattern.test(pathname));
  return found ? { title: found.title, back: found.back } : undefined;
}
