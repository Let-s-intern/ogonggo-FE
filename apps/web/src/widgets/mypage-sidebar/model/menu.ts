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
 * 일반 회원 메뉴 넷. 순서와 문구는 v7 목업
 * (`docs/asset/v7 스크랩한 공고 칸반/image.png`) 과 v7 PRD 결정 기록의 표 그대로다.
 *
 * v4 의 `지원·신청 내역` 이 `신청 현황` 으로 바뀌고 맨 위로 올라왔다. 목업 사이드바의
 * `활동 관리` 는 넣지 않고 `작성한 모집글` 은 남긴다 — 둘 다 PRD 결정 기록이 정한다.
 *
 * **첫 항목이 바뀌면 `/mypage` 가 보내는 곳도 바뀐다**(`myPageHomeFor`). v7 부터는
 * `신청 현황` 이다.
 */
export const USER_MYPAGE_MENU: readonly MyPageMenuItem[] = [
  { href: '/mypage/applications', label: '신청 현황' },
  { href: '/mypage/scraps', label: '스크랩한 공고' },
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
