/**
 * 목데이터를 켤지 정한다.
 *
 * **끄라고 하지 않는 한 켜진다. 개발이든 배포든 같다.** 어드민은 백엔드에 대응하는 API 가 아직
 * 하나도 없어서(`ogonggo-api-admin` 에는 크롤러 수신용 `/api/v1/internal/jobs` 와 헬스 체크뿐이다)
 * 목이 꺼지면 아무것도 보이지 않는다. 지금 이 앱의 유일한 쓸모는 화면을 확인하는 것이다.
 *
 *   VITE_OGONGGO_USE_MOCKS=false    실제 백엔드를 본다
 *
 * `apps/web` 의 `OGONGGO_USE_MOCKS` 와 같은 규칙이고 이름도 짝을 맞춘다. 한쪽은 켜라고 해야
 * 켜지고 다른 쪽은 끄라고 해야 꺼지면, 두 앱을 오갈 때마다 어느 쪽이 어느 규칙이었는지 다시
 * 확인하게 된다.
 *
 * 접두사 `VITE_` 는 생략할 수 없다. Vite 는 그 접두사가 붙은 변수만 클라이언트 번들에 넣는다.
 *
 * **값은 빌드 시점에 박힌다.** 배포 환경에서 이 변수를 바꾸면 다시 빌드해야 반영된다 —
 * 런타임에 읽는 값이 아니다. `apps/web` 은 Next 서버가 런타임에 읽어서 이 점이 다르다.
 *
 * 오타나 빈 값은 켜진 것으로 본다. 조용히 꺼지면 데이터가 안 보이는 이유를 한참 찾게 된다.
 */
export const isMockEnabled: boolean = import.meta.env.VITE_OGONGGO_USE_MOCKS !== 'false';

/**
 * 워커가 준비될 때까지 기다린다.
 *
 * `await` 하는 이유는 `worker.start()` 가 서비스 워커 등록을 기다리는 Promise 이기 때문이다.
 * 기다리지 않고 렌더하면 첫 요청이 워커를 지나쳐 그대로 나간다.
 */
export async function enableMocking(): Promise<void> {
  if (!isMockEnabled) {
    // 어느 쪽으로 도는지 한 줄 남긴다. `apps/web` 의 instrumentation 이 같은 일을 한다.
    console.info('[ogonggo] 목데이터 꺼짐. 실제 백엔드를 봅니다.');
    return;
  }

  const { adminWorker } = await import('@ogonggo/api/src/mocks/admin/browser');
  await adminWorker.start({
    // 어드민 화면이 아직 안 만든 API 를 부르면 콘솔에 경고가 남는다. 조용히 통과시키면
    // 핸들러를 빼먹은 것과 백엔드가 없는 것을 구분할 수 없다.
    onUnhandledRequest: 'warn',
  });
}
