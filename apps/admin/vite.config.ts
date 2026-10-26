import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { type Plugin, defineConfig, loadEnv } from 'vite';

// dev 서버가 `/api/**` 를 넘길 어드민 백엔드. 기본값은 로컬 도커의 어드민 API 다(`ogonggo-BE` 의
// `ogonggo-api-admin`). 배포본은 이 값을 읽지 못하고 `vercel.json` 의 rewrite 가 주소를 직접 들고
// 있는데, 그쪽은 2026-09-22 부터 새 게이트웨이
// (https://p5itn5nbm4.execute-api.ap-northeast-2.amazonaws.com) 다 — 기존 ALB(`:8081`, HTTP) 의
// 21개 operation 을 모두 포함하고 공지사항 CRUD 5개가 더 있으며 HTTPS 다. 로컬에서 그 서버를 보려면
// 이 변수에 같은 주소를 넣는다.
const ADMIN_API_ORIGIN = process.env.OGONGGO_ADMIN_API_ORIGIN ?? 'http://localhost:8081';
// 로그인과 토큰 재발급은 admin API 가 아니라 user API 에 있다. 관리자도 사용자 API 로그인으로
// 토큰을 받는다. 로컬 `dev` 스크립트가 18080 을 넘긴다(8080 은 다른 서버가 쓴다).
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';
// 관리자 로그인의 앞부분(렛츠커리어 SSO) 이 부르는 서버. 로컬도 렛츠커리어 prod 를 본다 — SSO 화이트리스트와
// 오공고 백엔드의 검증 대상이 prod 라 토큰을 발급한 곳과 검증하러 가는 곳이 같아야 교환이 된다
// (`apps/web/.env.example` 의 `NEXT_PUBLIC_LETSCAREER_API_ORIGIN` 과 같은 값·같은 이유다).
const LETSCAREER_API_ORIGIN =
  process.env.OGONGGO_LETSCAREER_API_ORIGIN ??
  'https://3ccm7bgq1b.execute-api.ap-northeast-2.amazonaws.com';

// 단축링크(Shlink) 서버와 API 키. `.env.local` 의 `SHLINK_*` 를 읽는다 — `VITE_` 접두사가 없어 번들에는
// 들어가지 않고 dev 서버의 프록시만 쓴다. 배포본은 `api/shlink-short-url.ts` 가 서버 환경변수로 읽는다.
const SHLINK_ENV = loadEnv('', process.cwd(), 'SHLINK_');
const SHLINK_API_URL = SHLINK_ENV.SHLINK_API_URL ?? 'https://l.letscareer.co.kr';
const SHLINK_API_KEY = SHLINK_ENV.SHLINK_API_KEY ?? '';

// Redash API 키. 단축링크 키와 같은 이유로 `VITE_` 접두사 없이 `.env.local` 에서 읽는다.
const REDASH_API_KEY = loadEnv('', process.cwd(), 'REDASH_').REDASH_API_KEY ?? '';

// AI 비서의 모델 설정(`STATS_LLM_*`). 같은 이유로 `.env.local` 에서 읽는다.
const STATS_LLM_ENV = loadEnv('', process.cwd(), 'STATS_LLM_');

/**
 * 통계 화면의 `POST /redash-api/query`. 배포본은 `api/redash-query.ts` 가 받는다.
 *
 * 단축링크처럼 프록시로 넘기지 않는 이유는, Redash 는 실행 요청에 작업 번호를 주고 끝날 때까지 상태를
 * 다시 물어야 결과가 나오기 때문이다. 그 순서를 dev 에서 다시 짜지 않고 함수 파일의 `runRedashQuery` 를
 * 그대로 부른다. 호출자 검증은 하지 않는다 — 로컬 토큰은 배포본 어드민 API 가 모른다.
 */
const redashDevApi: Plugin = {
  name: 'redash-dev-api',
  configureServer(server) {
    server.middlewares.use('/redash-api/query', async (req, res) => {
      const { parseRedashQueryInput, runRedashQuery, RedashFailure } = (await server.ssrLoadModule(
        '/api/redash-query.ts',
      )) as typeof import('./api/redash-query');
      const send = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(body));
      };
      if (!REDASH_API_KEY) {
        send(503, {
          status: 503,
          code: 'REDASH_NOT_CONFIGURED',
          message: '.env.local 에 REDASH_API_KEY 가 없습니다.',
        });
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      let input = null;
      try {
        input = parseRedashQueryInput(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        // 아래에서 400 으로 답한다.
      }
      if (!input) {
        send(400, {
          status: 400,
          code: 'INVALID_REQUEST',
          message: '실행할 수 없는 쿼리 요청입니다.',
        });
        return;
      }
      try {
        send(200, await runRedashQuery(REDASH_API_KEY, input));
      } catch (error) {
        if (error instanceof RedashFailure) {
          send(error.status, { status: error.status, code: error.code, message: error.message });
          return;
        }
        throw error;
      }
    });

    // AI 비서의 `POST /assistant-api/chat`. 배포본은 `api/assistant.ts` 가 받는다. 위와 같은 이유로 함수
    // 파일의 `chatWithAssistant` 를 그대로 부르고, 호출자 검증은 하지 않는다.
    server.middlewares.use('/assistant-api/chat', async (req, res) => {
      const { AssistantFailure, chatWithAssistant, llmConfigFrom, parseAssistantInput } =
        (await server.ssrLoadModule('/api/assistant.ts')) as typeof import('./api/assistant');
      const send = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(body));
      };
      const config = llmConfigFrom(STATS_LLM_ENV);
      if (!config) {
        send(503, {
          status: 503,
          code: 'ASSISTANT_NOT_CONFIGURED',
          message: '.env.local 에 STATS_LLM_* 가 없습니다.',
        });
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      let input = null;
      try {
        input = parseAssistantInput(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        // 아래에서 400 으로 답한다.
      }
      if (!input) {
        send(400, { status: 400, code: 'INVALID_REQUEST', message: '보낼 수 없는 대화입니다.' });
        return;
      }
      try {
        send(200, await chatWithAssistant(config, input));
      } catch (error) {
        if (error instanceof AssistantFailure) {
          send(error.status, { status: error.status, code: error.code, message: error.message });
          return;
        }
        throw error;
      }
    });

    // 공고 편집 로고 추천의 `POST /logo-api/candidates`. 배포본은 `api/logo-candidates.ts` 가 받는다. 위와
    // 같은 이유로 함수 파일의 `findLogoCandidates` 를 그대로 부르고, 호출자 검증은 하지 않는다.
    server.middlewares.use('/logo-api/candidates', async (req, res) => {
      const { LogoFailure, findLogoCandidates, parseLogoCandidatesInput } =
        (await server.ssrLoadModule(
          '/api/logo-candidates.ts',
        )) as typeof import('./api/logo-candidates');
      const send = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(body));
      };
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      let input = null;
      try {
        input = parseLogoCandidatesInput(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        // 아래에서 400 으로 답한다.
      }
      if (!input) {
        send(400, { status: 400, code: 'INVALID_REQUEST', message: '원문 주소가 없습니다.' });
        return;
      }
      try {
        send(200, await findLogoCandidates(input.url));
      } catch (error) {
        if (error instanceof LogoFailure) {
          send(error.status, { status: error.status, code: error.code, message: error.message });
          return;
        }
        throw error;
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), redashDevApi],
  resolve: {
    // tsconfig.json 의 paths 와 같은 별칭. Vite 는 tsconfig 를 읽지 않는다.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 4001,
    strictPort: true,
    // Same-origin from the browser avoids CORS and keeps packages/api free of
    // any base-URL config — see packages/api/src/lib/http-client.ts.
    // 앞에 적은 항목이 먼저 걸린다. `/api/v1/auth` 가 `/api` 보다 앞에 있어야 한다.
    proxy: {
      // 단축링크 생성. 배포본의 `api/shlink-short-url.ts` 가 하는 일을 키만 붙여 대신한다(호출자 검증은
      // 하지 않는다 — 로컬 전용이다). 키가 없으면 Shlink 가 401 로 답한다.
      '/shlink-api/short-urls': {
        target: SHLINK_API_URL,
        changeOrigin: true,
        rewrite: () => '/rest/v3/short-urls',
        headers: { 'X-Api-Key': SHLINK_API_KEY },
      },
      '/api/v1/auth': { target: USER_API_ORIGIN, changeOrigin: true },
      '/api': { target: ADMIN_API_ORIGIN, changeOrigin: true },
      // 오공고의 `/api/**` 와 겹치지 않게 접두사를 따로 둔다(`apps/web` 의 next.config.ts 와 같은 이름이다).
      // 렛츠커리어 쪽 실제 경로는 `/api/**` 라 접두사만 바꿔 넘긴다.
      '/letscareer-api': {
        target: LETSCAREER_API_ORIGIN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/letscareer-api/, '/api'),
        // 브라우저가 붙인 `Origin: http://localhost:4001` 을 떼고 보낸다. 렛츠커리어는 허용 목록에 없는
        // `Origin` 을 인증보다 먼저 403 `Invalid CORS request` 로 막아, 떼지 않으면 로컬에서는 SSO 응답을
        // 한 번도 볼 수 없다(2026-09-22 확인). `apps/web` 이 같은 요청으로 400 을 받는 것은 Next 의
        // rewrite 가 이 헤더를 넘기지 않기 때문이고, 여기서 맞추는 것은 그 동작이다.
        // CORS 는 브라우저를 보호하는 장치라 서버 대 서버인 프록시에는 해당하지 않는다. 렛츠커리어가
        // 실제로 거는 제한은 `redirectUri` 화이트리스트이고 그것은 그대로 걸린다.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
        },
      },
    },
  },
});
