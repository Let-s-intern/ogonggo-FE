import { http, HttpResponse, type HttpHandler } from 'msw';
import { ADMIN_SERVICE_FEEDBACK_FIXTURES } from '../fixtures/admin-service-feedback';
import { ok, paginate, readPaging } from './paging';

/**
 * 서비스 개선 의견 핸들러. 읽기만 있다.
 *
 * 백엔드처럼 최신순(id 내림차순) 으로 준다(`ServiceFeedbackJpaRepository.findAllByOrderByIdDesc`).
 */
const listServiceFeedbacksHandler = http.get('*/api/v1/admin/service-feedbacks', ({ request }) => {
  const { page, size } = readPaging(new URL(request.url));
  const sorted = [...ADMIN_SERVICE_FEEDBACK_FIXTURES].sort((a, b) => b.id - a.id);
  return HttpResponse.json(ok(paginate(sorted, page, size)));
});

export const serviceFeedbackHandlers: HttpHandler[] = [listServiceFeedbacksHandler];
