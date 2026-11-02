/**
 * AI 초안을 부르는 횟수 제한. 공고 하나 초안(`/api/draft`)과 묶음 초안(`/api/draft/bundle`)이 같은
 * 기록을 쓴다 — IP 마다 둘을 합쳐 10분에 20번이다.
 *
 * 서버 인스턴스의 메모리라 인스턴스가 바뀌면 비워진다. 로그인을 붙이기 전까지의 최소한이다.
 */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 20;

const calls = new Map<string, number[]>();

export const RATE_LIMIT_MESSAGE = '잠시 뒤에 다시 시도해 주세요. 10분에 20번까지 만들 수 있습니다.';

/** 요청을 보낸 IP. 로컬에서는 `local` 이다. */
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

/** 이번 호출을 허락하면 기록하고 `true`. */
export function allowDraft(ip: string): boolean {
  const now = Date.now();
  const recent = (calls.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    calls.set(ip, recent);
    return false;
  }
  recent.push(now);
  calls.set(ip, recent);
  return true;
}
