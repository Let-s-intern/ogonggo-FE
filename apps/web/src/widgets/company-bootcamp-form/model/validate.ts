import type { CompanyBootcampFormValues } from './values';

/**
 * `공고 등록` 에 필요한 값이 다 있는지 본다. 모자라면 첫 한 줄을 돌려준다.
 *
 * 필수 칸의 목록은 목업의 별표(`*`) 그대로다. 한 곳만 목업에서 읽어낼 수 없어 여기서 정한다 —
 * 마감일이 시작일보다 앞서면 백엔드에 보내기 전에 막는다. 목록의 D-day 계산이 음수가 되는
 * 공고가 생긴다.
 */
export function validateForPublish(values: CompanyBootcampFormValues): string | null {
  const required = validateRequired(values);
  if (required) {
    return required;
  }
  if (!values.representativeImageUrl) {
    return '공고 대표 이미지를 올려 주세요.';
  }
  if (!values.shortDescription.trim()) {
    return '한 줄 소개를 입력해 주세요.';
  }
  if (!values.content.trim()) {
    return '공고 상세 내용을 입력해 주세요.';
  }
  if (!values.recruitmentStartAt) {
    return '모집 시작일을 입력해 주세요.';
  }
  if (!values.recruitmentEndAt) {
    return '모집 마감일을 입력해 주세요.';
  }
  if (values.recruitmentEndAt < values.recruitmentStartAt) {
    return '모집 마감일은 모집 시작일과 같거나 그 뒤여야 합니다.';
  }
  if (!values.applicationUrl.trim()) {
    return '지원 링크를 입력해 주세요.';
  }
  if (!values.agreedToPolicy) {
    return '정보 제공 및 운영 정책에 동의해 주세요.';
  }
  return null;
}

/**
 * 임시저장에 필요한 것은 **요청이 빈 값으로는 받지 못하는 칸**이다.
 *
 * `CreateCompanyBootcampRequest` 에서 `?` 가 없는 칸은 많지만, 문자열 칸은 전부
 * `@minLength 0` 이라 빈 문자열이 통과한다. 통과하지 못하는 것은 값 목록이 정해진 셋
 * (진행 방식·수강료 유형·지원 방법) 과 날짜 둘(교육 기간) 이다. 빈 문자열을 보내면 400 이다.
 *
 * 기업·기관명·프로그램명·프로그램 유형은 요청이 빈 값을 받아 주지만 여기서 함께 요구한다.
 * 이름 없는 공고가 목록에 쌓이면 어느 줄이 무엇인지 알 수 없고, 임시저장의 목적이 "나중에
 * 이어서 쓰기" 인데 이어서 열 줄을 찾지 못한다.
 */
export function validateForDraft(values: CompanyBootcampFormValues): string | null {
  return validateRequired(values);
}

function validateRequired(values: CompanyBootcampFormValues): string | null {
  if (!values.companyName.trim()) {
    return '기업 · 기관명을 입력해 주세요.';
  }
  if (!values.title.trim()) {
    return '프로그램명을 입력해 주세요.';
  }
  if (!values.programType.trim()) {
    return '프로그램 유형을 선택해 주세요.';
  }
  if (!values.operationType) {
    return '진행 방식을 선택해 주세요.';
  }
  if (!values.programStartDate || !values.programEndDate) {
    return '교육 기간을 입력해 주세요.';
  }
  if (values.programEndDate < values.programStartDate) {
    return '교육 종료일은 시작일과 같거나 그 뒤여야 합니다.';
  }
  if (!values.tuitionType) {
    return '수강료 유형을 선택해 주세요.';
  }
  if (!values.applicationMethod) {
    return '지원 방법을 선택해 주세요.';
  }
  return null;
}
