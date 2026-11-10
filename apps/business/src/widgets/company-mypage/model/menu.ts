/**
 * 기업 마이페이지의 메뉴와 모바일 머리. 기준은 `apps/web/src/widgets/mypage-sidebar/model/menu.ts` 의 기업 회원
 * 부분이다. biz 는 기업 회원 전용이라 일반 회원 메뉴와 경로로 회원 종류를 가르는 판정은 옮기지 않았다.
 */
export interface MyPageMenuItem {
  href: string;
  label: string;
  /** PC 탭 줄에서 이 항목을 오른쪽 끝으로 띄운다. 공고·광고 메뉴와 계정 메뉴를 가른다. */
  separated?: boolean;
}

export const COMPANY_MYPAGE_MENU: readonly MyPageMenuItem[] = [
  { href: '/mypage/company/posts/jobs', label: '채용공고' },
  { href: '/mypage/company/posts/bootcamps', label: '부트캠프' },
  { href: '/mypage/company/ads', label: '광고 신청 내역' },
  { href: '/mypage/company/profile', label: '기업/기관 정보', separated: true },
];

/** 메뉴 화면 없이 바로 들어가는 첫 화면. `/mypage/company`·`/mypage/company/posts` 가 여기로 보낸다. */
export const COMPANY_MYPAGE_HOME = COMPANY_MYPAGE_MENU[0]!.href;

/**
 * 모바일 작성·수정 화면의 `< 제목` 머리. 제목은 각 `page.tsx` 의 `metadata.title` 과 같고, `<` 는 자기 목록으로
 * 간다.
 *
 * web 은 목록 화면에도 머리를 달고 `<` 가 메뉴 화면(`/mypage/company`)으로 간다. biz 의 `/mypage/company` 는
 * 메뉴 화면 없이 목록으로 보내므로(PRD 6절) 목록 화면은 머리 대신 메뉴를 위에 둔다(`CompanyMyPageLayout`).
 */
const MOBILE_HEADERS: readonly { pattern: RegExp; title: string; back: string }[] = [
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
  {
    pattern: /^\/mypage\/company\/ads\/[^/]+$/,
    title: '광고 신청 상세',
    back: '/mypage/company/ads',
  },
];

export function myPageMobileHeaderOf(
  pathname: string,
): { title: string; back: string } | undefined {
  const found = MOBILE_HEADERS.find(({ pattern }) => pattern.test(pathname));
  return found ? { title: found.title, back: found.back } : undefined;
}
