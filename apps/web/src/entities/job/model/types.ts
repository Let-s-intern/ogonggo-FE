import type { UserJobDetailResponse, UserJobSummaryResponse } from '@ogonggo/api';

/** `GET /api/v1/jobs`의 목록 항목 하나 — 본문 필드는 없다. */
export type JobSummary = UserJobSummaryResponse;

/** `GET /api/v1/jobs/{jobId}`의 상세 — JobSummary의 모든 필드 + 본문 필드. */
export type JobDetail = UserJobDetailResponse;

export type JobEmploymentType = JobSummary['employmentType'];
export type JobExperienceType = JobSummary['experienceType'];
export type JobEducationLevel = JobSummary['educationLevel'];
export type JobRecruitmentType = JobSummary['recruitmentType'];
