/**
 * 목데이터를 쓰는지. 서버의 `OGONGGO_USE_MOCKS` 를 `next.config.ts` 가 브라우저용 이름으로 넘긴다.
 * 규칙은 `src/instrumentation.ts`·web 과 같다 — 정확히 `false` 일 때만 꺼진다.
 *
 * 값은 빌드 시점에 박힌다. 배포 환경에서 바꾸면 다시 빌드해야 브라우저 쪽에 반영된다.
 */
const MOCKS_FLAG = process.env.NEXT_PUBLIC_OGONGGO_USE_MOCKS;
export const isMockEnabled: boolean = MOCKS_FLAG !== undefined && MOCKS_FLAG !== 'false';
