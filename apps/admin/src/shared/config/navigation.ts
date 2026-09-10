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
  /**
   * 아직 만들지 않은 화면. 회색으로 누를 수 없게 나가고 라우트도 없다.
   *
   * 메뉴에서 빼지 않는 이유는, 빼 두면 무엇이 남았는지 화면 위에서 볼 수 없기 때문이다.
   * 눌러서 빈 화면이 나오는 것보다 눌리지 않는 편이 낫다.
   */
  disabled?: boolean;
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
    /*
     * 검수와 반려는 비즈니스 회원이 돈을 내고 올린 것을 지면에 올릴지 정하는 일이다. 콘텐츠
     * 조회와 성격이 달라 따로 묶는다.
     */
    title: '광고',
    items: [
      { path: '/ads/review', label: '검수 대기' },
      { path: '/ads/rejections', label: '반려 보관' },
    ],
  },
  {
    items: [{ path: '/placements', label: '지면', disabled: true }],
  },
  {
    title: '회원',
    items: [
      { path: '/members/users', label: '일반 회원' },
      { path: '/members/companies', label: '비즈니스 회원' },
    ],
  },
  {
    items: [{ path: '/support/notices', label: '공지사항' }],
  },
  {
    items: [{ path: '/stats', label: '통계', disabled: true }],
  },
];
