import type { BootcampSummary } from './bootcamp/model/types';
import type { JobSummary } from './job/model/types';
import type { SideStudySummary } from './side-study/model/types';

/**
 * 스토리북 카드 스토리 전용 목데이터. 앱 코드는 이 파일을 임포트하지 않는다 — 화면이 쓰는
 * 데이터는 `packages/api` 의 MSW 핸들러에서 온다.
 *
 * 스토리 파일(`*.stories.tsx`) 안에 두지 않은 이유는 스토리북이 스토리 파일의 이름 있는
 * 내보내기를 전부 스토리로 읽기 때문이다. 목데이터를 export 하면 사이드바에 빈 스토리가
 * 생긴다.
 *
 * 타입은 `packages/api` 의 생성 타입 그대로다(`UserJobSummaryResponse` 등). `as any` 로
 * 우회하지 않는다 — 우회하면 응답에 없는 필드를 카드에 그려 놓고도 모르게 된다.
 */

/** 오늘로부터 며칠 뒤의 ISO 일시. D-day 배지가 날짜와 함께 흘러가지 않게 고정한다. */
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function endAt(days: number): string {
  const date = daysFromNow(days);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
}

/** 사이드·스터디의 모집 일자는 시각 없는 `YYYY-MM-DD` 다(`shared/lib/localDate.ts`). */
function endDate(days: number): string {
  const date = daysFromNow(days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * id 6 은 `REAL_JOB_SEEDS` 의 첫 실데이터다(`entities/job/model/job-major.ts` 가 이 id 로
 * 직무 카테고리를 찾는다). 시나리오 픽스처 id 1~5 를 쓰면 메타 줄에서 직무가 통째로 빠져
 * 목록 화면과 다른 카드를 보게 된다.
 */
export const JOB_MOCK: JobSummary = {
  id: 6,
  companyName: '넥스트웨이브',
  title: '프론트엔드 개발자 (React/Next.js)',
  employmentType: 'FULL_TIME',
  experienceType: 'NEWCOMER',
  educationLevel: 'BACHELOR',
  region: '서울 강남구',
  recruitmentType: 'PERIOD',
  recruitmentEndAt: endAt(7),
  bookmarked: false,
  viewCount: 1284,
  bookmarkCount: 42,
  commentCount: 7,
};

export const BOOTCAMP_MOCK: BootcampSummary = {
  id: 1,
  companyName: '새싹 SeSAC',
  title: '프론트엔드 개발자 양성과정 8기',
  programType: '부트캠프',
  operationType: 'OFFLINE',
  recruitmentType: 'PERIOD',
  recruitmentEndAt: endAt(7),
  programStartDate: '2026-11-03',
  programEndDate: '2027-04-30',
  capacity: 30,
  tuitionType: 'GOVERNMENT_FUNDED',
  representativeImageUrl: '',
  shortDescription: '국비지원 6개월 과정',
  status: 'RECRUITING',
  bookmarked: false,
  viewCount: 932,
  bookmarkCount: 18,
  commentCount: 3,
};

export const SIDE_STUDY_MOCK: SideStudySummary = {
  id: 1,
  author: { userId: 1, nickname: '오공고' },
  title: '사이드 프로젝트 같이 하실 프론트엔드 구해요',
  recruitmentType: 'SIDE_PROJECT',
  progressMethod: 'ONLINE',
  recruitmentStatus: 'RECRUITING',
  capacity: 6,
  activityDurationMonths: 3,
  technologyStacks: ['React', 'TypeScript', 'Next.js'],
  recruitmentStartDate: endDate(-7),
  recruitmentEndDate: endDate(7),
  viewCount: 412,
  commentCount: 5,
  applicationCount: 2,
  bookmarkCount: 9,
  bookmarked: false,
};
