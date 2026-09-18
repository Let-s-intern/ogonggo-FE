import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const ADMIN_API_ORIGIN = process.env.OGONGGO_ADMIN_API_ORIGIN ?? 'http://localhost:8081';
// 로그인과 토큰 재발급은 admin API 가 아니라 user API 에 있다. 관리자도 사용자 API 로그인으로
// 토큰을 받는다. 로컬 `dev` 스크립트가 18080 을 넘긴다(8080 은 다른 서버가 쓴다).
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

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
    },
  },
});
