import { Hono } from 'hono';
import { createApp } from './routes.js';
import { loadConfig } from './config.js';

/**
 * Vercel 진입점. Vercel 은 `hono` 를 직접 import 하는 파일을 진입점으로 찾고, 기본 내보내기를 함수로 올린다
 * (import 가 없으면 `No entrypoint found which imports hono` 로 빌드가 실패한다).
 */
const app = new Hono();
app.route('/', createApp({ loadConfig: () => loadConfig(process.env) }));

export default app;
