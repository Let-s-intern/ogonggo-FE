/**
 * 마이페이지 좌측 메뉴 한 줄.
 *
 * 목록을 이 파일에 박아 두지 않고 `MyPageSidebar` 가 prop 으로 받는 이유는 기업 회원
 * 마이페이지(v5) 가 같은 사이드바를 메뉴만 바꿔 쓰기 때문이다. 아래 `USER_MYPAGE_MENU` 는
 * 일반 회원 것이고, v5 는 자기 목록을 따로 두고 같은 컴포넌트에 넘긴다.
 */
export interface MyPageMenuItem {
  href: string;
  label: string;
}

/**
 * 일반 회원 메뉴 셋. 순서와 문구는 v11 목업(`docs/asset/v11/`)의 상단 탭 그대로다.
 *
 * v7 의 넷 가운데 `신청 현황`(`/mypage/applications`)이 빠지고, `스크랩한 공고` 가 칸반의 제목이던
 * `지원 · 신청 관리` 로 이름을 바꿔 맨 앞에 왔다. 칸반이 스크랩부터 최종 합격까지 한 화면에서
 * 다루므로 v11 은 신청 현황을 따로 두지 않는다. 경로는 지우지 않아 주소로는 들어갈 수 있다.
 *
 * **첫 항목이 바뀌면 `/mypage` 가 보내는 곳도 바뀐다**(`myPageHomeFor`). v11 부터는
 * `지원 · 신청 관리`(`/mypage/scraps`)다.
 */
export const USER_MYPAGE_MENU: readonly MyPageMenuItem[] = [
  { href: '/mypage/scraps', label: '지원 · 신청 관리' },
  { href: '/mypage/posts', label: '작성한 모집글' },
  { href: '/mypage/profile', label: '개인 정보' },
];

/**
 * 기업 회원 메뉴 둘(v5 PRD 1 절). 순서는 목업
 * (`docs/asset/v5 기업회원 마이페이지/기업 기관 정보.png`) 그대로다.
 *
 * 경로에 `company` 를 한 단 더 둔 이유는 역할 가드가 경로만 보고 판정할 수 있어야 하기
 * 때문이다 — `/mypage/company` 아래는 기업 회원, 나머지 `/mypage` 아래는 일반 회원이다.
 */
export const COMPANY_MYPAGE_MENU: readonly MyPageMenuItem[] = [
  { href: '/mypage/company/posts', label: '작성한 공고' },
  { href: '/mypage/company/profile', label: '기업/기관 정보' },
];

/** 마이페이지는 둘이다. 어느 쪽 화면인지는 역할이 아니라 지금 경로가 정한다. */
export type MyPageAudience = 'USER' | 'COMPANY';

const COMPANY_MYPAGE_ROOT = '/mypage/company';

/**
 * 경로가 누구의 마이페이지인지. 계정을 읽기 전에도 알 수 있어야 해서 경로로 판정한다 —
 * 역할로 정하면 계정이 오기 전까지 메뉴를 그리지 못하고, 온 뒤에 메뉴가 바뀌어 한 번 뛴다.
 * 역할이 경로와 어긋나면 `MyPageLayout` 이 맞는 쪽으로 보낸다.
 */
export function myPageAudienceOf(pathname: string): MyPageAudience {
  return pathname === COMPANY_MYPAGE_ROOT || pathname.startsWith(`${COMPANY_MYPAGE_ROOT}/`)
    ? 'COMPANY'
    : 'USER';
}

export function myPageMenuFor(audience: MyPageAudience): readonly MyPageMenuItem[] {
  return audience === 'COMPANY' ? COMPANY_MYPAGE_MENU : USER_MYPAGE_MENU;
}

/** 그 마이페이지의 첫 화면. `/mypage` 와 `/mypage/company` 가 여기로 보낸다. */
export function myPageHomeFor(audience: MyPageAudience): string {
  return myPageMenuFor(audience)[0]!.href;
}

/**
 * 모바일 마이페이지의 첫 화면. 여기서는 사이드바(프로필 카드와 메뉴)가 곧 화면이다. 데스크톱은
 * 전처럼 첫 메뉴로 넘긴다(`app/(site)/mypage/page.tsx`).
 */
export function isMyPageIndex(pathname: string): boolean {
  return pathname === '/mypage' || pathname === COMPANY_MYPAGE_ROOT;
}

export function myPageIndexFor(audience: MyPageAudience): string {
  return audience === 'COMPANY' ? COMPANY_MYPAGE_ROOT : '/mypage';
}

/**
 * 모바일 하위 화면 머리(`< 작성한 모집글`)의 제목과 `<` 가 가는 곳
 * (`docs/asset/v10 mobile/작성한 모집글.png`). 제목은 각 `page.tsx` 의 `metadata.title` 과 같다.
 * 작성·수정 화면은 자기 목록으로, 목록 화면은 메뉴 첫 화면으로 돌아간다.
 */
const MOBILE_HEADERS: readonly { pattern: RegExp; title: string; back: string }[] = [
  { pattern: /^\/mypage\/applications$/, title: '신청 현황', back: '/mypage' },
  { pattern: /^\/mypage\/scraps$/, title: '지원 · 신청 관리', back: '/mypage' },
  { pattern: /^\/mypage\/posts$/, title: '작성한 모집글', back: '/mypage' },
  { pattern: /^\/mypage\/posts\/new$/, title: '모집글 작성', back: '/mypage/posts' },
  { pattern: /^\/mypage\/posts\/[^/]+\/edit$/, title: '모집글 수정', back: '/mypage/posts' },
  { pattern: /^\/mypage\/profile$/, title: '개인 정보', back: '/mypage' },
  { pattern: /^\/mypage\/company\/posts$/, title: '작성한 공고', back: COMPANY_MYPAGE_ROOT },
  {
    pattern: /^\/mypage\/company\/posts\/jobs\/new$/,
    title: '채용 공고 등록',
    back: '/mypage/company/posts',
  },
  {
    pattern: /^\/mypage\/company\/posts\/jobs\/[^/]+\/edit$/,
    title: '채용 공고 수정',
    back: '/mypage/company/posts',
  },
  {
    pattern: /^\/mypage\/company\/posts\/bootcamps\/new$/,
    title: '교육 · 부트캠프 공고 등록',
    back: '/mypage/company/posts',
  },
  {
    pattern: /^\/mypage\/company\/posts\/bootcamps\/[^/]+\/edit$/,
    title: '교육 · 부트캠프 공고 수정',
    back: '/mypage/company/posts',
  },
  { pattern: /^\/mypage\/company\/profile$/, title: '기업/기관 정보', back: COMPANY_MYPAGE_ROOT },
];

export function myPageMobileHeaderOf(
  pathname: string,
): { title: string; back: string } | undefined {
  const found = MOBILE_HEADERS.find(({ pattern }) => pattern.test(pathname));
  return found ? { title: found.title, back: found.back } : undefined;
}
