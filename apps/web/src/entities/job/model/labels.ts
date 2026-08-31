import type { JobEducationLevel, JobEmploymentType, JobExperienceType } from './types';

/**
 * `JobBadge`가 쓰던 라벨 맵을 여기로 뽑아 `widgets/job-list/ui/SearchFilterBar.tsx`의 채용형태·
 * 경력 드롭다운 옵션에서도 같은 라벨을 쓴다 — 같은 값을 두 곳에 다시 적지 않는다.
 */
export const EMPLOYMENT_TYPE_LABELS: Record<JobEmploymentType, string> = {
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INTERN: '인턴',
  PART_TIME: '파트타임',
  ETC: '기타',
};

export const EXPERIENCE_TYPE_LABELS: Record<JobExperienceType, string> = {
  NEWCOMER: '신입',
  EXPERIENCED: '경력',
  BOTH: '경력무관',
  IRRELEVANT: '경력무관',
};

export const EDUCATION_LEVEL_LABELS: Record<JobEducationLevel, string> = {
  ANY: '학력무관',
  HIGH_SCHOOL: '고졸',
  ASSOCIATE: '초대졸',
  BACHELOR: '대졸',
  MASTER: '석사',
  DOCTORATE: '박사',
};
