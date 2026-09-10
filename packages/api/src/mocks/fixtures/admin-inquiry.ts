/**
 * 어드민 문의 픽스처.
 *
 * 문의는 백엔드 도메인이 아직 없다(PRD `.claude/tasks/memos/prd-admin-console.md` "새로 필요한
 * 도메인"). 아래 타입이 화면에서 확정된 뒤 백엔드가 받는 계약이 되므로, 화면에 그리지 않는
 * 칸은 넣지 않는다.
 *
 * 아래 12건은 **전부 지어낸 값이다.** 작성자 이름과 이메일은 실존하지 않는다.
 */

/** 접수 → 처리중 → 답변 완료. 되돌아가는 전이도 막지 않는다(운영자가 잘못 누를 수 있다). */
export type InquiryStatus = 'RECEIVED' | 'IN_PROGRESS' | 'ANSWERED';

/** 문의 분류. 화면의 필터 드롭다운과 1:1이다. */
export type InquiryCategory = 'SERVICE' | 'JOB_POSTING' | 'ACCOUNT' | 'ADVERTISEMENT' | 'ETC';

export interface InquirySummary {
  id: number;
  title: string;
  /** 비로그인 문의를 받을지 아직 정해지지 않았다(PRD 열린 질문). 지금은 항상 값이 있다. */
  authorName: string;
  authorEmail: string;
  category: InquiryCategory;
  status: InquiryStatus;
  /** ISO 8601. */
  createdAt: string;
}

export interface InquiryDetail extends InquirySummary {
  content: string;
  /** 답변 전에는 없다. 한 번 쓰면 수정만 되고 지워지지 않는다. */
  answer?: string;
  answeredAt?: string;
}

export interface InquiryPageInfo {
  pageNum: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface InquiryPageResponse {
  items: InquirySummary[];
  pageInfo: InquiryPageInfo;
}

/** `GET /api/v1/admin/inquiries`의 응답 봉투. */
export interface InquiryListResponse {
  status: number;
  message: string;
  data?: InquiryPageResponse;
}

/** `GET /api/v1/admin/inquiries/{inquiryId}`의 응답 봉투. */
export interface InquiryDetailResponse {
  status: number;
  message: string;
  data?: InquiryDetail;
}

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

export const INQUIRY_FIXTURES: InquiryDetail[] = [
  {
    id: 1,
    title: '채용공고 등록이 반려됐는데 사유를 알 수 있을까요',
    authorName: '김민수',
    authorEmail: 'minsu.kim@example.com',
    category: 'JOB_POSTING',
    status: 'RECEIVED',
    createdAt: hoursAgo(3),
    content:
      '어제 등록한 백엔드 개발자 공고가 게시되지 않았습니다. 반려 사유를 알려주시면 수정해서 다시 올리겠습니다.',
  },
  {
    id: 2,
    title: '기업 회원 가입 시 사업자등록증이 업로드되지 않습니다',
    authorName: '이서연',
    authorEmail: 'seoyeon.lee@example.com',
    category: 'ACCOUNT',
    status: 'RECEIVED',
    createdAt: hoursAgo(7),
    content: 'PDF 파일을 올리면 계속 오류가 납니다. 파일 크기는 2MB 정도입니다.',
  },
  {
    id: 3,
    title: '홈 화면 배너 광고 단가가 궁금합니다',
    authorName: '박지훈',
    authorEmail: 'jihoon.park@example.com',
    category: 'ADVERTISEMENT',
    status: 'IN_PROGRESS',
    createdAt: hoursAgo(26),
    content: '중간 배너 한 달 게재 기준으로 견적을 받고 싶습니다. 담당자 연락처도 알려주세요.',
  },
  {
    id: 4,
    title: '북마크한 공고가 사라졌어요',
    authorName: '최유진',
    authorEmail: 'yujin.choi@example.com',
    category: 'SERVICE',
    status: 'IN_PROGRESS',
    createdAt: hoursAgo(30),
    content: '지난주에 북마크한 공고 5개 중 3개가 목록에서 안 보입니다. 마감된 공고인가요?',
  },
  {
    id: 5,
    title: '부트캠프 정보가 실제와 다릅니다',
    authorName: '정하늘',
    authorEmail: 'haneul.jung@example.com',
    category: 'SERVICE',
    status: 'ANSWERED',
    createdAt: hoursAgo(52),
    content: '교육 기간이 6개월로 나와 있는데 실제로는 4개월입니다. 확인 부탁드립니다.',
    answer:
      '확인 후 수정했습니다. 원문 페이지가 변경된 것을 수집 시점에 반영하지 못했습니다. 알려주셔서 감사합니다.',
    answeredAt: hoursAgo(48),
  },
  {
    id: 6,
    title: '탈퇴 후 재가입이 안 됩니다',
    authorName: '강도현',
    authorEmail: 'dohyun.kang@example.com',
    category: 'ACCOUNT',
    status: 'ANSWERED',
    createdAt: hoursAgo(76),
    content: '같은 이메일로 다시 가입하려니 이미 존재하는 계정이라고 나옵니다.',
    answer: '탈퇴 후 30일간은 같은 이메일로 재가입할 수 없습니다. 기간이 지나면 가능합니다.',
    answeredAt: hoursAgo(72),
  },
  {
    id: 7,
    title: '공고 상세에서 원문 링크가 열리지 않습니다',
    authorName: '윤소라',
    authorEmail: 'sora.yoon@example.com',
    category: 'JOB_POSTING',
    status: 'RECEIVED',
    createdAt: hoursAgo(11),
    content: '지원하기 버튼을 눌러도 아무 반응이 없습니다. 크롬 최신 버전입니다.',
  },
  {
    id: 8,
    title: '제휴 문의 드립니다',
    authorName: '임태우',
    authorEmail: 'taewoo.lim@example.com',
    category: 'ETC',
    status: 'RECEIVED',
    createdAt: hoursAgo(19),
    content: '저희 교육기관 과정을 오공고에 노출하고 싶습니다. 담당자와 통화 가능할까요?',
  },
  {
    id: 9,
    title: '알림 메일이 너무 자주 옵니다',
    authorName: '한예린',
    authorEmail: 'yerin.han@example.com',
    category: 'SERVICE',
    status: 'ANSWERED',
    createdAt: hoursAgo(98),
    content: '하루에 세 번씩 새 공고 메일이 옵니다. 빈도를 조절할 수 있나요?',
    answer: '설정 > 알림에서 일간 요약으로 바꿀 수 있습니다. 안내 이미지를 함께 첨부합니다.',
    answeredAt: hoursAgo(95),
  },
  {
    id: 10,
    title: '회사 로고가 다른 회사 것으로 나옵니다',
    authorName: '오준석',
    authorEmail: 'junseok.oh@example.com',
    category: 'JOB_POSTING',
    status: 'IN_PROGRESS',
    createdAt: hoursAgo(44),
    content: '저희 공고에 동명이인 회사의 로고가 걸려 있습니다. 급하게 수정 부탁드립니다.',
  },
  {
    id: 11,
    title: '광고 게재 기간을 연장하고 싶습니다',
    authorName: '신재현',
    authorEmail: 'jaehyun.shin@example.com',
    category: 'ADVERTISEMENT',
    status: 'ANSWERED',
    createdAt: hoursAgo(120),
    content: '이번 달 말까지인 배너를 다음 달까지 연장하려면 어떻게 해야 하나요?',
    answer: '담당자가 메일로 견적을 보내드렸습니다. 회신 주시면 연장 처리하겠습니다.',
    answeredAt: hoursAgo(116),
  },
  {
    id: 12,
    title: '사이드 프로젝트 모집 글은 어디서 올리나요',
    authorName: '배수민',
    authorEmail: 'sumin.bae@example.com',
    category: 'ETC',
    status: 'RECEIVED',
    createdAt: hoursAgo(5),
    content: '사이드·스터디 탭에 글을 올리고 싶은데 작성 버튼을 찾지 못했습니다.',
  },
];

/** 대시보드가 세는 "미답변 문의" — 접수와 처리중을 합한 수다. */
export const countUnansweredInquiries = (): number =>
  INQUIRY_FIXTURES.filter((inquiry) => inquiry.status !== 'ANSWERED').length;
