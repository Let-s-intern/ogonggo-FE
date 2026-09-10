import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  ADMIN_VIEW_COUNT_TREND,
  type AdminDashboardSummaryResponse,
} from '../fixtures/admin-dashboard';
import { countContentRegisteredToday } from '../fixtures/admin-content';
import { countUnansweredInquiries } from '../fixtures/admin-inquiry';
import { countMembersJoinedWithinDays } from '../fixtures/admin-member';

/**
 * 어드민 콘솔의 MSW 핸들러.
 *
 * 사용자 API 핸들러(`../handlers.ts`)와 파일을 나눠 둔다. 두 API 는 경로 접두사도
 * (`/api/v1/admin/` 대 `/api/v1/`) 인증 방식도 다르고, `handlers.ts`는 화면 세 벌 분량으로
 * 이미 길다(PRD `.claude/tasks/memos/prd-admin-console.md` "핸들러가 놓일 자리").
 *
 * 백엔드 `ogonggo-api-admin` 에 대응하는 API 는 아직 없다. 이 핸들러들의 요청·응답 모양이
 * 그대로 백엔드에 넘길 계약이므로, 응답 타입은 인라인 객체가 아니라 픽스처가 내보내는 이름 붙은
 * 타입을 쓴다.
 *
 * 경로에 `*`를 앞에 붙이는 것은 사용자 핸들러와 같은 이유다 — Vite dev 서버가 `/api` 를
 * 프록시하므로 요청 URL 의 오리진이 고정되지 않는다.
 */

/** 대시보드가 "이번 주 신규 회원"으로 세는 기간. */
const NEW_MEMBER_WINDOW_DAYS = 7;

/**
 * 네 숫자를 한 번에 준다. 화면이 카드 세 개와 추이 하나를 그리는데 요청을 넷으로 나누면
 * 로딩이 넷으로 쪼개지고, 그 사이 화면이 계속 흔들린다.
 */
const dashboardSummaryHandler = http.get('*/api/v1/admin/dashboard/summary', () => {
  const body: AdminDashboardSummaryResponse = {
    status: 200,
    message: 'OK',
    data: {
      unansweredInquiryCount: countUnansweredInquiries(),
      todayContentCount: countContentRegisteredToday(),
      weeklyNewMemberCount: countMembersJoinedWithinDays(NEW_MEMBER_WINDOW_DAYS),
      viewCountTrend: ADMIN_VIEW_COUNT_TREND,
    },
  };
  return HttpResponse.json(body, { status: 200 });
});

export const adminHandlers: HttpHandler[] = [dashboardSummaryHandler];
