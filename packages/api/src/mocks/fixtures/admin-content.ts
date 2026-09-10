/**
 * 콘텐츠의 어드민 전용 메타데이터.
 *
 * 어드민 목록은 등록일과 등록 경로를 칸으로 갖는데(PRD "콘텐츠 · 채용공고"), 사용자 API 의
 * `UserJobDetailResponse`에는 둘 다 없다. 공개 화면이 쓰지 않는 값이라 스펙에 없는 것이고,
 * 어드민 API 가 생기면 그 응답에 들어올 자리다.
 *
 * 그렇다고 `fixtures/job.ts`를 어드민용으로 복사하지 않는다. 두 벌이 되면 어드민에서 본 공고와
 * 사용자 웹에서 본 공고가 달라진다(PRD "픽스처가 놓일 자리"). 대신 여기서 id 를 키로 메타데이터만
 * 얹는다.
 *
 * 값은 id 로부터 계산한다. 손으로 적은 표를 두면 픽스처가 늘 때마다 표를 같이 고쳐야 하고,
 * 빠뜨린 id 는 등록일 없는 행이 된다. `fixtures/job.ts`의 `withCalendarDeadlines`가 마감일을
 * 같은 이유로 계산해 넣는다.
 */

import { BOOTCAMP_FIXTURES } from './bootcamp';
import { JOB_FIXTURES } from './job';

/** 크롤러가 수집했는지, 비즈니스 회원이 직접 등록했는지. 부트캠프에는 이 칸이 없다. */
export type ContentSource = 'CRAWLER' | 'COMPANY';

export interface AdminContentMeta {
  /** ISO 8601. */
  registeredAt: string;
  source: ContentSource;
}

const startOfToday = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/**
 * id 를 0~59 일 전으로 흩는다. 나머지 연산이라 id 가 늘어도 범위를 벗어나지 않는다.
 *
 * 하루를 통째로 빼지 않고 시각까지 벌려 둔다. 같은 날 등록된 행이 여럿일 때 등록일 정렬이
 * 뒤집히지 않는지 보려면 시각이 달라야 한다.
 */
const registeredAtFor = (id: number): string => {
  const daysAgo = (id * 7) % 60;
  const minutesIntoDay = (id * 137) % (24 * 60);
  return new Date(
    startOfToday() - daysAgo * 24 * 60 * 60 * 1000 + minutesIntoDay * 60 * 1000,
  ).toISOString();
};

/** 셋 중 하나는 비즈니스 회원 등록. 목록의 등록 경로 필터가 양쪽 다 결과를 갖게 하려는 값이다. */
const sourceFor = (id: number): ContentSource => (id % 3 === 0 ? 'COMPANY' : 'CRAWLER');

/** 채용공고 id -> 어드민 메타데이터. */
export const JOB_ADMIN_META: ReadonlyMap<number, AdminContentMeta> = new Map(
  JOB_FIXTURES.map((job) => [
    job.id,
    { registeredAt: registeredAtFor(job.id), source: sourceFor(job.id) },
  ]),
);

/** 부트캠프 id -> 등록일. 부트캠프는 크롤러만 넣으므로 등록 경로를 두지 않는다. */
export const BOOTCAMP_ADMIN_REGISTERED_AT: ReadonlyMap<number, string> = new Map(
  BOOTCAMP_FIXTURES.map((bootcamp) => [bootcamp.id, registeredAtFor(bootcamp.id)]),
);

/** 대시보드가 세는 "오늘 등록된 콘텐츠" — 채용공고와 부트캠프를 합한 수다. */
export const countContentRegisteredToday = (): number => {
  const today = startOfToday();
  const isToday = (registeredAt: string) => new Date(registeredAt).getTime() >= today;
  return (
    [...JOB_ADMIN_META.values()].filter((meta) => isToday(meta.registeredAt)).length +
    [...BOOTCAMP_ADMIN_REGISTERED_AT.values()].filter(isToday).length
  );
};
