import { serve } from '@hono/node-server';
import app from '../src/index.js';

/** 로컬 실행. 환경 변수는 `README.md` 의 표를 보고 `.env` 등으로 넣는다. */
const port = Number(process.env.PORT ?? 4010);
serve({ fetch: app.fetch, port }, () => {
  console.info(`admin-mcp: http://localhost:${port}/mcp`);
});
