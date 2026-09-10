/**
 * 좌측 메뉴이자 라우트 목록. PRD `.claude/tasks/memos/prd-admin-console.md` 의 메뉴 트리와
 * 라우팅 표를 한 곳에 적은 것이다.
 *
 * 메뉴와 라우트가 이 배열 하나에서 나온다(`@/app/routes.tsx`). 둘을 따로 적으면 메뉴에는 있고
 * 라우트에는 없는 항목이 생기고, 그건 눌러 봐야 안다.
 */

export interface NavItem {
  /** 절대 경로. 대시보드만 `/` 이고 나머지는 `/구역/화면` 이다. */
  path: string;
  label: string;
}

export interface NavSection {
  /**
   * 상위 묶음 제목. 하위가 하나뿐인 구역은 제목을 두지 않는다 — 제목과 항목이 같은 말을 두 번
   * 하게 되고, 메뉴만 한 단 깊어진다. 대시보드·지면·통계가 그렇다.
   */
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ path: '/', label: '대시보드' }],
  },
  {
    title: '콘텐츠',
    items: [
      { path: '/content/jobs', label: '채용공고' },
      { path: '/content/bootcamps', label: '부트캠프' },
      { path: '/content/side-studies', label: '사이드·스터디' },
    ],
  },
  {
    items: [{ path: '/placements', label: '지면' }],
  },
  {
    title: '회원',
    items: [
      { path: '/members/users', label: '일반 회원' },
      { path: '/members/companies', label: '비즈니스 회원' },
    ],
  },
  {
    title: '고객 지원',
    items: [
      { path: '/support/inquiries', label: '문의' },
      { path: '/support/notices', label: '공지사항' },
    ],
  },
  {
    items: [{ path: '/stats', label: '통계' }],
  },
];
