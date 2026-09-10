import { setupWorker } from 'msw/browser';
import { adminHandlers } from './handlers';

/**
 * 어드민 콘솔의 브라우저 워커.
 *
 * 사용자 웹은 Next 의 `instrumentation.ts` 에서 `msw/node` 로 서버 사이드를 가로채지만
 * (`apps/web/src/instrumentation.ts`), 어드민은 Vite 라 그 훅이 없다. 브라우저 워커를 쓰고
 * 서비스 워커 파일은 `apps/admin/public/mockServiceWorker.js` 에 있다.
 *
 * 이 파일은 워커를 만들기만 한다. 켤지 말지는 앱 진입점이 정한다 — Vite 는
 * `import.meta.env` 를, Next 는 `process.env` 를 읽어서 이 패키지 안에서는 어느 쪽도 가정할 수
 * 없다(`../../lib/http-client.ts` 주석이 같은 이유를 적어 두었다).
 */
export const adminWorker = setupWorker(...adminHandlers);
