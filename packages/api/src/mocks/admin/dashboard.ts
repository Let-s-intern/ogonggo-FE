import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  ADMIN_VIEW_COUNT_TREND,
  type AdminDashboardSummaryResponse,
} from '../fixtures/admin-dashboard';
import {
  countBootcampsCrawledToday,
  countJobsCrawledToday,
  countJobsPendingReview,
  countJobsSubmittedToday,
} from '../fixtures/admin-content';
import { countUnansweredInquiries } from '../fixtures/admin-inquiry';
import { countMembersJoinedWithinDays } from '../fixtures/admin-member';

/** 대시보드가 "이번 주 신규 회원"으로 세는 기간. */
const NEW_MEMBER_WINDOW_DAYS = 7;

/**
 * 대시보드의 모든 숫자를 한 번에 준다.
 *
 * 요청을 카드마다 나누면 로딩이 여섯으로 쪼개지고, 그 사이 화면이 계속 흔들린다. 백엔드에서도
 * 한 번의 집계 쿼리 묶음으로 끝나는 편이 낫다.
 */
const dashboardSummaryHandler = http.get('*/api/v1/admin/dashboard/summary', () => {
  const body: AdminDashboardSummaryResponse = {
    status: 200,
    message: 'OK',
    data: {
      todo: {
        jobsPendingReview: countJobsPendingReview(),
        unansweredInquiries: countUnansweredInquiries(),
      },
      intake: {
        jobsCrawledToday: countJobsCrawledToday(),
        bootcampsCrawledToday: countBootcampsCrawledToday(),
        jobsSubmittedToday: countJobsSubmittedToday(),
        newMembersThisWeek: countMembersJoinedWithinDays(NEW_MEMBER_WINDOW_DAYS),
      },
      viewCountTrend: ADMIN_VIEW_COUNT_TREND,
    },
  };
  return HttpResponse.json(body, { status: 200 });
});

export const dashboardHandlers: HttpHandler[] = [dashboardSummaryHandler];
