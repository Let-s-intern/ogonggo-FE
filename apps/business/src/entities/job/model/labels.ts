import { enumLabels, enumOptions, enumParent } from '@ogonggo/api';

import type {
  JobEducationLevel,
  JobEmploymentType,
  JobExperienceType,
  JobField,
  JobRegion,
  JobRole,
} from './types';

/**
 * `JobBadge`가 쓰던 라벨 맵을 여기로 뽑아 `widgets/job-list/lib/filter.ts`의 채용 형태·
 * 요구 경력 체크박스 옵션에서도 같은 라벨을 쓴다 — 같은 값을 두 곳에 다시 적지 않는다.
 */
export const EMPLOYMENT_TYPE_LABELS: Record<JobEmploymentType, string> =
  enumLabels('JobEmploymentType');

/**
 * 채용 형태 필터(공고 목록·달력·지원 보드)에 보이는 선택지. `일학습병행` 은 뺀다 — 이미 올라온 공고의
 * 배지·상세는 `EMPLOYMENT_TYPE_LABELS` 가 그대로 그리고, 고르는 칸에서만 숨긴다.
 */
export const EMPLOYMENT_TYPE_FILTER_OPTIONS = (
  Object.entries(EMPLOYMENT_TYPE_LABELS) as [JobEmploymentType, string][]
).filter(([value]) => value !== 'WORK_STUDY');

export const EXPERIENCE_TYPE_LABELS: Record<JobExperienceType, string> =
  enumLabels('JobExperienceType');

export const EDUCATION_LEVEL_LABELS: Record<JobEducationLevel, string> =
  enumLabels('JobEducationLevel');

/**
 * 근무 지역(시·도). 백엔드가 자유 문자열에서 enum 으로 바꿨다(ogonggo-BE LC-3385). 라벨은 enum
 * 카탈로그의 `Region` 이다 — 광주는 따로 없고 `전남광주`로 묶인다.
 */
export const REGION_LABELS: Record<JobRegion, string> = enumLabels('Region');

/** 화면에 쓸 지역 이름. 값이 없으면 `undefined` 다. */
export function formatRegion(region: JobRegion | undefined): string | undefined {
  return region ? REGION_LABELS[region] : undefined;
}

/**
 * 직군. 백엔드가 자유 문자열에서 enum 으로 바꿨다(ogonggo-BE LC-3385). 라벨과 순서는
 * enum 카탈로그(`GET /api/v1/enums` 스냅숏)의 `JobField` 그대로다.
 */
export const JOB_FIELD_LABELS: Record<JobField, string> = enumLabels('JobField');

/**
 * 백엔드가 없앤 직군과 그 직군이 합쳐 들어간 직군(ogonggo-BE #86). 공유된 옛 주소
 * (`?jobField=AI_DATA`)를 버리면 고른 것이 말없이 사라지고, 그대로 보내면 400 이라 바꿔 읽는다.
 */
const MERGED_JOB_FIELDS: Readonly<Record<string, JobField>> = {
  AI_DATA: 'IT_DEVELOPMENT',
  MEDIA_ENTERTAINMENT: 'MARKETING_ADVERTISING',
  ACCOUNTING_TAX_FINANCE: 'HR_GENERAL_AFFAIRS',
  CUSTOMER_SERVICE_TM: 'HR_GENERAL_AFFAIRS',
  MERCHANDISING: 'PLANNING_STRATEGY',
  DESIGN: 'PLANNING_STRATEGY',
};

/** 주소에서 읽은 직군 문자열을 지금 직군으로 읽는다. 없어진 직군은 합쳐진 직군, 모르는 값은 `undefined`. */
export function toJobField(value: string): JobField | undefined {
  if (Object.hasOwn(JOB_FIELD_LABELS, value)) {
    return value as JobField;
  }
  return Object.hasOwn(MERGED_JOB_FIELDS, value) ? MERGED_JOB_FIELDS[value] : undefined;
}

/**
 * 직무와 그 직무가 속한 직군. enum 카탈로그의 `JobRole` 이고 직군은 그 `parent` 다. 키 순서는
 * 카탈로그 순서다 — `jobRolesOf` 가 이 순서에 기댄다.
 */
export const JOB_ROLES: Record<JobRole, { label: string; field: JobField }> = Object.fromEntries(
  enumOptions('JobRole').map(({ value, label }) => [
    value,
    { label, field: enumParent('JobRole', value) as JobField },
  ]),
) as Record<JobRole, { label: string; field: JobField }>;

/** 화면에 쓸 직군 이름. 값이 없으면 `undefined` 다. */
export function formatJobField(field: JobField | undefined): string | undefined {
  return field ? JOB_FIELD_LABELS[field] : undefined;
}

/** 직군에 속한 직무들. `JOB_ROLES` 의 순서 그대로다. */
export function jobRolesOf(field: JobField): JobRole[] {
  return (Object.keys(JOB_ROLES) as JobRole[]).filter((role) => JOB_ROLES[role].field === field);
}
