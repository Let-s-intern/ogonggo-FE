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
  /** 대시보드처럼 상위 묶음이 없는 항목은 제목이 없다. */
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
    title: '지면',
    items: [
      { path: '/placements/hero', label: '메인 배너' },
      { path: '/placements/mid', label: '중간 배너' },
    ],
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
    title: '통계',
    items: [{ path: '/stats/content', label: '콘텐츠 지표' }],
  },
];
