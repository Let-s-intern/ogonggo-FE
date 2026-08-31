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
 * `real-jobs-seed.ts`의 148건 실데이터(스냅샷에서 회사명이 있는 전부)를
 * `UserJobDetailResponse`로 변환한다. 그 파일이 설명하는 대로 회사명·제목·본문·자격요건·원문
 * 링크는 실제 크롤링 결과이고, 크롤러가 아예 수집하지 않는 필드(학력·지역·경력연차·상세 본문
 * 나머지 섹션)는 지어내지 않고 비워둔다 —
 * `preferredQualifications`/`compensation`/`benefits`/`hiringProcess`가 전부 `undefined`인
 * 것도 실데이터의 한계이지 버그가 아니다(해당 섹션은 화면에서 자연히 숨는다).
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
    region: undefined,
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
    responsibilities: seed.body ?? undefined,
    qualifications: seed.requirements ?? undefined,
    preferredQualifications: undefined,
    compensation: undefined,
    benefits: undefined,
    hiringProcess: undefined,
  };
});

export const JOB_FIXTURES: UserJobDetailResponse[] = [
  full,
  noBodyFields,
  noSourceUrl,
  noRegion,
  alwaysOpen,
  ...realFiller,
];

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
