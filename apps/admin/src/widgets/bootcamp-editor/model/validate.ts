import { isBlankCurriculum, type BootcampFormValues } from './values';

export type BootcampFormErrors = Partial<Record<keyof BootcampFormValues, string>>;

const MAX_LENGTH_MESSAGE = (max: number) => `${max}자 이하로 입력해 주세요.`;
const URL_MESSAGE = '올바른 주소를 입력해 주세요.';

// 채용공고 편집의 검증(`widgets/job-editor/lib/validate.ts`)과 같은 느슨한 형식 검사다. 나머지는 서버 400 문구로 보인다.
const isUrl = (value: string) =>
  value.length <= 2048 && /^https?:\/\/\S+$/.test(value) && URL.canParse(value);
const isEmail = (value: string) => value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isWholeNumber = (value: string) => /^\d+$/.test(value);

/**
 * 칸별 오류 문구. 대표 이미지는 등록에서만 필수다 — 수집 부트캠프에는 대표 이미지가 없는 과정이 있어, 전체 수정
 * (`PUT /api/v1/admin/bootcamps/{bootcampId}`)은 비워 둔 채 받는다.
 * 필수 칸은 비즈니스 폼의 `공고 등록` 검증(`validateForPublish`)을, 칸 사이 규칙은 백엔드
 * `BootcampWriteValidator` 를, 길이는 `CreateProxyBootcampRequest` 의 한도를 따른다.
 *
 * 제휴사·커리큘럼은 줄이 없어도 된다(백엔드가 빈 목록을 받는다). 적은 줄만 본다.
 */
export function validateBootcampForm(
  values: BootcampFormValues,
  { requireRepresentativeImage = true }: { requireRepresentativeImage?: boolean } = {},
): BootcampFormErrors {
  const errors: BootcampFormErrors = {};
  const requireText = (key: keyof BootcampFormValues, message: string, max?: number) => {
    const value = String(values[key]).trim();
    if (value === '') {
      errors[key] = message;
    } else if (max !== undefined && value.length > max) {
      errors[key] = MAX_LENGTH_MESSAGE(max);
    }
  };

  requireText('companyName', '기업·기관명을 입력해 주세요.', 150);
  requireText('title', '프로그램명을 입력해 주세요.', 255);
  requireText('shortDescription', '한 줄 소개를 입력해 주세요.', 500);
  requireText('content', '상세 내용을 입력해 주세요.');
  if (!values.programType.trim()) {
    errors.programType = '프로그램 유형을 골라 주세요.';
  }
  if (!values.operationType) {
    errors.operationType = '진행 방식을 골라 주세요.';
  }
  if (!values.tuitionType) {
    errors.tuitionType = '수강료 유형을 골라 주세요.';
  }
  if (!values.applicationMethod) {
    errors.applicationMethod = '지원 방법을 골라 주세요.';
  }
  if (requireRepresentativeImage && !values.representativeImageUrl) {
    errors.representativeImageUrl = '대표 이미지를 올려 주세요.';
  }

  if (!values.programStartDate) {
    errors.programStartDate = '교육 시작일을 입력해 주세요.';
  }
  if (!values.programEndDate) {
    errors.programEndDate = '교육 종료일을 입력해 주세요.';
  } else if (values.programStartDate && values.programStartDate > values.programEndDate) {
    // `YYYY-MM-DD` 는 문자열 비교가 날짜 비교와 같다.
    errors.programEndDate = '교육 종료일은 시작일과 같거나 그 뒤여야 합니다.';
  }

  if (values.recruitmentType === 'PERIOD') {
    if (!values.recruitmentStartAt) {
      errors.recruitmentStartAt = '기간 모집은 모집 시작일이 필요합니다.';
    }
    if (!values.recruitmentEndAt) {
      errors.recruitmentEndAt = '기간 모집은 모집 마감일이 필요합니다.';
    }
  }
  if (
    values.recruitmentType === 'PERIOD' &&
    values.recruitmentStartAt &&
    values.recruitmentEndAt &&
    values.recruitmentStartAt > values.recruitmentEndAt
  ) {
    errors.recruitmentEndAt = '모집 마감일은 시작일과 같거나 그 뒤여야 합니다.';
  }
  if (
    !values.publishUntilRecruitmentEnd &&
    values.publicationStartAt &&
    values.publicationEndAt &&
    values.publicationStartAt > values.publicationEndAt
  ) {
    errors.publicationEndAt = '공개 종료일은 시작일과 같거나 그 뒤여야 합니다.';
  }

  for (const key of ['capacity', 'tuitionAmount'] as const) {
    const value = values[key].trim();
    if (value !== '' && !isWholeNumber(value)) {
      errors[key] = '0 이상의 숫자를 입력해 주세요.';
    }
  }

  const applicationUrl = values.applicationUrl.trim();
  if (values.applicationMethod === 'EXTERNAL_PAGE' && applicationUrl === '') {
    errors.applicationUrl = '외부 페이지 지원은 지원 링크가 필요합니다.';
  }
  for (const key of [
    'applicationUrl',
    'inquiryUrl',
    'sourceUrl',
    'logoUrl',
    'representativeImageUrl',
  ] as const) {
    const value = values[key].trim();
    if (value !== '' && !isUrl(value) && !errors[key]) {
      errors[key] = URL_MESSAGE;
    }
  }
  const managerEmail = values.managerEmail.trim();
  if (managerEmail !== '' && !isEmail(managerEmail)) {
    errors.managerEmail = '올바른 이메일을 입력해 주세요.';
  }

  const partners = values.partners.map((name) => name.trim()).filter((name) => name !== '');
  if (partners.some((name) => name.length > 150)) {
    errors.partners = '파트너사명은 150자 이하로 입력해 주세요.';
  } else if (new Set(partners).size !== partners.length) {
    errors.partners = '같은 파트너사를 두 번 적을 수 없습니다.';
  }

  const curriculumError = values.curriculums
    .map((row, index) => {
      if (isBlankCurriculum(row)) {
        return null;
      }
      const at = `${index + 1}번째 줄`;
      if (!isWholeNumber(row.startWeek.trim()) || Number(row.startWeek) < 1) {
        return `${at}: 시작 주차는 1 이상의 숫자여야 합니다.`;
      }
      const endWeek = row.endWeek.trim();
      if (endWeek !== '' && (!isWholeNumber(endWeek) || Number(endWeek) < Number(row.startWeek))) {
        return `${at}: 종료 주차는 시작 주차와 같거나 커야 합니다.`;
      }
      if (!row.subtitle.trim()) {
        return `${at}: 내용을 입력해 주세요.`;
      }
      if (row.subtitle.trim().length > 255) {
        return `${at}: 내용은 255자 이하로 입력해 주세요.`;
      }
      return null;
    })
    .find((message) => message !== null);
  if (curriculumError) {
    errors.curriculums = curriculumError;
  }

  return errors;
}
