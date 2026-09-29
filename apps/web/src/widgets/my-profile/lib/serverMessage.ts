import { HttpError } from '@ogonggo/api';

/**
 * 백엔드 JSON 오류(`{ code, message }`)의 `message`. 비밀번호 불일치·형식 오류처럼 서버가 이미
 * 사람이 읽을 말로 준 것을 그대로 보인다. JSON 이 아니거나 문구가 없으면 `null` 이고, 부른 쪽이
 * 자기 문구를 쓴다.
 */
export function serverMessageOf(error: unknown): string | null {
  if (!(error instanceof HttpError) || !error.body) {
    return null;
  }
  try {
    const parsed = JSON.parse(error.body) as { message?: unknown };
    return typeof parsed.message === 'string' && parsed.message ? parsed.message : null;
  } catch {
    return null;
  }
}
