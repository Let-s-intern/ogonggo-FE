import type { HttpHandler } from 'msw';
import { contentHandlers } from './content';
import { dashboardHandlers } from './dashboard';
import { inquiryHandlers } from './inquiries';
import { memberHandlers } from './members';
import { noticeHandlers } from './notices';
import { rejectionHandlers } from './rejections';
import { reviewHandlers } from './review';

/**
 * 어드민 콘솔의 MSW 핸들러.
 *
 * 사용자 API 핸들러(`../handlers.ts`)와 파일을 나눠 둔다. 두 API 는 경로 접두사도
 * (`/api/v1/admin/` 대 `/api/v1/`) 인증 방식도 다르고, `handlers.ts` 는 화면 세 벌 분량으로
 * 이미 길다(PRD `.claude/tasks/memos/prd-admin-console.md` "핸들러가 놓일 자리").
 *
 * 백엔드 `ogonggo-api-admin` 에 대응하는 API 는 아직 없다. 이 핸들러들의 요청·응답 모양이
 * 그대로 백엔드에 넘길 계약이므로, 응답 타입은 인라인 객체가 아니라 픽스처가 내보내는 이름
 * 붙은 타입을 쓴다.
 *
 * 경로에 `*` 를 앞에 붙이는 것은 사용자 핸들러와 같은 이유다 — Vite dev 서버가 `/api` 를
 * 프록시하므로 요청 URL 의 오리진이 고정되지 않는다.
 */
export const adminHandlers: HttpHandler[] = [
  ...dashboardHandlers,
  ...reviewHandlers,
  ...rejectionHandlers,
  ...contentHandlers,
  ...memberHandlers,
  ...inquiryHandlers,
  ...noticeHandlers,
];
