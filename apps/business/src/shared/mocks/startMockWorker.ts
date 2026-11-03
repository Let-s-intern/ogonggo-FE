import { setupUserWorker } from '@ogonggo/api/src/mocks/browser';
import { businessAuthHandlers } from './businessAuth';

/** 브라우저 워커를 띄운다. 끝날 때까지 기다려야 첫 요청이 워커를 지나치지 않는다. */
export async function startMockWorker(): Promise<void> {
  await setupUserWorker(...businessAuthHandlers).start({ onUnhandledRequest: 'bypass', quiet: true });
}
