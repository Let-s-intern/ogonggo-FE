/**
 * 목데이터 모드인지. `pnpm mock` 이 `OGONGGO_USE_MOCKS=true` 를 주고, `next.config.ts` 가 그 값을 브라우저용 이름으로
 * 넘긴다.
 *
 * web(`apps/web/src/shared/config/mocks.ts`)과 이름은 같지만 기본이 반대다. web 은 배포본이 목 기반이라 끄라고 해야
 * 꺼지고, biz 는 배포본이 실제 백엔드라 켜라고 해야 켜진다 — 정확히 `true` 일 때만 켜진다.
 *
 * 값은 빌드 시점에 박힌다.
 */
export const isMockEnabled: boolean = process.env.NEXT_PUBLIC_OGONGGO_USE_MOCKS === 'true';
