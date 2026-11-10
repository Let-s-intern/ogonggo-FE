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

/**
 * 맨 위 헤더의 구역. 좌측 메뉴는 고른 구역의 묶음만 보인다(2026-11-05 사용자 — 비즈니스 광고 구매 기능이 들어올
 * 예정이라 비즈니스 관련 메뉴를 따로 본다). 라우트는 구역과 상관없이 모두 열려 있다.
 */
// `service` 는 취준생이 쓰는 오공고 서비스(웹·앱) 운영, `business` 는 비즈니스 회원(기업·교육기관) 운영이다. 처음에는
// `유저` 라 불렀다가 사용자 요청으로 `서비스` 로 바꿨다(2026-11-05).
export type NavArea = 'service' | 'business';

export const NAV_AREAS: { area: NavArea; label: string }[] = [
  { area: 'service', label: '서비스' },
  { area: 'business', label: '비즈니스' },
];

export interface NavSection {
  /** 이 묶음이 속한 헤더 구역. */
  area: NavArea;
  /**
   * 상위 묶음 제목. 하위가 하나뿐인 구역은 제목을 두지 않는다 — 제목과 항목이 같은 말을 두 번
   * 하게 되고, 메뉴만 한 단 깊어진다. 대시보드·통계가 그렇다.
   */
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    area: 'service',
    title: '콘텐츠',
    items: [
      { path: '/content/jobs', label: '채용공고' },
      // `/content/jobs/...` 아래에 두면 메뉴 링크(`end` 없음)가 `채용공고` 까지 함께 켠다. `반려한 문의` 와 같은 이유다.
      { path: '/content/new-jobs', label: '오늘 올라온 공고' },
      { path: '/content/bootcamps', label: '부트캠프' },
      { path: '/content/side-studies', label: '사이드·스터디' },
      { path: '/content/concerns', label: '취준고민' },
    ],
  },
  {
    area: 'business',
    /*
     * 비즈니스 회원이 등록한 채용공고·부트캠프만 모아 본다. 서비스 구역 `콘텐츠` 의 같은 화면을 등록 경로만 묶어 쓴다
     * (2026-11-05 사용자). 구역의 첫 화면이다.
     */
    title: '콘텐츠',
    items: [
      { path: '/business/jobs', label: '채용공고' },
      { path: '/business/bootcamps', label: '부트캠프' },
    ],
  },
  {
    area: 'business',
    /*
     * 비즈니스 회원이 올린 채용공고·부트캠프를 지면에 올릴지 정하는 곳이다. 들어온 신청을 보고(검수 대기), 반려한 것을
     * 따로 본다(2026-11-05 사용자, `채용공고·부트캠프 등록 - 신청, 반려`).
     *
     * 광고 신청 화면은 광고 시스템 브랜치(537)의 화면이 들어올 때 아래 `광고` 에 더한다. 화면이 없는 메뉴는 두지 않는다.
     */
    title: '채용공고·부트캠프 등록',
    items: [
      { path: '/ads/review', label: '신청' },
      { path: '/ads/rejections', label: '반려' },
    ],
  },
  {
    area: 'business',
    /*
     * 홈의 배너 자리(홈 상단·홈 하단·공고 상세)에 무엇을 걸지 정한다(이슈 #573, 2026-11-06 사용자). 지금은 오공고 자체 홍보
     * 배너가 대부분이지만 돈을 받고 싣는 배너도 여기서 건다. 광고 상품은 파는 광고(배너 자리마다 하나, 인스타·카카오 등)를
     * 정하고, 배너 세팅이 그 자리의 상품에 배너를 건다(BE LC-3583). 광고 신청 한 건이 곧 계약 한 행이라, 승인 전은
     * `유료 광고 신청`, 승인은 `광고 계약` 으로 나눠 본다. 광고주·광고 공고·채널 광고·캘린더 화면은 백엔드에 API 가 없어
     * 지웠다(2026-11-09 사용자, PRD `prd-ad-backend-sync.md` D1).
     *
     * 무료 홍보 신청은 계약이 아니라 광고 문의 테이블에 쌓여 아래 `무료 홍보` 로 나눴다(2026-11-10 사용자).
     */
    title: '광고',
    items: [
      { path: '/business/advertisement-applications', label: '유료 광고 신청' },
      { path: '/business/advertisement-contracts', label: '광고 계약' },
    ],
  },
  {
    area: 'business',
    /*
     * 무료 홍보 신청. 광고 문의 테이블의 무료 홍보 문의만 본다. 유료 광고와 섞이지 않게 `광고` 에서 나눴다(2026-11-10
     * 사용자).
     */
    title: '무료 홍보',
    items: [
      { path: '/business/ad-inquiries', label: '무료 홍보 신청' },
      // `/business/ad-inquiries/rejected` 로 두면 메뉴 링크(`end` 없음)가 `무료 홍보 신청` 까지 함께 켠다.
      { path: '/business/rejected-ad-inquiries', label: '반려한 무료 홍보' },
    ],
  },
  {
    area: 'business',
    /*
     * 파는 광고 상품과 그 자리에 거는 배너. 신청·계약을 처리하는 `광고` 와 달리 한 번 정해 두는 설정이다(2026-11-09 사용자).
     *
     * 기업회원 공고 우선 노출도 여기 둔다(2026-11-09 사용자). 비즈니스 회원 공고를 공개 목록 맨 앞에 둘지 정하는 전체
     * 스위치와 공고별 설정이다(2026-11-05 사용자). 광고 구좌가 열리기 전까지의 임시 혜택이다.
     */
    title: '광고 설정',
    items: [
      { path: '/business/advertisement-products', label: '광고 상품' },
      { path: '/business/banners', label: '배너 세팅' },
      { path: '/placements/company-priority', label: '기업회원 공고 우선 노출' },
    ],
  },
  {
    area: 'service',
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
    area: 'service',
    title: '회원',
    items: [{ path: '/members/users', label: '일반 회원' }],
  },
  {
    // 비즈니스 회원은 비즈니스 구역에서 본다. 제목은 서비스 구역의 `회원` 과 같은 말을 쓴다.
    area: 'business',
    title: '회원',
    items: [{ path: '/members/companies', label: '비즈니스 회원' }],
  },
  {
    area: 'business',
    // 광고 문의 테이블의 문의 전체(무료 홍보·출시 알림·반려)를 탭으로 본다(2026-11-10 사용자). 하나뿐이라 제목이 없고,
    // 비즈니스 구역 맨 아래에 둔다. 이름은 `비즈니스 문의` 다(2026-11-10 사용자).
    items: [{ path: '/business/inquiries', label: '비즈니스 문의' }],
  },
  {
    area: 'service',
    title: '고객지원',
    items: [
      { path: '/support/notices', label: '공지사항' },
      { path: '/support/feedbacks', label: '서비스 의견' },
    ],
  },
  {
    area: 'service',
    /*
     * 보내는 화면과 지난 발송을 보는 화면을 나누고, 전송 내역은 채널마다 따로 둔다. 관리자 발송뿐 아니라 댓글 푸시·
     * 알림톡·이메일·슬랙도 있어 `고객지원` 에 두기에는 범위가 넓다. 네 내역 화면은 같은 페이지가 채널만 바꿔 그린다
     * (`pages/notification-history`).
     */
    title: '알림',
    items: [
      { path: '/notifications/send', label: '푸시 알림 전송' },
      { path: '/notifications/history/push', label: '푸시 전송 내역' },
      { path: '/notifications/history/alimtalk', label: '알림톡 전송 내역' },
      { path: '/notifications/history/email', label: '이메일 전송 내역' },
      { path: '/notifications/history/slack', label: '슬랙 전송 내역' },
    ],
  },
  {
    area: 'service',
    items: [{ path: '/stats', label: '통계' }],
  },
];

/** 경로가 속한 구역. 메뉴에 없는 경로(상세 등)는 같은 앞부분을 가진 메뉴 항목의 구역이고, 없으면 서비스다. */
export function navAreaOf(pathname: string): NavArea {
  const section = NAV_SECTIONS.find((candidate) =>
    candidate.items.some(
      (item) =>
        item.path !== '/' && (pathname === item.path || pathname.startsWith(`${item.path}/`)),
    ),
  );
  return section?.area ?? 'service';
}

/** 구역의 첫 화면. 헤더에서 구역을 바꾸면 이리로 간다. */
export function firstPathOf(area: NavArea): string {
  const item = NAV_SECTIONS.filter((section) => section.area === area)
    .flatMap((section) => section.items)
    .find((candidate) => !candidate.disabled);
  return item?.path ?? '/';
}
