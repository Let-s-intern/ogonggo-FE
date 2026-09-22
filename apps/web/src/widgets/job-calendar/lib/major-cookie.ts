/**
 * 마지막으로 고른 관심 직무를 기억하는 쿠키
 * (`.claude/tasks/memos/결정-달력-직무-쿠키-2026-09-22.md`).
 *
 * 헤더의 `공고 달력`은 언제나 `/calendar`로 간다. 기억하지 않으면 달력에 올 때마다 직무부터
 * 고르게 되는데, 직무는 자주 바뀌지 않는다.
 *
 * `localStorage`가 아니라 쿠키인 이유는 **서버가 첫 렌더에 읽어야** 하기 때문이다. 라우트
 * (`app/(site)/calendar/page.tsx`)가 읽어 바로 `redirect`하므로 선택 화면이 번쩍이지 않는다.
 * 토큰을 `localStorage`에 두는 것(`shared/api/authTokens.ts`)과 결이 다르다 — 그쪽은 서버가
 * 볼 이유가 없고, 이쪽은 서버가 봐야 값어치가 있다.
 *
 * 담는 값은 slug 목록뿐이다(`it,design`). 로그인과 무관하고 개인 정보가 아니다.
 */
export const JOB_MAJOR_COOKIE_NAME = 'ogonggo.calendar.majors';

/** 1년. 직무는 자주 바뀌지 않으니 세션이 끝나도 남아야 기억하는 뜻이 있다. */
const JOB_MAJOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * 고른 직무를 쿠키에 적는다. **브라우저에서만 부른다**(`JobMajorPicker`의 `공고보기`).
 *
 * `httpOnly`도 `secure`도 걸지 않는다. 브라우저가 적는 쿠키라 `httpOnly`는 애초에 못 걸고,
 * `secure`를 걸면 http 인 로컬 개발에서 저장 자체가 안 된다. 새어도 잃을 것이 없는 값이다.
 */
export function writeJobMajorCookie(slugs: string[]): void {
  document.cookie = [
    `${JOB_MAJOR_COOKIE_NAME}=${slugs.join(',')}`,
    'path=/',
    `max-age=${JOB_MAJOR_COOKIE_MAX_AGE_SECONDS}`,
    'samesite=lax',
  ].join('; ');
}
