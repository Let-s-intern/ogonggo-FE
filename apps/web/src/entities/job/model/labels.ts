import type { JobEducationLevel, JobEmploymentType, JobExperienceType, JobRegion } from './types';

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

/**
 * 근무 지역(시·도). 백엔드가 자유 문자열에서 enum 으로 바꿨다(ogonggo-BE LC-3385). 라벨은 스펙의
 * 설명 칸 그대로다 — 광주는 따로 없고 `전남광주`로 묶인다.
 */
export const REGION_LABELS: Record<JobRegion, string> = {
  NATIONWIDE: '전국',
  SEOUL: '서울',
  GYEONGGI: '경기',
  INCHEON: '인천',
  BUSAN: '부산',
  DAEGU: '대구',
  JEONNAM_GWANGJU: '전남광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GANGWON: '강원',
  GYEONGNAM: '경남',
  GYEONGBUK: '경북',
  CHUNGNAM: '충남',
  CHUNGBUK: '충북',
  JEONBUK: '전북',
  JEJU: '제주',
  OVERSEAS: '해외',
};

/** 화면에 쓸 지역 이름. 값이 없으면 `undefined` 다. */
export function formatRegion(region: JobRegion | undefined): string | undefined {
  return region ? REGION_LABELS[region] : undefined;
}
