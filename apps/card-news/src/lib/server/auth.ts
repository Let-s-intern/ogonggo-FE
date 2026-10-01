import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 비밀번호 하나로 들어가는 잠금. 사람 계정이 없는 내부 도구라 `CARD_NEWS_PASSWORD` 와 같은 값을 치면
 * 30일짜리 쿠키를 준다. 쿠키 값은 비밀번호로 만든 HMAC 이라, 비밀번호를 바꾸면 기존 로그인이 모두
 * 풀린다.
 *
 * 비밀번호가 비어 있으면 배포에서는 아무도 못 들어가고(실수로 열리지 않게), 로컬 개발에서는 잠그지
 * 않는다.
 */
export const SESSION_COOKIE = 'card_news_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function password(): string | undefined {
  return process.env.CARD_NEWS_PASSWORD?.trim() || undefined;
}

export function gateDisabled(): boolean {
  return !password() && process.env.NODE_ENV !== 'production';
}

export function passwordConfigured(): boolean {
  return Boolean(password());
}

export function sessionToken(): string | null {
  const secret = password();
  return secret ? createHmac('sha256', secret).update('card-news-session-v1').digest('hex') : null;
}

function sameText(a: string, b: string): boolean {
  // 길이가 달라도 같은 시간이 걸리게 해시로 맞춰 비교한다.
  return timingSafeEqual(
    createHash('sha256').update(a).digest(),
    createHash('sha256').update(b).digest(),
  );
}

export function passwordMatches(input: string): boolean {
  const secret = password();
  return Boolean(secret) && sameText(input, secret as string);
}

export function sessionValid(cookie: string | undefined): boolean {
  if (gateDisabled()) {
    return true;
  }
  const token = sessionToken();
  return Boolean(token && cookie) && sameText(cookie as string, token as string);
}
