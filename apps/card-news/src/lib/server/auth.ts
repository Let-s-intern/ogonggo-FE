import { scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * 비밀번호 하나로 들어가는 잠금. 사람 계정이 없는 내부 도구라 `CARD_NEWS_PASSWORD` 와 같은 값을 치면
 * 30일짜리 쿠키를 준다. 쿠키 값은 비밀번호에서 scrypt 로 뽑은 키라, 비밀번호를 바꾸면 기존 로그인이
 * 모두 풀린다.
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

// 비밀번호에서 키를 뽑는 데는 scrypt 를 쓴다. 쿠키 값과 비교값이 모두 여기서 나온다. 같은
// 비밀번호로 매 요청 다시 뽑지 않게 기억해 둔다.
const derived = new Map<string, Buffer>();

function derive(secret: string, purpose: 'session' | 'check'): Buffer {
  const key = `${purpose}:${secret}`;
  let value = derived.get(key);
  if (!value) {
    value = scryptSync(secret, `card-news-${purpose}-v1`, 32);
    derived.set(key, value);
  }
  return value;
}

export function sessionToken(): string | null {
  const secret = password();
  return secret ? derive(secret, 'session').toString('hex') : null;
}

export function passwordMatches(input: string): boolean {
  const secret = password();
  if (!secret || !input) {
    return false;
  }
  // 입력값은 기억하지 않는다(틀린 비밀번호를 쌓지 않게).
  const attempt = scryptSync(input, 'card-news-check-v1', 32);
  return timingSafeEqual(attempt, derive(secret, 'check'));
}

export function sessionValid(cookie: string | undefined): boolean {
  if (gateDisabled()) {
    return true;
  }
  const token = sessionToken();
  if (!token || !cookie || cookie.length !== token.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(token));
}
