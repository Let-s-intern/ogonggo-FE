/**
 * 렛츠커리어 이메일 가입의 형식 규칙. 화면 검사가 서버와 어긋나지 않게 서버 규칙을 그대로 옮긴다.
 *
 * 원본은 `lets-career-server` origin/main 의 `domain/user/helper/UserHelper.java`(`EMAIL_REGEX`,
 * `PHONE_NUMBER_REGEX`, `PASSWORD_REGEX`) 이고, 가입(`UserServiceImpl.pwSignUp`) 이 셋을 `Matcher.matches()`
 * (문자열 전체 일치) 로 본다. 그래서 여기서는 `^...$` 로 감싼다.
 *
 * `lets-intern-client` 의 `packages/utils/src/valid.ts` 는 서버와 다르다 — 휴대폰은 `01[0-9]` 를 받는데 서버는
 * `010` 만 받고, 비밀번호는 영문·숫자까지 요구하는데 서버는 특수문자 하나만 요구한다. 화면이 서버보다 넓으면
 * 통과시킨 값을 서버가 400 으로 돌려보내고, 좁으면 서버가 받는 값을 화면이 막는다. 서버를 따른다.
 */

/**
 * `EMAIL_REGEX`. 최상위 도메인이 영문 2~3 자여야 한다 — `.test`·`.info` 같은 4 자 이상 도메인은 서버가
 * `INVALID_EMAIL` 로 막는다.
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9]([-_.]?[A-Za-z0-9])*@[A-Za-z0-9]([-_.]?[A-Za-z0-9])*\.[A-Za-z]{2,3}$/;

/** `PHONE_NUMBER_REGEX`. 하이픈을 넣은 `010-0000-0000` 만 받는다. */
const PHONE_NUMBER_PATTERN = /^010-[0-9]{4}-[0-9]{4}$/;

/** `PASSWORD_REGEX`. 8 자 이상, 영문·숫자가 아닌 글자 하나 이상. */
const PASSWORD_PATTERN = /^(?=.*[^a-zA-Z0-9]).{8,}$/;

export const isValidLetsCareerEmail = (email: string) => EMAIL_PATTERN.test(email);
export const isValidLetsCareerPhoneNumber = (phoneNumber: string) =>
  PHONE_NUMBER_PATTERN.test(phoneNumber);
export const isValidLetsCareerPassword = (password: string) => PASSWORD_PATTERN.test(password);

/**
 * 입력 중인 휴대폰 번호에 하이픈을 넣는다. 숫자만 남겨 11 자리에서 자른 뒤 3-3, 3-3-4, 3-4-4 로 끊는다.
 * `lets-intern-client` 의 `apps/web/src/domain/auth/hooks/useSignup.ts` 의 `formatPhoneNumber` 와 같은 동작이다.
 */
export function formatPhoneNumber(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, '');
  if (digits.length > 11) {
    digits = digits.slice(0, 11);
  }
  if (digits.length <= 6) {
    return digits.replace(/(\d{0,3})(\d{0,3})/, (_, p1: string, p2: string) =>
      p2 ? `${p1}-${p2}` : p1,
    );
  }
  if (digits.length <= 10) {
    return digits.replace(/(\d{0,3})(\d{0,3})(\d{0,4})/, (_, p1: string, p2: string, p3: string) =>
      p3 ? `${p1}-${p2}-${p3}` : `${p1}-${p2}`,
    );
  }
  return digits.replace(
    /(\d{3})(\d{4})(\d+)/,
    (_, p1: string, p2: string, p3: string) => `${p1}-${p2}-${p3}`,
  );
}
