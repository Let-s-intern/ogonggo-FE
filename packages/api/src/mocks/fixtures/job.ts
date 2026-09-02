import { faker } from '@faker-js/faker';
import type { UserJobDetailResponse } from '../../generated/user/models/userJobDetailResponse';
import type { UserJobDetailResponseEducationLevel } from '../../generated/user/models/userJobDetailResponseEducationLevel';
import type { UserJobDetailResponseEmploymentType } from '../../generated/user/models/userJobDetailResponseEmploymentType';
import type { UserJobDetailResponseExperienceType } from '../../generated/user/models/userJobDetailResponseExperienceType';
import { REAL_JOB_SEEDS } from './real-jobs-seed';

/**
 * Fixed seed so the fixture set generated below — and with it every id,
 * sort order and pagination boundary the handlers in ./handlers.ts derive
 * from it — stays identical across server restarts. Faker calls must stay
 * in this same order every time the module loads; do not move this call.
 */
faker.seed(20260831);

const EMPLOYMENT_TYPES: UserJobDetailResponseEmploymentType[] = [
  'FULL_TIME',
  'CONTRACT',
  'INTERN',
  'PART_TIME',
  'ETC',
];

const EXPERIENCE_TYPES: UserJobDetailResponseExperienceType[] = [
  'NEWCOMER',
  'EXPERIENCED',
  'BOTH',
  'IRRELEVANT',
];

const EDUCATION_LEVELS: UserJobDetailResponseEducationLevel[] = [
  'ANY',
  'HIGH_SCHOOL',
  'ASSOCIATE',
  'BACHELOR',
  'MASTER',
  'DOCTORATE',
];

const isoDate = (date: Date) => date.toISOString().slice(0, 19) + 'Z';

const bodyFields = () => ({
  companyAndTeamIntroduction: faker.company.catchPhrase(),
  responsibilities: faker.lorem.paragraph(),
  qualifications: faker.lorem.paragraph(),
  preferredQualifications: faker.lorem.paragraph(),
  compensation: faker.lorem.sentence(),
  benefits: faker.lorem.sentence(),
  hiringProcess: faker.lorem.sentence(),
});

const baseJob = (id: number): UserJobDetailResponse => ({
  id,
  companyName: faker.company.name(),
  title: faker.person.jobTitle(),
  employmentType: faker.helpers.arrayElement(EMPLOYMENT_TYPES),
  experienceType: faker.helpers.arrayElement(EXPERIENCE_TYPES),
  experienceMinYears: faker.helpers.arrayElement([undefined, faker.number.int({ min: 0, max: 3 })]),
  experienceMaxYears: faker.helpers.arrayElement([undefined, faker.number.int({ min: 3, max: 10 })]),
  educationLevel: faker.helpers.arrayElement(EDUCATION_LEVELS),
  region: faker.location.city(),
  recruitmentType: 'PERIOD',
  recruitmentStartAt: isoDate(faker.date.recent({ days: 30 })),
  recruitmentEndAt: isoDate(faker.date.soon({ days: 30 })),
  sourceUrl: faker.internet.url(),
  closedAt: undefined,
  bookmarked: false,
  viewCount: faker.number.int({ min: 0, max: 5000 }),
  bookmarkCount: faker.number.int({ min: 0, max: 200 }),
  commentCount: faker.number.int({ min: 0, max: 50 }),
  ...bodyFields(),
});

/** 본문 필드~sourceUrl 전부 채워진 정상 케이스. */
const full: UserJobDetailResponse = {
  ...baseJob(1),
  companyName: '오공고',
  title: '프론트엔드 엔지니어',
  region: '서울 강남구',
  sourceUrl: 'https://example.com/careers/frontend-engineer',
  viewCount: 1234,
};

/** 본문 필드 전부 undefined — 상세 페이지 섹션 숨김 검증 대상. */
const noBodyFields: UserJobDetailResponse = {
  ...baseJob(2),
  companyAndTeamIntroduction: undefined,
  responsibilities: undefined,
  qualifications: undefined,
  preferredQualifications: undefined,
  compensation: undefined,
  benefits: undefined,
  hiringProcess: undefined,
};

/** sourceUrl만 없음 — 원문 이동 버튼 숨김 검증 대상. */
const noSourceUrl: UserJobDetailResponse = {
  ...baseJob(3),
  sourceUrl: undefined,
};

/** region 없음 — JobMeta 지역 표시 없음 검증 대상. */
const noRegion: UserJobDetailResponse = {
  ...baseJob(4),
  region: undefined,
};

/** 상시채용 — recruitmentEndAt 없이 ALWAYS_OPEN. */
const alwaysOpen: UserJobDetailResponse = {
  ...baseJob(5),
  recruitmentType: 'ALWAYS_OPEN',
  recruitmentStartAt: undefined,
  recruitmentEndAt: undefined,
};

/**
 * `real-jobs-seed.ts`의 696건 실데이터(사용자가 직접 내려받은 크롤러 운영 DB 스냅샷 전부)를
 * `UserJobDetailResponse`로 변환한다. 회사명·제목·고용형태·경력·지역·본문 4종
 * (주요업무/자격요건/우대사항/채용절차)·원문 링크는 전부 실제 크롤링 결과다 — 그 DB의
 * `normalized_jobs`가 이 필드들을 이미 컬럼으로 분리해 갖고 있어서 더 이상 제목 문구로
 * 추측하지 않는다. 여전히 크롤러가 수집하지 않는 필드(학력, 급여/복지 본문, 경력 연차 숫자)는
 * 지어내지 않고 비워둔다 — `educationLevel`은 신호가 없어 전부 `ANY`,
 * `compensation`/`benefits`는 전부 `undefined`(해당 섹션은 화면에서 자연히 숨는다).
 */
const realFiller: UserJobDetailResponse[] = REAL_JOB_SEEDS.map((seed, index) => {
  const id = 6 + index;
  const endAt = new Date();
  endAt.setUTCDate(endAt.getUTCDate() + seed.daysOut);
  endAt.setUTCHours(23, 59, 0, 0);

  return {
    id,
    companyName: seed.company,
    title: seed.title,
    employmentType: seed.employmentType,
    experienceType: seed.experienceType,
    experienceMinYears: undefined,
    experienceMaxYears: undefined,
    educationLevel: 'ANY',
    region: seed.region,
    recruitmentType: 'PERIOD',
    recruitmentStartAt: undefined,
    recruitmentEndAt: isoDate(endAt),
    sourceUrl: seed.sourceUrl,
    closedAt: undefined,
    bookmarked: seed.bookmarked,
    viewCount: seed.viewCount,
    bookmarkCount: seed.bookmarkCount,
    commentCount: seed.commentCount,
    companyAndTeamIntroduction: undefined,
    responsibilities: seed.responsibilities ?? undefined,
    qualifications: seed.qualifications ?? undefined,
    preferredQualifications: seed.preferredQualifications ?? undefined,
    compensation: undefined,
    benefits: undefined,
    hiringProcess: seed.hiringProcess ?? undefined,
  };
});

/**
 * 하루에 마감이 몇 건 몰릴지를 정한 표. 14일 주기로 반복하며 한 주기 합이 70건이다.
 *
 * `daysOut`이 만든 원래 분포는 30일에 700건이 몰려 하루 22~25건이었다 — 달력의 모든 칸이
 * "로고 6개 + `+18`"이 되어 6건인 날도 7건인 날도 구분할 수 없다(PRD 8.2, Push 1 task 3.2).
 * 목업(`docs/asset/공고달력.png`)은 하루 1~4건이 보통이고 가끔 10건, 빈 날도 있다. 그 모양이
 * 나오도록 밀도만 다시 잡는다 — **순서는 그대로다**(아래 `withCalendarDeadlines`가 기존
 * 마감일 순서대로 나눠 주므로 원래 먼저 마감하던 공고가 여전히 먼저 마감한다).
 *
 * 오늘(오프셋 0)이 주기의 8번째 자리에 오도록 `CALENDAR_FIRST_DAY_OFFSET`을 -21로 뒀다.
 * 그래서 이번 달 격자 안에 확인용 날이 전부 들어온다. `+N` 기준이 "8개 초과일 때 7개까지"로
 * 바뀌면서(PRD 8.2) 경계인 8건과 9건이 둘 다 필요해져 주기의 9번째를 10에서 9로, 14번째를
 * 6에서 7로 옮겼다 — 주기 합 70은 그대로다.
 *
 * | 오늘 기준 | 마감 건수 | 공고 id | 확인하는 것 |
 * |---|---|---|---|
 * | 오늘 | 5 | 30, 60, 90, 120, 188 | 주간 뷰 파랑 막대(PRD 8.3) |
 * | -1일 | 8 | 470, 500, 530, 560, 590, 620, 650, 680 | 8건 경계 — 8개가 다 보이고 `+N`이 없다 |
 * | +1일 | 9 | 213, 243, 273, 303, 333, 363, 393, 423, 453 | 8건 초과 첫 칸 — 7개 + `+2` |
 * | +4일 | 12 | 13, 43, 73, 103, 133, 155, 175, 198, 226, 256, 663, 693 | 7개 + `+5` |
 * | +5일 | 7 | 286, 316, 346, 376, 406, 436, 466 | 7건은 전부 보인다 |
 * | +12일 | 0 | 없음 | 빈 날 |
 *
 * id는 오늘이 며칠이든 그대로다 — 아래 `withCalendarDeadlines`가 원래 마감일 순서로 나눠 주고
 * 그 순서 자체가 `daysOut`으로 고정돼 있다.
 */
const CALENDAR_DAY_QUOTAS = [2, 4, 1, 6, 3, 0, 8, 5, 9, 4, 2, 12, 7, 7];

/** 분포의 첫 날. 지난 3주에도 마감이 있어야 이번 달 격자의 앞부분과 지난 달이 비지 않는다. */
const CALENDAR_FIRST_DAY_OFFSET = -21;

/**
 * 여러 날에 걸친 공고. id 끝자리로 고른다 — 3이면 6일, 5면 2일, 7이면 13일짜리 모집 기간이고
 * 나머지는 시작일이 없다(크롤러가 수집하지 않는 값이라 지어내지 않는다 —
 * `./real-jobs-seed.ts`). 13일짜리는 주 경계를 넘어 잘리는 막대를 만든다(PRD 5.2).
 * 예: id 13·23은 6일, id 15·25는 2일, id 7·17은 13일.
 */
const CALENDAR_SPAN_DAYS: Record<number, number> = { 3: 6, 5: 2, 7: 13 };

/**
 * 오늘(로컬) 기준 상대 일수의 마감 시각. 23:59 KST = 14:59 UTC라 ISO 문자열의 날짜 부분과
 * 한국 시간대로 읽은 날짜가 같은 날을 가리킨다 — 달력은 문자열의 `YYYY-MM-DD`로 칸을 고르고
 * D-day 배지(`apps/web/src/shared/lib/dday.ts`)는 로컬 날짜로 계산하므로, 둘이 어긋나면
 * 달력에서 오늘 마감인 공고가 상세에서 D-1로 보인다.
 */
const calendarDeadline = (daysFromToday: number): string => {
  const now = new Date();
  return isoDate(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysFromToday, 14, 59)),
  );
};

/** 마감일이 있는 공고 수만큼, 위 표의 순서대로 "오늘 기준 며칠 뒤"를 늘어놓는다. */
const calendarDayOffsets = (count: number): number[] => {
  const offsets: number[] = [];
  for (let day = 0; offsets.length < count; day += 1) {
    const quota = CALENDAR_DAY_QUOTAS[day % CALENDAR_DAY_QUOTAS.length] ?? 0;
    for (let seat = 0; seat < quota && offsets.length < count; seat += 1) {
      offsets.push(CALENDAR_FIRST_DAY_OFFSET + day);
    }
  }
  return offsets;
};

/**
 * 모집 기간을 달력용 분포로 다시 잡는다. 마감일이 없는 상시채용(`alwaysOpen`)은 건드리지
 * 않는다 — 달력 응답에도 담기지 않는다(`../handlers.ts`).
 *
 * `baseJob`이 faker로 만든 모집 기간도 여기서 덮인다. faker 호출을 빼면 이 파일의 호출 순서가
 * 어긋나 다른 필드까지 전부 바뀌므로 호출은 그대로 두고 값만 덮는다(파일 상단 `faker.seed` 주석).
 */
const withCalendarDeadlines = (jobs: UserJobDetailResponse[]): UserJobDetailResponse[] => {
  const dated = jobs
    .filter((job) => job.recruitmentEndAt !== undefined)
    .sort((a, b) => (a.recruitmentEndAt ?? '').localeCompare(b.recruitmentEndAt ?? '') || a.id - b.id);
  const offsets = calendarDayOffsets(dated.length);
  const offsetById = new Map(dated.map((job, index) => [job.id, offsets[index] ?? 0]));

  return jobs.map((job) => {
    const offset = offsetById.get(job.id);
    if (offset === undefined) {
      return job;
    }
    const span = CALENDAR_SPAN_DAYS[job.id % 10];
    return {
      ...job,
      recruitmentStartAt: span === undefined ? undefined : calendarDeadline(offset - span),
      recruitmentEndAt: calendarDeadline(offset),
    };
  });
};

export const JOB_FIXTURES: UserJobDetailResponse[] = withCalendarDeadlines([
  full,
  noBodyFields,
  noSourceUrl,
  noRegion,
  alwaysOpen,
  ...realFiller,
]);

/**
 * Named ids into JOB_FIXTURES so Push 2/3 verification can target a known
 * scenario without touching this file. `notFound` is deliberately absent
 * from JOB_FIXTURES.
 */
export const JOB_SCENARIO_IDS = {
  full: full.id,
  noBodyFields: noBodyFields.id,
  noSourceUrl: noSourceUrl.id,
  noRegion: noRegion.id,
  alwaysOpen: alwaysOpen.id,
  notFound: 999999,
} as const;
