/**
 * MSW 를 켤지 정하고, 켠다면 워커가 준비될 때까지 기다린다.
 *
 * 어드민은 백엔드에 대응하는 API 가 아직 하나도 없어(`ogonggo-api-admin` 에는 크롤러 수신용
 * `/api/v1/internal/jobs` 와 헬스 체크뿐이다) 개발 중에는 목이 켜져 있는 것이 기본이다.
 * 그래서 조건이 "켜라고 했을 때 켠다"가 아니라 "끄라고 했을 때만 끈다"이다.
 *
 *   VITE_API_MOCK=false pnpm --filter admin dev   실제 백엔드로 붙는다
 *
 * 프로덕션 빌드에서는 값과 무관하게 켜지 않는다. 목이 섞인 번들이 배포되면 화면은 멀쩡히
 * 그려지면서 데이터만 가짜가 되고, 그건 배포 사고 중 가장 늦게 발견되는 종류다.
 *
 * `await` 하는 이유는 `worker.start()` 가 서비스 워커 등록을 기다리는 Promise 이기 때문이다.
 * 기다리지 않고 렌더하면 첫 요청이 워커를 지나쳐 프록시로 나가고, Vite 가 그것을 8081 로
 * 넘겨 연결 거부가 난다.
 */
export async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCK === 'false') {
    return;
  }

  const { adminWorker } = await import('@ogonggo/api/src/mocks/admin/browser');
  await adminWorker.start({
    // 어드민 화면이 아직 안 만든 API 를 부르면 콘솔에 경고가 남는다. 조용히 통과시키면
    // 핸들러를 빼먹은 것과 백엔드가 없는 것을 구분할 수 없다.
    onUnhandledRequest: 'warn',
  });
}
