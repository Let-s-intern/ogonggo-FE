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
   * 하게 되고, 메뉴만 한 단 깊어진다. 대시보드·통계가 그렇다.
   */
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: '콘텐츠',
    items: [
      { path: '/content/jobs', label: '채용공고' },
      { path: '/content/bootcamps', label: '부트캠프' },
      { path: '/content/side-studies', label: '사이드·스터디' },
      { path: '/content/concerns', label: '취준고민' },
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
    /*
     * 회원이 아닌 사람도 보내는 영업 문의다. 비즈니스 회원이 올린 공고를 검수하는 `광고` 와 성격이 달라 따로
     * 묶는다. 어드민이 기업 회원을 `비즈니스 회원` 이라 부르므로 이름을 맞췄고, 제휴 문의가 생기면 여기에 더한다.
     * 메뉴 이름이 `무료 홍보 신청` 이 아닌 이유는 테이블이 문의 유형을 가리지 않기 때문이다(PRD `어드민 화면`).
     */
    title: '비즈니스',
    items: [
      { path: '/business/ad-inquiries', label: '광고 문의' },
      // `/business/ad-inquiries/rejected` 로 두면 메뉴 링크(`end` 없음)가 `광고 문의` 까지 함께 켠다.
      { path: '/business/rejected-ad-inquiries', label: '반려한 문의' },
    ],
  },
  {
    /*
     * 사용자 화면의 어느 자리에 무엇을 보일지 정하는 곳이다. 콘텐츠 하나하나를 보고 고치는
     * 콘텐츠 구역과 달라 따로 묶는다.
     */
    title: '지면',
    items: [
      { path: '/placements/pick-jobs', label: '오공고 PICK 공고' },
      { path: '/placements/recommend-weights', label: '추천 로직 가중치' },
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
    title: '고객지원',
    items: [
      { path: '/support/notices', label: '공지사항' },
      { path: '/support/feedbacks', label: '서비스 의견' },
    ],
  },
  {
    /*
     * 보내는 화면과 지난 발송을 보는 화면을 나누고, 전송 내역은 채널마다 따로 둔다. 관리자 발송뿐 아니라 댓글 푸시·
     * 알림톡·이메일도 있어 `고객지원` 에 두기에는 범위가 넓다. 세 내역 화면은 같은 페이지가 채널만 바꿔 그린다
     * (`pages/notification-history`).
     */
    title: '알림',
    items: [
      { path: '/notifications/send', label: '푸시 알림 전송' },
      { path: '/notifications/history/push', label: '푸시 전송 내역' },
      { path: '/notifications/history/alimtalk', label: '알림톡 전송 내역' },
      { path: '/notifications/history/email', label: '이메일 전송 내역' },
    ],
  },
  {
    items: [{ path: '/stats', label: '통계' }],
  },
];
