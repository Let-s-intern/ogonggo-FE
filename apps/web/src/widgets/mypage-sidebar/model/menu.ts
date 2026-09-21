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
 * 일반 회원 메뉴 넷(PRD 1 절). 순서는 목업
 * (`docs/asset/v4 마이페이지/개인정보/image.png`) 그대로다.
 */
export const USER_MYPAGE_MENU: readonly MyPageMenuItem[] = [
  { href: '/mypage/scraps', label: '스크랩한 공고' },
  { href: '/mypage/applications', label: '지원·신청 내역' },
  { href: '/mypage/posts', label: '작성한 모집글' },
  { href: '/mypage/profile', label: '개인 정보' },
];
