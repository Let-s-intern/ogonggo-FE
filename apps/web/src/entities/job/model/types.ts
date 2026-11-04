import type {
  ListPublicJobsJobField,
  ListPublicJobsJobRoleItem,
  UserJobDetailResponse,
  UserJobSummaryResponse,
} from '@ogonggo/api';

/**
 * 사용자 공고 응답에 아직 없는 등록 시각(제안 칸, 어드민 공고 응답의 `registeredAt` 과 같은 값). 목
 * (`packages/api/src/mocks/handlers.ts`)만 싣는다. 카드·상세의 `NEW` 배지가 쓴다(`isNewJob`). 백엔드가 칸을
 * 더하고 코드젠하면 생성 모델에 들어오므로 이 타입을 지운다.
 */
interface JobRegisteredAt {
  registeredAt?: string;
}

/** `GET /api/v1/jobs`의 목록 항목 하나 — 본문 필드는 없다. */
export type JobSummary = UserJobSummaryResponse & JobRegisteredAt;

/**
 * 오늘의 추천 공고가 카드에 붙이는 추천 문구. `GET /api/v1/jobs/today` 항목의
 * `recommendationTitle`/`recommendationDescription` 이다.
 */
export interface JobRecommendation {
  title: string;
  description: string;
}

/** `GET /api/v1/jobs/{jobId}`의 상세 — JobSummary의 모든 필드 + 본문 필드. */
export type JobDetail = UserJobDetailResponse & JobRegisteredAt;

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
export type JobRole = ListPublicJobsJobRoleItem;
