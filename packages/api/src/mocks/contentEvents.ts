import { http, HttpResponse, type HttpHandler } from 'msw';

/**
 * 광고 성과 리포트용 이벤트 수집(`POST /api/v1/events`, BE Push 1). 모양은
 * `.claude/tasks/memos/광고-리포트-API-계약-2026-11-19.md` 1절이다. 저장하지 않고 모양만 본다 — 방문자 id 가 없거나
 * 건수가 1~20 을 벗어나면 400, 그 밖에는 202 이고 본문이 없다.
 *
 * 웹은 평소 `application/json` 으로, 페이지를 떠날 때는 `sendBeacon` 의 `text/plain` 으로 같은 JSON 을 보낸다. 둘 다
 * 본문 글자를 읽어 푼다. 받은 묶음은 콘솔에 남겨 개발자 도구에서 내용을 볼 수 있게 한다.
 */
const MAX_EVENTS = 20;
const VISITOR_ID_MAX_LENGTH = 36;

const badRequest = (message: string) =>
  HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });

const postContentEventsHandler = http.post('*/api/v1/events', async ({ request }) => {
  let body: { visitorId?: unknown; events?: unknown };
  try {
    body = JSON.parse(await request.text()) as typeof body;
  } catch {
    return badRequest('본문을 읽을 수 없습니다.');
  }
  if (
    typeof body.visitorId !== 'string' ||
    body.visitorId.length === 0 ||
    body.visitorId.length > VISITOR_ID_MAX_LENGTH
  ) {
    return badRequest('visitorId: 방문자 id 를 보내 주세요.');
  }
  if (!Array.isArray(body.events) || body.events.length < 1 || body.events.length > MAX_EVENTS) {
    return badRequest(`events: 1~${MAX_EVENTS}건을 보내 주세요.`);
  }
  console.info('[mock] POST /api/v1/events', body.visitorId, body.events);
  return new HttpResponse(null, { status: 202 });
});

export const contentEventHandlers: HttpHandler[] = [postContentEventsHandler];
