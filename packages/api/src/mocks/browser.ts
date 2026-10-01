import type { RequestHandler } from 'msw';
import { setupWorker } from 'msw/browser';
import { getOgonggoUserAPIMock } from '../generated/user/endpoints';
import { handlers } from './handlers';

/**
 * 사용자 웹의 브라우저 워커. 목데이터 모드에서 브라우저가 부르는 요청을 받는다.
 *
 * 서버 쪽은 `apps/web/src/instrumentation.ts` 가 `msw/node` 로 가로채지만, 마이페이지처럼
 * 브라우저에서 부르는 요청은 그 밖이다. 서비스 워커 파일은 `apps/web/public/mockServiceWorker.js` 다.
 *
 * 앞에 둔 핸들러가 먼저 받는다. 앱이 넘기는 것(`overrides`), 손으로 쓴 핸들러, 그리고 orval 이
 * 생성한 가짜 응답 순이다. 생성 핸들러는 손으로 쓴 것이 없는 API 를 메운다 — 마이페이지가 부르는
 * 스크랩·지원 관리(`/job-bookmarks` 등)·내 공고가 여기서 응답을 받는다. 값은 무작위다.
 *
 * 켤지 말지는 앱이 정한다(`./admin/browser.ts` 와 같은 이유).
 */
export function setupUserWorker(...overrides: RequestHandler[]) {
  return setupWorker(...overrides, ...handlers, ...getOgonggoUserAPIMock());
}
