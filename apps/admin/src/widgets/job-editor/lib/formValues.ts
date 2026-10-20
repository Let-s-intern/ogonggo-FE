import type { AdminJobDetailResponse } from '@ogonggo/api/src/admin';
import { toDateInputValue } from '@/shared/lib/format';

/** 본문 칸. 상세의 본문 카드와 `내용 수정` 모달이 같은 순서로 쓴다. 제목은 `JobContentField` 라벨이다. */
export const JOB_BODY_FIELDS = [
  'companyAndTeamIntroduction',
  'responsibilities',
  'qualifications',
  'preferredQualifications',
  'compensation',
  'benefits',
  'hiringProcess',
] as const;

export type JobBodyField = (typeof JOB_BODY_FIELDS)[number];

/**
 * `내용 수정` 모달의 입력값. 입력란이 다루는 모양 그대로 둔다.
 *
 * 선택 칸은 enum 값이거나 `''`(선택 안 함), 숫자 칸은 입력 중인 문자열, 날짜는 `YYYY-MM-DD` 다.
 * 요청 모양으로 바꾸는 일은 `buildPatch` 가 한다 — 입력란마다 숫자·`null` 을 오가면 지우다 만
 * 값과 비운 값을 가를 수 없다.
 */
export interface JobEditorValues {
  title: string;
  companyName: string;
  parentCompanyName: string;
  industry: string;
  logoUrl: string;
  coverImageUrl: string;
  jobField: string;
  jobRole: string;
  employmentType: string;
  experienceType: string;
  experienceMinYears: string;
  educationLevel: string;
  region: string;
  recruitmentType: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  recruitmentHeadcount: string;
  closesWhenFilled: boolean;
  autoCloseEnabled: boolean;
  recruitmentNotice: string;
  applicationMethod: string;
  applyEmail: string;
  inquiryEmail: string;
  sourceUrl: string;
  fields: Record<JobBodyField, string>;
}

const numberText = (value: number | null | undefined): string =>
  value == null ? '' : String(value);

/** 서버 값 → 입력값. 백엔드는 빈 칸을 `null` 로 보내기도 해서 `??` 로 받는다. */
export function toFormValues(job: AdminJobDetailResponse): JobEditorValues {
  return {
    title: job.title,
    companyName: job.companyName,
    parentCompanyName: job.parentCompanyName ?? '',
    industry: job.industry ?? '',
    logoUrl: job.logoUrl ?? '',
    coverImageUrl: job.coverImageUrl ?? '',
    jobField: job.jobField ?? '',
    jobRole: job.jobRole ?? '',
    employmentType: job.employmentType,
    experienceType: job.experienceType,
    experienceMinYears: numberText(job.experienceMinYears),
    educationLevel: job.educationLevel,
    region: job.region ?? '',
    recruitmentType: job.recruitmentType,
    recruitmentStartAt: toDateInputValue(job.recruitmentStartAt),
    recruitmentEndAt: toDateInputValue(job.recruitmentEndAt),
    recruitmentHeadcount: numberText(job.recruitmentHeadcount),
    closesWhenFilled: job.closesWhenFilled ?? false,
    autoCloseEnabled: job.autoCloseEnabled ?? false,
    recruitmentNotice: job.recruitmentNotice ?? '',
    applicationMethod: job.applicationMethod ?? '',
    applyEmail: job.applyEmail ?? '',
    inquiryEmail: job.inquiryEmail ?? '',
    sourceUrl: job.sourceUrl ?? '',
    fields: Object.fromEntries(JOB_BODY_FIELDS.map((field) => [field, job[field] ?? ''])) as Record<
      JobBodyField,
      string
    >,
  };
}
