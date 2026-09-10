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
 */

/** 운영자가 처리해야 끝나는 일. 0 이 되는 것이 목표인 숫자다. */
export interface AdminDashboardTodo {
  /** 비즈니스 회원이 올렸고 아직 통과시키지 않은 채용공고와 부트캠프를 합한 수. */
  jobsPendingReview: number;
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
}

/** `GET /api/v1/admin/dashboard/summary` 의 응답 봉투. */
export interface AdminDashboardSummaryResponse {
  status: number;
  message: string;
  data?: AdminDashboardSummary;
}
