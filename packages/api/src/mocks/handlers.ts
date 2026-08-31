import type { HttpHandler } from 'msw';

/**
 * `pnpm codegen` (orval, mock: true) writes a `getUserMock`/`getAdminMock` handler
 * set next to each generated client, under src/generated/<client>/endpoints.ts —
 * merge those in here once they exist. Empty until the first codegen run.
 */
export const handlers: HttpHandler[] = [];
