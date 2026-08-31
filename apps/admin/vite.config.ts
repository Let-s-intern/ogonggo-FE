import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const ADMIN_API_ORIGIN = process.env.OGONGGO_ADMIN_API_ORIGIN ?? 'http://localhost:8081';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Same-origin from the browser avoids CORS and keeps packages/api free of
    // any base-URL config — see packages/api/src/lib/http-client.ts.
    proxy: {
      '/api': { target: ADMIN_API_ORIGIN, changeOrigin: true },
    },
  },
});
