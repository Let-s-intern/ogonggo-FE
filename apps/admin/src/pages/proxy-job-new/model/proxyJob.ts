import type { CreateProxyJobRequest } from '@ogonggo/api/src/admin';
import {
  JOB_BODY_FIELDS,
  validate,
  type JobEditorErrors,
  type JobEditorValues,
} from '@/widgets/job-editor';

/**
 * 대리 등록 첫 화면의 값. 회사명만 회원의 기업 정보로 채운다.
 *
 * 필수 선택 칸(고용 형태·경력·학력·모집 기간 유형)은 목록의 첫 값으로 둔다. `내용 수정` 과 같은 칸 묶음(`JobInfoSections`)을
 * 쓰는데 그 선택 칸에는 `선택 안 함` 줄이 없어, 빈 값으로 두면 화면은 첫 값을 보이면서 실제 값은 비어 있게 된다.
 */
export function emptyProxyJobValues(companyName: string): JobEditorValues {
  return {
    title: '',
    companyName,
    parentCompanyName: '',
    industry: '',
    logoUrl: '',
    coverImageUrl: '',
    jobField: '',
    jobRole: '',
    employmentType: 'FULL_TIME',
    experienceType: 'NEWCOMER',
    experienceMinYears: '',
    educationLevel: 'ANY',
    region: '',
    recruitmentType: 'PERIOD',
    recruitmentStartAt: '',
    recruitmentEndAt: '',
    recruitmentHeadcount: '',
    closesWhenFilled: false,
    autoCloseEnabled: false,
    recruitmentNotice: '',
    applicationMethod: '',
    applyEmail: '',
    inquiryEmail: '',
    sourceUrl: '',
    fields: Object.fromEntries(
      JOB_BODY_FIELDS.map((field) => [field, '']),
    ) as JobEditorValues['fields'],
  };
}

/**
 * `내용 수정` 의 검증(`validate`)에 등록에만 있는 규칙을 더한다. 백엔드 `JobWriteValidator` 의 이메일 지원 규칙이다.
 * 나머지 칸 사이 규칙(직무·직군, 상시 채용 마감일)은 칸 묶음이 입력 단계에서 막는다.
 */
export function validateProxyJob(values: JobEditorValues): JobEditorErrors {
  const errors = validate(values);
  if (
    values.applicationMethod === 'EMAIL' &&
    values.applyEmail.trim() === '' &&
    !errors.applyEmail
  ) {
    errors.applyEmail = '이메일 지원에는 지원 이메일이 필요합니다.';
  }
  return errors;
}

const text = (value: string): string | undefined => value.trim() || undefined;
const number = (value: string): number | undefined =>
  value.trim() === '' ? undefined : Number(value);

/**
 * 입력값을 `CreateProxyJobRequest` 로. 빈 칸은 싣지 않는다. 날짜는 `buildPatch` 와 같이 시작일은 0시, 마감일은 그날 끝으로 붙인다.
 * 상시 채용이면 마감일을 싣지 않는다(백엔드가 400 을 준다).
 */
export function toProxyJobRequest(
  values: JobEditorValues,
  visibility: NonNullable<CreateProxyJobRequest['visibility']>,
): CreateProxyJobRequest {
  const body = Object.fromEntries(
    JOB_BODY_FIELDS.map((field) => [field, text(values.fields[field])]),
  ) as Pick<CreateProxyJobRequest, (typeof JOB_BODY_FIELDS)[number]>;

  return {
    companyName: values.companyName.trim(),
    parentCompanyName: text(values.parentCompanyName),
    title: values.title.trim(),
    jobField: text(values.jobField) as CreateProxyJobRequest['jobField'],
    jobRole: text(values.jobRole) as CreateProxyJobRequest['jobRole'],
    industry: text(values.industry),
    coverImageUrl: text(values.coverImageUrl),
    logoUrl: text(values.logoUrl),
    employmentType: values.employmentType as CreateProxyJobRequest['employmentType'],
    experienceType: values.experienceType as CreateProxyJobRequest['experienceType'],
    experienceMinYears: number(values.experienceMinYears),
    educationLevel: values.educationLevel as CreateProxyJobRequest['educationLevel'],
    region: text(values.region) as CreateProxyJobRequest['region'],
    recruitmentType: values.recruitmentType as CreateProxyJobRequest['recruitmentType'],
    recruitmentHeadcount: number(values.recruitmentHeadcount),
    recruitmentStartAt: values.recruitmentStartAt
      ? `${values.recruitmentStartAt}T00:00:00`
      : undefined,
    recruitmentEndAt:
      values.recruitmentType !== 'ALWAYS_OPEN' && values.recruitmentEndAt
        ? `${values.recruitmentEndAt}T23:59:59`
        : undefined,
    closesWhenFilled: values.closesWhenFilled,
    autoCloseEnabled: values.autoCloseEnabled,
    ...body,
    recruitmentNotice: text(values.recruitmentNotice),
    applicationMethod: text(values.applicationMethod) as CreateProxyJobRequest['applicationMethod'],
    applyEmail: text(values.applyEmail),
    sourceUrl: text(values.sourceUrl),
    visibility,
  };
}
