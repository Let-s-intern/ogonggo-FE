import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
      '/api/v1/auth': { target: USER_API_ORIGIN, changeOrigin: true },
      '/api': { target: ADMIN_API_ORIGIN, changeOrigin: true },
      // 오공고의 `/api/**` 와 겹치지 않게 접두사를 따로 둔다(`apps/web` 의 next.config.ts 와 같은 이름이다).
      // 렛츠커리어 쪽 실제 경로는 `/api/**` 라 접두사만 바꿔 넘긴다.
      '/letscareer-api': {
        target: LETSCAREER_API_ORIGIN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/letscareer-api/, '/api'),
      },
    },
  },
});
