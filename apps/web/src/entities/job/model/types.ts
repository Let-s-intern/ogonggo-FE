import type {
  ListPublicJobsJobField,
  ListPublicJobsJobRole,
  UserJobDetailResponse,
  UserJobSummaryResponse,
} from '@ogonggo/api';

/** `GET /api/v1/jobs`의 목록 항목 하나 — 본문 필드는 없다. */
export type JobSummary = UserJobSummaryResponse;

/** `GET /api/v1/jobs/{jobId}`의 상세 — JobSummary의 모든 필드 + 본문 필드. */
export type JobDetail = UserJobDetailResponse;

export type JobEmploymentType = JobSummary['employmentType'];
export type JobExperienceType = JobSummary['experienceType'];
export type JobEducationLevel = JobSummary['educationLevel'];
export type JobRegion = NonNullable<JobSummary['region']>;
export type JobRecruitmentType = JobSummary['recruitmentType'];

/**
 * 직군·직무. 목록·상세 응답에는 없고 필터·달력·기업 공고에만 있어 목록 필터의 타입을 쓴다 —
 * 생성 타입마다 이름만 다르고 값은 같은 enum 이다(ogonggo-BE LC-3385).
 */
export type JobField = ListPublicJobsJobField;
export type JobRole = ListPublicJobsJobRole;
