/**
 * 어드민 공지사항 픽스처.
 *
 * 백엔드 도메인이 아직 없다. 아래 타입이 화면에서 확정된 뒤 계약이 된다.
 *
 * 본문 형식은 아직 정하지 않았다(PRD 열린 질문 — 마크다운인지 리치 텍스트인지). 지금은 여러
 * 줄 평문으로 두고, 화면도 `textarea` 로 받는다. 리치 텍스트로 정해지면 이 칸의 타입이 아니라
 * 에디터가 바뀐다.
 *
 * 아래 값은 **전부 지어낸 것이다.**
 */

export interface Notice {
  id: number;
  title: string;
  content: string;
  /** ISO 8601. 게시 시작. */
  publicationStartAt: string;
  /** ISO 8601. 비우면 무기한이다. */
  publicationEndAt?: string;
  /** 동시에 하나만 true 다. 목 핸들러가 이 제약을 검사한다. */
  pinned: boolean;
  active: boolean;
  createdAt: string;
}

export interface NoticeListResponse {
  status: number;
  message: string;
  data?: Notice[];
}

export interface NoticeDetailResponse {
  status: number;
  message: string;
  data?: Notice;
}

const daysFromNow = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export const NOTICE_FIXTURES: Notice[] = [
  {
    id: 1,
    title: '개인정보 처리방침 개정 안내',
    content:
      '2026년 10월 1일부터 개인정보 처리방침이 개정됩니다.\n\n주요 변경 사항은 보관 기간 명시와 위탁 업체 목록 갱신입니다. 자세한 내용은 하단 링크에서 확인해 주세요.',
    publicationStartAt: daysFromNow(-2),
    publicationEndAt: daysFromNow(28),
    pinned: true,
    active: true,
    createdAt: daysFromNow(-3),
  },
  {
    id: 2,
    title: '추석 연휴 고객센터 운영 안내',
    content: '9월 27일부터 10월 1일까지 문의 답변이 지연될 수 있습니다.',
    publicationStartAt: daysFromNow(-5),
    publicationEndAt: daysFromNow(20),
    pinned: false,
    active: true,
    createdAt: daysFromNow(-6),
  },
  {
    id: 3,
    title: '공고 달력 기능이 추가됐습니다',
    content:
      '마감일 기준으로 채용공고를 달력에서 볼 수 있습니다. 상단 메뉴의 공고 달력에서 확인해 주세요.',
    publicationStartAt: daysFromNow(-14),
    pinned: false,
    active: true,
    createdAt: daysFromNow(-14),
  },
  {
    id: 4,
    title: '서비스 점검 안내 (완료)',
    content: '8월 30일 새벽 2시부터 4시까지 진행한 점검이 완료됐습니다.',
    publicationStartAt: daysFromNow(-40),
    publicationEndAt: daysFromNow(-38),
    pinned: false,
    active: false,
    createdAt: daysFromNow(-41),
  },
];
