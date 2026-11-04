import type {
  ListPublicJobsJobField,
  ListPublicJobsJobRoleItem,
  UserJobDetailResponse,
  UserJobSummaryResponse,
} from '@ogonggo/api';

/**
 * 공고 등록 시각(오프셋 없는 KST date-time, 어드민 공고 응답의 `registeredAt` 과 같은 값). 백엔드는 공고 목록·인기·
 * 비슷한 공고·북마크·오늘의 공고·상세에 필수 칸으로 구현했고 아직 배포 전이다. 카드·상세의 `NEW` 배지가 쓴다
 * (`isNewJob`). 배포 뒤 코드젠하면 생성 모델에 필수 칸으로 들어오므로 이 타입을 지운다.
 *
 * 여기서는 선택 칸으로 둔다. 화면은 생성 모델 응답을 그대로 이 타입에 넘기는데(목록·인기·비슷한 공고·오늘의 공고·
 * 상세), 코드젠 전 생성 모델에는 이 칸이 없어 필수로 두면 넘기는 자리마다 단언이 필요하다. 목은 필수로 싣는다.
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
