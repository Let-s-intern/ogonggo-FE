import type { JobEditorValues } from './formValues';

export type JobEditorErrors = Partial<Record<keyof JobEditorValues, string>>;

const MAX_LENGTH_MESSAGE = (max: number) => `${max}자 이하로 입력해 주세요.`;
const URL_MESSAGE = '올바른 주소를 입력해 주세요.';
const EMAIL_MESSAGE = '올바른 이메일을 입력해 주세요.';

// 서버(`@URL`, `@Email`)보다 느슨하다. 흔한 오타만 여기서 막고 나머지는 서버 400 의 메시지로 보인다.
const isUrl = (value: string) =>
  value.length <= 2048 && /^https?:\/\/\S+$/.test(value) && URL.canParse(value);
const isEmail = (value: string) => value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * 칸별 오류 문구. 서버 검증(`UpdateAdminJobRequest`)과 같은 한도를 저장 전에 보여 준다.
 *
 * 빈 칸은 제목·회사명만 오류다. 나머지는 비우면 `clear` 로 지우는 칸이다.
 */
export function validate(values: JobEditorValues): JobEditorErrors {
  const errors: JobEditorErrors = {};
  const title = values.title.trim();
  const companyName = values.companyName.trim();

  if (title === '') {
    errors.title = '제목을 입력해 주세요.';
  } else if (title.length > 255) {
    errors.title = MAX_LENGTH_MESSAGE(255);
  }
  if (companyName === '') {
    errors.companyName = '회사명을 입력해 주세요.';
  } else if (companyName.length > 150) {
    errors.companyName = MAX_LENGTH_MESSAGE(150);
  }
  if (values.parentCompanyName.trim().length > 150) {
    errors.parentCompanyName = MAX_LENGTH_MESSAGE(150);
  }
  if (values.industry.trim().length > 100) {
    errors.industry = MAX_LENGTH_MESSAGE(100);
  }

  for (const key of ['logoUrl', 'coverImageUrl', 'sourceUrl'] as const) {
    const value = values[key].trim();
    if (value !== '' && !isUrl(value)) {
      errors[key] = URL_MESSAGE;
    }
  }
  for (const key of ['applyEmail', 'inquiryEmail'] as const) {
    const value = values[key].trim();
    if (value !== '' && !isEmail(value)) {
      errors[key] = EMAIL_MESSAGE;
    }
  }

  const minYears = values.experienceMinYears.trim();
  if (minYears !== '' && !/^\d+$/.test(minYears)) {
    errors.experienceMinYears = '0 이상의 숫자를 입력해 주세요.';
  }
  const headcount = values.recruitmentHeadcount.trim();
  if (headcount !== '' && (!/^\d+$/.test(headcount) || Number(headcount) < 1)) {
    errors.recruitmentHeadcount = '1 이상의 숫자를 입력해 주세요.';
  }

  // `YYYY-MM-DD` 는 문자열 비교가 날짜 비교와 같다.
  if (
    values.recruitmentStartAt &&
    values.recruitmentEndAt &&
    values.recruitmentStartAt > values.recruitmentEndAt
  ) {
    errors.recruitmentEndAt = '마감일은 시작일보다 빠를 수 없습니다.';
  }

  return errors;
}
