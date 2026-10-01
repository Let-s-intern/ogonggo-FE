/**
 * 목데이터를 쓰는지. 서버의 `OGONGGO_USE_MOCKS` 를 `next.config.ts` 가 브라우저용 이름으로 넘긴다.
 * 규칙은 `instrumentation.ts` 와 같다 — 정확히 `false` 일 때만 꺼진다.
 *
 * 변수 자체가 없으면 꺼진 것으로 본다. Next 에서는 `next.config.ts` 가 늘 값을 넘기므로(비었으면
 * 빈 문자열) 이 경우는 Next 밖, 스토리북뿐이다. 거기서 켜지면 카드가 로그인한 상태로 그려진다.
 *
 * 값은 빌드 시점에 박힌다. 배포 환경에서 바꾸면 다시 빌드해야 브라우저 쪽에 반영된다.
 */
const MOCKS_FLAG = process.env.NEXT_PUBLIC_OGONGGO_USE_MOCKS;
export const isMockEnabled: boolean = MOCKS_FLAG !== undefined && MOCKS_FLAG !== 'false';

export type MockRole = 'USER' | 'COMPANY';

const MOCK_ROLE_KEY = 'ogonggo.web.mockRole';

/**
 * 목데이터 모드에서 어느 회원으로 볼지. 기본은 일반 회원이고, 주소에 `?mockRole=COMPANY` 를 붙이면
 * 기업 회원이다. 화면을 옮기면 쿼리가 사라지므로 이 탭의 `sessionStorage` 에 남겨 둔다.
 * `?mockRole=USER` 로 되돌린다.
 */
export function readMockRole(): MockRole {
  const fromQuery = new URLSearchParams(window.location.search).get('mockRole');
  if (fromQuery === 'USER' || fromQuery === 'COMPANY') {
    sessionStorage.setItem(MOCK_ROLE_KEY, fromQuery);
    return fromQuery;
  }
  return sessionStorage.getItem(MOCK_ROLE_KEY) === 'COMPANY' ? 'COMPANY' : 'USER';
}
