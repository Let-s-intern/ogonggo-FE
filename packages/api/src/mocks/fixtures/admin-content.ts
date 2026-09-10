/**
 * 콘텐츠의 어드민 전용 메타데이터와 목록 타입.
 *
 * 어드민 목록은 등록일·등록 경로·게시 상태를 칸으로 갖는데(PRD "콘텐츠 · 채용공고"), 사용자
 * API 의 `UserJobDetailResponse` 에는 셋 다 없다. 공개 화면이 쓰지 않는 값이라 스펙에 없는
 * 것이고, 어드민 API 가 생기면 그 응답에 들어올 자리다.
 *
 * 그렇다고 `fixtures/job.ts` 를 어드민용으로 복사하지 않는다. 두 벌이 되면 어드민에서 본 공고와
 * 사용자 웹에서 본 공고가 달라진다(PRD "픽스처가 놓일 자리"). 대신 여기서 id 를 키로
 * 메타데이터만 얹는다.
 *
 * 값은 id 로부터 계산한다. 손으로 적은 표를 두면 픽스처가 늘 때마다 표를 같이 고쳐야 하고,
 * 빠뜨린 id 는 등록일 없는 행이 된다. `fixtures/job.ts` 의 `withCalendarDeadlines` 가 마감일을
 * 같은 이유로 계산해 넣는다.
 */

import type { UserBootcampDetailResponse } from '../../generated/user/models/userBootcampDetailResponse';
import type { UserBootcampSummaryResponse } from '../../generated/user/models/userBootcampSummaryResponse';
import type { UserJobDetailResponse } from '../../generated/user/models/userJobDetailResponse';
import type { UserJobSummaryResponse } from '../../generated/user/models/userJobSummaryResponse';
import { BOOTCAMP_FIXTURES } from './bootcamp';
import { JOB_FIXTURES } from './job';
import { SIDE_STUDY_FIXTURES, type SideStudyDetail } from './side-study';

/** 크롤러가 수집했는지, 비즈니스 회원이 직접 등록했는지. 부트캠프에는 이 칸이 없다. */
export type ContentSource = 'CRAWLER' | 'COMPANY';

/**
 * 지면에 나가고 있는지 아닌지, 둘뿐이다.
 *
 * 백엔드 `JobPublicationStatus` 는 `DRAFT`/`PUBLISHED`/`HIDDEN`/`ARCHIVED` 네 값이지만 어드민이
 * 구분해야 하는 것은 "지금 사용자에게 보이는가" 하나다. 초안과 보관은 운영자가 콘솔에서 만들
 * 수 있는 상태가 아니고, 목록에서 넷을 늘어놓으면 필터만 복잡해진다.
 *
 * 백엔드 enum 을 바꾸자는 뜻은 아니다. 계약을 넘길 때 어드민 응답이 네 값을 이 둘로 접어서
 * 준다 — `PUBLISHED` 만 노출이고 나머지는 비노출이다.
 */
export type Visibility = 'VISIBLE' | 'HIDDEN';

/**
 * 모집 상태. **채용공고와 부트캠프가 같은 값을 쓴다.**
 *
 * 저장된 칸이 아니라 모집 일정에서 계산한다. `Job` 엔티티에는 모집 상태 enum 이 아예 없고
 * (`closedAt`·`recruitmentStartAt`·`recruitmentEndAt`·`recruitmentType` 뿐이다), 부트캠프의
 * `BootcampStatus` 에는 "모집 예정" 에 해당하는 값이 없다. 둘을 같은 규칙으로 계산해야 두
 * 목록이 같은 뜻의 뱃지를 보여준다.
 *
 * 임시저장(`DRAFT`)은 두지 않는다. 운영자가 콘솔에서 만들 수 있는 상태가 아니고, 목록에
 * 필터로 남겨 두면 골라도 늘 0 건이다.
 */
export type RecruitmentStatus = 'UPCOMING' | 'RECRUITING' | 'CLOSED';

/** 모집 일정. 두 종류가 같은 모양으로 넘겨 같은 규칙을 태운다. */
interface RecruitmentWindow {
  closedAt?: string;
  recruitmentStartAt?: string;
  recruitmentEndAt?: string;
  /** 채용공고에만 있다. 상시 채용은 시작·종료가 없어도 늘 모집 중이다. */
  alwaysOpen?: boolean;
}

/**
 * 모집 상태를 일정에서 계산한다.
 *
 * 마감이 먼저다. 이미 닫힌 것은 시작일이 미래여도 마감이다 — 잘못 등록해 되돌린 건이 "모집
 * 예정" 으로 다시 올라오면 안 된다.
 *
 * 시작일이 미래면 모집 예정. 종료일이 지났으면 마감. 둘 다 아니면 모집 중이다.
 *
 * 날짜가 비어 있으면 모집 중으로 본다. 값이 없다고 닫힌 것으로 보면 수집이 덜 된 공고가
 * 통째로 마감으로 나간다.
 */
export function recruitmentStatusOf(window: RecruitmentWindow): RecruitmentStatus {
  if (window.closedAt) {
    return 'CLOSED';
  }
  const now = Date.now();
  if (window.recruitmentStartAt && new Date(window.recruitmentStartAt).getTime() > now) {
    return 'UPCOMING';
  }
  if (window.alwaysOpen) {
    return 'RECRUITING';
  }
  if (window.recruitmentEndAt && new Date(window.recruitmentEndAt).getTime() < now) {
    return 'CLOSED';
  }
  return 'RECRUITING';
}

/**
 * 비즈니스 회원이 올린 공고의 검수 상태.
 *
 * 크롤러가 수집한 공고에는 없다(`null`). 크롤링은 우리가 고른 사이트에서 긁어오는 것이라
 * 사람이 한 건씩 통과시킬 대상이 아니고, 검수는 외부에서 올라온 글을 지면에 올릴지 정하는
 * 일이다. 둘을 한 상태값으로 묶으면 대시보드의 "검수 대기"가 크롤링 수집량에 묻힌다.
 */
export type JobReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminJobMeta {
  /** ISO 8601. */
  registeredAt: string;
  /** 파생값. 저장된 칸이 아니라 마감 일시와 모집 유형에서 계산한다. */
  recruitmentStatus: RecruitmentStatus;
  source: ContentSource;
  visibility: Visibility;
  /** 크롤러 수집분은 `null` 이다. */
  reviewStatus: JobReviewStatus | null;
}

export type AdminJobSummary = UserJobSummaryResponse & AdminJobMeta;
export type AdminJobDetail = UserJobDetailResponse & AdminJobMeta;

export interface AdminBootcampMeta {
  registeredAt: string;
  /**
   * 파생값. 저장된 `status`(`BootcampStatus`)와 별개다.
   *
   * `BootcampStatus` 에는 "모집 예정" 이 없어서 시작일이 미래인 과정도 `RECRUITING` 으로
   * 저장된다. 채용공고와 같은 뱃지를 쓰려면 같은 규칙으로 계산해야 한다.
   */
  recruitmentStatus: RecruitmentStatus;
  /** 부트캠프도 비즈니스 회원이 직접 올릴 수 있다. 검수 대상은 그쪽뿐이다. */
  source: ContentSource;
  visibility: Visibility;
  /** 크롤러 수집분은 `null`. */
  reviewStatus: JobReviewStatus | null;
}

export type AdminBootcampSummary = UserBootcampSummaryResponse & AdminBootcampMeta;
export type AdminBootcampDetail = UserBootcampDetailResponse & AdminBootcampMeta;

/**
 * 사이드·스터디에도 등록일이 없다. `SideStudyDetail` 은 모집 시작·마감만 들고 있는데, 어드민
 * 목록이 세로로 정렬하는 기준은 글이 올라온 시각이라 둘이 다르다.
 */
export type AdminSideStudy = SideStudyDetail & { registeredAt: string };

const startOfToday = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/**
 * id 를 섞어 서로 무관한 난수 하나를 뽑는다. `salt` 가 다르면 다른 값이 나온다.
 *
 * **`id % n` 을 값마다 그대로 쓰면 안 된다.** 처음에 등록일을 `(id * 7) % 60`, 등록 경로를
 * `id % 3` 으로 잡았더니 두 값이 물렸다 — `(id * 7) % 60 === 0` 은 id 가 60 의 배수일 때만
 * 참이고 60 의 배수는 전부 3 의 배수라, **오늘 등록된 공고가 100% 비즈니스 등록으로만 나왔다.**
 * 대시보드의 "오늘 크롤링 채용공고"가 영영 0 건이었다.
 *
 * 아래는 xorshift 계열의 정수 해시다. 곱셈과 xor 로 하위 비트까지 섞은 뒤 나누므로, salt 가
 * 다른 두 값 사이에 그런 상관이 생기지 않는다.
 */
export const hashId = (id: number, salt: number): number => {
  let value = (id + salt * 0x9e37_79b9) | 0;
  value = Math.imul(value ^ (value >>> 16), 0x85eb_ca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2_ae35);
  return (value ^ (value >>> 16)) >>> 0;
};

/** 등록 시각. 0~59 일 전 사이에 흩어진다. */
const registeredAtFor = (id: number): string => {
  const daysAgo = hashId(id, 1) % 60;
  // 하루를 통째로 빼지 않고 시각까지 벌려 둔다. 같은 날 등록된 행이 여럿일 때 등록일 정렬이
  // 뒤집히지 않는지 보려면 시각이 달라야 한다.
  const minutesIntoDay = hashId(id, 2) % (24 * 60);
  return new Date(
    startOfToday() - daysAgo * 24 * 60 * 60 * 1000 + minutesIntoDay * 60 * 1000,
  ).toISOString();
};

/** 셋 중 하나는 비즈니스 회원 등록. 목록의 등록 경로 필터가 양쪽 다 결과를 갖게 하려는 값이다. */
const sourceFor = (id: number): ContentSource => (hashId(id, 3) % 3 === 0 ? 'COMPANY' : 'CRAWLER');

/** 대부분은 노출. 비노출도 섞어 둔다 — 필터를 골랐을 때 빈 목록만 나오면 도는지 알 수 없다. */
const visibilityFor = (id: number): Visibility => (hashId(id, 4) % 11 < 3 ? 'HIDDEN' : 'VISIBLE');

/** 최근 등록분만 검수 대기로 남는다. 이보다 오래된 것은 이미 처리됐다고 본다. */
const REVIEW_BACKLOG_DAYS = 7;

/**
 * 비즈니스 등록분의 검수 상태.
 *
 * 대기는 최근 일주일 안에 올라온 것만이다. 전체에서 일정 비율을 대기로 잡았더니 픽스처가
 * 수백 건이라 대시보드에 93 건이 떴다 — 운영자가 실제로 마주할 큐가 아니고, "0 이 되는 것이
 * 목표인 숫자"라는 카드의 뜻도 무너진다. 오래된 건은 이미 처리된 것으로 둔다.
 */
const reviewStatusFor = (id: number, registeredAt: string): JobReviewStatus => {
  const ageDays = (startOfToday() - new Date(registeredAt).getTime()) / 86_400_000;
  if (ageDays < REVIEW_BACKLOG_DAYS && hashId(id, 5) % 3 !== 0) {
    return 'PENDING';
  }
  return hashId(id, 6) % 5 === 0 ? 'REJECTED' : 'APPROVED';
};

const jobMetaFor = (job: UserJobDetailResponse): AdminJobMeta => {
  const id = job.id;
  const source = sourceFor(id);
  const registeredAt = registeredAtFor(id);
  return {
    registeredAt,
    recruitmentStatus: recruitmentStatusOf({
      closedAt: job.closedAt,
      recruitmentStartAt: job.recruitmentStartAt,
      recruitmentEndAt: job.recruitmentEndAt,
      alwaysOpen: job.recruitmentType === 'ALWAYS_OPEN',
    }),
    source,
    visibility: visibilityFor(id),
    reviewStatus: source === 'COMPANY' ? reviewStatusFor(id, registeredAt) : null,
  };
};

/** 사용자 픽스처에 어드민 칸을 얹은 채용공고. 목록·상세가 모두 여기서 나온다. */
export const ADMIN_JOB_FIXTURES: AdminJobDetail[] = JOB_FIXTURES.map((job) => ({
  ...job,
  ...jobMetaFor(job),
}));

/**
 * `BootcampStatus`(`status`)는 모집 상태(모집중·마감)이지 노출 여부가 아니다. 둘은 다른 것이라
 * 노출 여부를 따로 얹는다 — 모집이 끝난 과정을 지면에 남겨 둘 수도, 모집 중인데 내릴 수도 있다.
 *
 * 부트캠프 id 는 1~24 로 채용공고와 겹친다. 같은 해시를 쓰면 id 1 인 공고와 부트캠프가 같은
 * 등록 경로를 갖게 되므로 salt 를 달리해 갈라 둔다.
 */
export const ADMIN_BOOTCAMP_FIXTURES: AdminBootcampDetail[] = BOOTCAMP_FIXTURES.map((bootcamp) => {
  const registeredAt = registeredAtFor(bootcamp.id);
  const source: ContentSource = hashId(bootcamp.id, 31) % 3 === 0 ? 'COMPANY' : 'CRAWLER';
  return {
    ...bootcamp,
    registeredAt,
    recruitmentStatus: recruitmentStatusOf({
      // 저장된 상태가 마감이면 그것을 따른다. 엔티티가 CLOSED 와 closedAt 을 함께 두기 때문에
      // (Bootcamp.kt 의 require) 둘 중 하나만 봐도 되지만, 픽스처에는 closedAt 이 비어 있다.
      closedAt: bootcamp.status === 'CLOSED' ? (bootcamp.closedAt ?? registeredAt) : undefined,
      recruitmentStartAt: bootcamp.recruitmentStartAt,
      recruitmentEndAt: bootcamp.recruitmentEndAt,
    }),
    source,
    visibility: visibilityFor(bootcamp.id + 1000),
    reviewStatus: source === 'COMPANY' ? reviewStatusFor(bootcamp.id + 1000, registeredAt) : null,
  };
});

/** 사이드·스터디는 백엔드 도메인 자체가 없어 사용자 픽스처가 유일한 원본이다. */
export const ADMIN_SIDE_STUDY_FIXTURES: AdminSideStudy[] = SIDE_STUDY_FIXTURES.map((study) => ({
  ...study,
  registeredAt: registeredAtFor(study.id),
}));

const isRegisteredToday = (registeredAt: string): boolean =>
  new Date(registeredAt).getTime() >= startOfToday();

/**
 * 운영자가 통과시켜 줘야 지면에 오르는 콘텐츠. 대시보드의 "해야 할 일" 첫 칸이자 검수 대기
 * 큐가 세는 값이다. 채용공고와 부트캠프를 합한다 — 둘 다 비즈니스 회원이 올린다.
 */
export const countPendingReview = (): number =>
  ADMIN_JOB_FIXTURES.filter((job) => job.reviewStatus === 'PENDING').length +
  ADMIN_BOOTCAMP_FIXTURES.filter((bootcamp) => bootcamp.reviewStatus === 'PENDING').length;

/** 오늘 크롤러가 수집한 채용공고. */
export const countJobsCrawledToday = (): number =>
  ADMIN_JOB_FIXTURES.filter(
    (job) => job.source === 'CRAWLER' && isRegisteredToday(job.registeredAt),
  ).length;

/** 오늘 비즈니스 회원이 직접 올린 채용공고. */
export const countJobsSubmittedToday = (): number =>
  ADMIN_JOB_FIXTURES.filter(
    (job) => job.source === 'COMPANY' && isRegisteredToday(job.registeredAt),
  ).length;

/** 오늘 크롤러가 수집한 부트캠프. */
export const countBootcampsCrawledToday = (): number =>
  ADMIN_BOOTCAMP_FIXTURES.filter(
    (bootcamp) => bootcamp.source === 'CRAWLER' && isRegisteredToday(bootcamp.registeredAt),
  ).length;
