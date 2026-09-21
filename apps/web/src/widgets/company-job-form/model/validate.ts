import type { CompanyJobFormValues } from './values';

/**
 * `공고 등록` 에 필요한 값이 다 있는지 본다. 모자라면 첫 한 줄을 돌려준다.
 *
 * 필수 칸의 목록은 목업의 별표(`*`) 그대로다. 두 곳만 목업에서 읽어낼 수 없어 여기서 정한다.
 *
 * - **지원 링크는 지원 방법과 상관없이 필수다.** `이메일 지원` 을 골라도 주소를 담을 필드가
 *   없어(v5 PRD 3 절, 담당자 이메일 칸이 비활성인 이유다) 링크마저 비면 공개 상세의
 *   `지원하러 가기` 가 갈 곳이 없다 — 그 버튼은 `sourceUrl` 하나만 본다
 *   (`shared/ui/ApplyCta.tsx`).
 * - 마감일이 접수 시작일보다 앞서면 백엔드에 보내기 전에 막는다. 목록의 D-day 계산이
 *   음수가 되는 공고가 생긴다.
 */
export function validateForPublish(values: CompanyJobFormValues): string | null {
  const required = validateRequired(values);
  if (required) {
    return required;
  }
  if (!values.jobField) {
    return '직무 분야를 선택해 주세요.';
  }
  if (!values.educationLevel) {
    return '학력을 선택해 주세요.';
  }
  if (!values.region) {
    return '지역을 선택해 주세요.';
  }
  if (!values.coverImageUrl) {
    return '공고 대표 이미지를 올려 주세요.';
  }
  if (!values.responsibilities.trim()) {
    return '주요 업무를 입력해 주세요.';
  }
  if (!values.qualifications.trim()) {
    return '자격 요건을 입력해 주세요.';
  }
  if (!values.recruitmentEndAt) {
    return '모집 마감일을 입력해 주세요.';
  }
  if (values.recruitmentStartAt && values.recruitmentEndAt < values.recruitmentStartAt) {
    return '모집 마감일은 접수 시작일과 같거나 그 뒤여야 합니다.';
  }
  if (!values.applicationMethod) {
    return '지원 방법을 선택해 주세요.';
  }
  if (!values.sourceUrl.trim()) {
    return '지원 링크를 입력해 주세요.';
  }
  return null;
}

/**
 * 임시저장에 필요한 것은 요청이 필수로 받는 넷이다 —
 * `CreateCompanyJobRequest` 에서 `?` 가 없는 칸이 기업·기관명, 공고 제목, 채용 유형, 경력
 * 이다(`recruitmentType` 도 필수지만 화면이 모집 마감일로 정한다, `model/values.ts`).
 *
 * v4 모집글의 임시저장이 제목 하나만 받는 것과 다르다. 거기는 `saveMode: DRAFT` 를 백엔드가
 * 알고 느슨하게 받아 주지만, 채용공고에는 그런 구분이 없고 등록은 언제나 초안으로 만들어진다
 * (생성 타입 설명). 넷을 비워 보내면 400 이다.
 */
export function validateForDraft(values: CompanyJobFormValues): string | null {
  return validateRequired(values);
}

function validateRequired(values: CompanyJobFormValues): string | null {
  if (!values.companyName.trim()) {
    return '기업 · 기관명을 입력해 주세요.';
  }
  if (!values.title.trim()) {
    return '공고 제목을 입력해 주세요.';
  }
  if (!values.employmentType) {
    return '채용 유형을 선택해 주세요.';
  }
  if (!values.experienceType) {
    return '경력을 선택해 주세요.';
  }
  return null;
}
