/**
 * 어드민 대시보드 픽스처.
 *
 * 대시보드가 세는 값 중 콘텐츠 건수는 `fixtures/job.ts`·`fixtures/bootcamp.ts`에서 실제로
 * 세고, 문의·회원 건수는 각 도메인 픽스처에서 센다. 여기서 숫자를 따로 들고 있지 않는 이유는
 * 목록 화면에서 본 건수와 대시보드 숫자가 어긋나면 목이 계약을 검증하지 못하기 때문이다.
 *
 * 조회 수 추이만 예외다. `JobMetric`이 누적 조회 수만 들고 있어(PRD `.claude/tasks/memos/
 * prd-admin-console.md` 열린 질문) 일별 값을 만들 원본이 없다. 아래 7일치는 지어낸 값이고,
 * 백엔드는 일별 스냅샷 테이블이 생긴 뒤에야 이 모양을 채울 수 있다.
 */

/** 하루치 조회 수. `date`는 `YYYY-MM-DD`. */
export interface AdminDailyViewCount {
  date: string;
  viewCount: number;
}

/** `GET /api/v1/admin/dashboard/summary`의 `data`. */
export interface AdminDashboardSummary {
  /** 접수 + 처리중. 답변 완료는 세지 않는다. */
  unansweredInquiryCount: number;
  /** 오늘 등록된 채용공고 + 부트캠프. */
  todayContentCount: number;
  /** 최근 7일 안에 가입한 일반 회원 + 비즈니스 회원. */
  weeklyNewMemberCount: number;
  /** 오래된 날짜가 먼저 오는 7칸. */
  viewCountTrend: AdminDailyViewCount[];
}

/** `GET /api/v1/admin/dashboard/summary`의 응답 봉투. */
export interface AdminDashboardSummaryResponse {
  status: number;
  message: string;
  data?: AdminDashboardSummary;
}

/** 오늘로부터 `days`일 전(음수)/후(양수)의 `YYYY-MM-DD`. */
export const dateFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * 최근 7일 조회 수. 오늘이 마지막 칸이다.
 *
 * 고정 배열이라 매일 같은 곡선이 나온다. 날짜만 오늘 기준으로 밀린다 — 화면이 "최근 7일"을
 * 제대로 그리는지 보려면 날짜는 움직여야 하고, 값까지 흔들리면 스냅샷 비교를 할 수 없다.
 */
const VIEW_COUNT_SERIES = [1840, 2310, 2105, 2670, 3120, 2890, 3405];

export const ADMIN_VIEW_COUNT_TREND: AdminDailyViewCount[] = VIEW_COUNT_SERIES.map(
  (viewCount, index) => ({
    date: dateFromToday(index - (VIEW_COUNT_SERIES.length - 1)),
    viewCount,
  }),
);
