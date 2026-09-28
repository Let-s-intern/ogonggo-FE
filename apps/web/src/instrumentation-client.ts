import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { nextjsPlugin, onRouterTransitionStart } from '@datadog/browser-rum-nextjs';

/**
 * 브라우저 모니터링(Datadog). 앱이 상호작용 가능해지기 전에 한 번 돈다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md).
 *
 * 두 SDK 를 켠다.
 * - RUM: 화면 조회, 클릭 같은 사용자 행동, 리소스·롱태스크, 잡히지 않은 오류, 세션 리플레이
 * - Logs: 잡히지 않은 오류와 `console.error`·`console.warn` 을 로그로
 *
 * 화면 이름은 `nextjsPlugin` 이 App Router 이동을 받아 `/jobs/[jobId]` 처럼 동적 구간을 묶어
 * 붙인다. 이동 시작은 아래 `onRouterTransitionStart` 를 Next 가 불러 알려 주고, 이동 끝은 루트
 * 레이아웃의 `DatadogAppRouter` 가 알린다. 둘 중 하나가 빠지면 첫 화면 뒤로 조회가 잡히지 않는다.
 *
 * **키가 없으면 아무것도 켜지 않는다.** 로컬과 프리뷰에서는 Datadog 으로 요청이 나가지 않는다.
 * `onRouterTransitionStart` 는 초기화 전에 불려도 주소만 적어 두고 끝나 그대로 내보낸다.
 */
export { onRouterTransitionStart };

const APPLICATION_ID = process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID;
const CLIENT_TOKEN = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;

const SITE = 'datadoghq.com';
const SERVICE = 'ogonggo-web';
/** Vercel 이 배포마다 넣어 주는 값이다. `production`·`preview`, 로컬에서는 없다. */
const ENV = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local';
/** 어느 배포에서 난 오류인지 가르는 값. 커밋 앞 7자리다. */
const VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

if (APPLICATION_ID && CLIENT_TOKEN) {
  datadogRum.init({
    applicationId: APPLICATION_ID,
    clientToken: CLIENT_TOKEN,
    site: SITE,
    service: SERVICE,
    env: ENV,
    version: VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackResources: true,
    trackUserInteractions: true,
    trackLongTasks: true,
    // 리플레이에서 입력칸(이메일·비밀번호·지원서 내용)만 가린다. 화면 글자까지 가리면
    // 리플레이로 무엇을 보고 있었는지 알 수 없다.
    defaultPrivacyLevel: 'mask-user-input',
    plugins: [nextjsPlugin()],
  });

  datadogLogs.init({
    clientToken: CLIENT_TOKEN,
    site: SITE,
    service: SERVICE,
    env: ENV,
    version: VERSION,
    sessionSampleRate: 100,
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ['error', 'warn'],
  });
}
