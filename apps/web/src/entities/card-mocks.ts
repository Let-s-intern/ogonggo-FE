import type { BootcampSummary } from './bootcamp/model/types';
import type { JobRecommendation, JobSummary } from './job/model/types';
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
  region: 'SEOUL',
  recruitmentType: 'PERIOD',
  recruitmentEndAt: endAt(7),
  bookmarked: false,
  viewCount: 1284,
  bookmarkCount: 42,
  commentCount: 7,
};

/**
 * `featured` 모바일 카드의 제목 `line-clamp-3` 을 채우고 넘기는 긴 제목. PC 는 `line-clamp-2` 에서
 * 말줄임이 된다.
 */
export const JOB_LONG_TITLE_MOCK: JobSummary = {
  ...JOB_MOCK,
  title: '[신사업] 콘텐츠 마케팅 인턴 체험형 채용 서울 본사 근무 정규직 전환 가능 신입 경력 무관',
};

/**
 * 마감된 공고. D-day 자리에 회색 `마감` 배지가 뜬다(`entities/CardEdgeCases.stories.tsx` 와 같은
 * 값). `closedAt` 만 얹으면 모집 마감일이 아직 남아 D-day 가 먼저 그려지므로(`JobCard` 는 D-day,
 * `마감` 순으로 고른다) 마감일도 함께 과거로 둔다.
 */
export const JOB_CLOSED_MOCK: JobSummary = {
  ...JOB_MOCK,
  recruitmentEndAt: '2026-01-01T23:59:00Z',
  closedAt: '2026-01-02T00:00:00Z',
};

/**
 * 로고가 있는 공고. `JOB_MOCK` 은 `logoUrl` 이 없고 회사명도 로고 목록에 없어 기본 로고(오공고)로
 * 떨어진다 — 로고가 있을 때와 나란히 보려고 스토리북이 서빙하는 `/icon-192.png` 를 건다
 * (`packages/ui/.storybook/main.ts` 의 `staticDirs`).
 */
export const JOB_WITH_LOGO_MOCK: JobSummary = { ...JOB_MOCK, logoUrl: '/icon-192.png' };

/** 오늘의 추천 공고 카드가 제목 아래에 붙이는 추천 문구. 문구 길이는 어드민 한도(30자·50자) 안이다. */
export const JOB_RECOMMENDATION_MOCK: JobRecommendation = {
  title: '경력 없이 시작하고 싶다면',
  description: '실무 중심 프로젝트로 빠른 성장',
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
  positions: ['FRONTEND', 'DESIGN'],
  recruitmentStartDate: endDate(-7),
  recruitmentEndDate: endDate(7),
  viewCount: 412,
  commentCount: 5,
  applicationCount: 2,
  bookmarkCount: 9,
  bookmarked: false,
};
