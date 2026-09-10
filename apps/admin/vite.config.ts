import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const ADMIN_API_ORIGIN = process.env.OGONGGO_ADMIN_API_ORIGIN ?? 'http://localhost:8081';

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
    proxy: {
      '/api': { target: ADMIN_API_ORIGIN, changeOrigin: true },
    },
  },
});
