import { NO_AD_PARAMS, type DataLayerParams } from '@/shared/analytics/dataLayer';
import { computeDaysRemaining, type RecruitmentType } from '@/shared/lib/dday';
import { getJobMajor } from './job-major';
import { formatJobField } from './labels';
import type { JobField } from './types';

/**
 * 목록 카드·상세·달력이 넘기는 공고 셋(`JobSummary`, `JobDetail`, 달력 항목)에 공통인 필드.
 * 달력 항목에는 `recruitmentType` 이 없는데, 마감일로 달력에 올라온 것이라 기간 채용으로 읽는다.
 */
export interface JobInfoSource {
  id: number;
  title: string;
  companyName: string;
  employmentType: string;
  experienceType: string;
  recruitmentType?: RecruitmentType;
  recruitmentEndAt?: string;
  /** 달력 항목의 직무. 달력 카드는 이 값을 그린다. */
  jobField?: JobField;
}

/**
 * 명세 3장 "공고 정보" 10개. 공고 이벤트는 전부 이것을 펼쳐 싣는다.
 *
 * `job_category` 는 화면 표기 그대로라 카드 메타 줄과 같은 값을 쓴다 — 달력은 `jobField` 의 라벨, 나머지는
 * `getJobMajor`. 목록·상세 API 에는 직무 필드가 없어 분류가 없는 공고는 `''` 다.
 *
 * `days_left` 는 D-DAY 가 0, 상시채용이 -1 이다. 마감일이 없거나 이미 지난 공고는 `null` 이다.
 */
export function toJobInfo(job: JobInfoSource): DataLayerParams {
  const recruitmentType = job.recruitmentType ?? 'PERIOD';
  return {
    job_id: String(job.id),
    job_title: job.title,
    company_name: job.companyName,
    job_category: formatJobField(job.jobField) ?? getJobMajor(job.id) ?? '',
    employment_type: job.employmentType,
    experience_type: job.experienceType,
    days_left:
      recruitmentType === 'ALWAYS_OPEN'
        ? -1
        : computeDaysRemaining(recruitmentType, job.recruitmentEndAt),
    ...NO_AD_PARAMS,
  };
}
