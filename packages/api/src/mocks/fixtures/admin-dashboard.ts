/**
 * 어드민 대시보드 픽스처.
 *
 * 대시보드는 "지금 서비스가 어떤가"가 아니라 **"운영자가 오늘 무엇을 해야 하는가"** 를 보여준다.
 * 그래서 숫자가 두 묶음으로 갈린다. 손을 대야 끝나는 일(`todo`)과, 손댈 것은 없지만 눈으로
 * 확인해야 하는 유입(`intake`)이다. 둘을 한 줄에 섞으면 검수 대기 3건이 크롤링 수집 40건 옆에서
 * 같은 무게로 읽힌다.
 *
 * 건수는 전부 각 도메인 픽스처에서 실제로 센다. 여기서 숫자를 따로 들고 있으면 목록 화면에서
 * 본 건수와 대시보드 숫자가 어긋나고, 그러면 목이 계약을 검증하지 못한다.
 *
 * 조회 수 추이만 예외다. `JobMetric` 이 누적 조회 수만 들고 있어(PRD 열린 질문) 일별 값을 만들
 * 원본이 없다. 아래 7일치는 지어낸 값이고, 백엔드는 일별 스냅샷 테이블이 생긴 뒤에야 이 모양을
 * 채울 수 있다.
 */

/** 하루치 조회 수. `date` 는 `YYYY-MM-DD`. */
export interface AdminDailyViewCount {
  date: string;
  viewCount: number;
}

/** 운영자가 처리해야 끝나는 일. 0 이 되는 것이 목표인 숫자들이다. */
export interface AdminDashboardTodo {
  /** 비즈니스 회원이 올렸고 아직 통과시키지 않은 채용공고. */
  jobsPendingReview: number;
  /** 접수 + 처리중. 답변 완료는 세지 않는다. */
  unansweredInquiries: number;
}

/** 오늘 들어온 것. 손댈 일은 아니지만 파이프라인이 도는지 보는 숫자들이다. */
export interface AdminDashboardIntake {
  /** 오늘 크롤러가 수집한 채용공고. */
  jobsCrawledToday: number;
  /** 오늘 크롤러가 수집한 부트캠프. */
  bootcampsCrawledToday: number;
  /** 오늘 비즈니스 회원이 직접 올린 채용공고. */
  jobsSubmittedToday: number;
  /** 최근 7일 안에 가입한 일반 + 비즈니스 회원. */
  newMembersThisWeek: number;
}

/** `GET /api/v1/admin/dashboard/summary` 의 `data`. */
export interface AdminDashboardSummary {
  todo: AdminDashboardTodo;
  intake: AdminDashboardIntake;
  /** 오래된 날짜가 먼저 오는 7칸. */
  viewCountTrend: AdminDailyViewCount[];
}

/** `GET /api/v1/admin/dashboard/summary` 의 응답 봉투. */
export interface AdminDashboardSummaryResponse {
  status: number;
  message: string;
  data?: AdminDashboardSummary;
}

/** 오늘로부터 `days` 일 전(음수)/후(양수)의 `YYYY-MM-DD`. */
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
