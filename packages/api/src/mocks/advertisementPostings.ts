import { http, HttpResponse, type HttpHandler } from 'msw';
import { registeredAtFor } from './fixtures/admin-content';
import { JOB_FIXTURES, type JobFixture } from './fixtures/job';
import type { UserBootcampSummaryResponse } from '../generated/user/models/userBootcampSummaryResponse';
import type { UserJobSummaryResponse } from '../generated/user/models/userJobSummaryResponse';

/**
 * 광고 공고 공개 조회(`GET /api/v1/advertisement-exposures/postings?position=`, BE Push 5). 모양은
 * `.claude/tasks/memos/광고-리포트-API-계약-2026-11-19.md` 2절이다. 코드젠 전이라 응답 타입은 아래에 손으로 적는다.
 *
 * 대상은 기존 목 공고이고 모두 채용공고다(계약 8절, 부트캠프 자리는 판매 상품이 없어 뺐다).
 * - `JOB_LIST`: 리스트 상단 고정. 웹 직무 칩 다섯 직군마다 하나씩 둔다. `jobField` 가 없으면 400 이다(계약 8절).
 *   세일즈의 공고 683 은 그 탭 첫 쪽에도 있는 공고라 웹이 일반 목록에서 빼는지 본다. IT·개발에는 둘을 둬 웹이 첫 건만
 *   쓰는지 본다. 대상 공고는 목 공고 목록(`handlers.ts`)에서 그 직군으로 걸러지는 공고다.
 * - `CALENDAR_DAY`: 공고 달력 날짜별 목록 맨 앞. 노출 기간(`startAt`·`endAt`)을 함께 준다 — 계약에 없는 칸이라 백엔드에
 *   요청했다. 71 은 11월 16일~30일, 72 는 11월 19일~21일이라 그 밖의 날을 고르면 빠져야 한다.
 * - `JOB_DETAIL_SIDE`: 공고 상세 옆 추천. 개수 제한 없이 쌓는다. 공고 700 을 넣어 `/jobs/700` 에서 자기 공고가 빠지는지 본다.
 * - `MYPAGE_SCRAP`: 마이페이지 지원 관리 보드(칸반)의 채용공고 스크랩 칸 맨 앞. 브라우저 목 워커가 받는다.
 * - `JOB_PICK`: 홈 히어로 `오공고 PICK` 탭. 운영자 PICK 처럼 추천 문구 두 칸이 있다(계약 9절). 공고 7 은 PICK 목(`/api/v1/jobs/today`)에도 있는 공고다.
 *
 * 서버처럼 지금이 노출 기간 밖인 것은 주지 않는다. 자리마다 하나(32·53·72·82·62)는 `adLabel` 이 false 라 `AD` 표시가 없어야 한다.
 *
 * 웹 목 서버(`apps/web/src/instrumentation.ts`)는 핸들러를 서버가 뜰 때 한 번 등록한다. 이 파일을 더한 뒤에는 웹 목
 * 서버를 다시 띄워야 서버 렌더가 이 응답을 받는다.
 */

export type AdPostingPosition =
  | 'JOB_LIST'
  | 'JOB_PICK'
  | 'JOB_DETAIL_SIDE'
  | 'CALENDAR_DAY'
  | 'MYPAGE_SCRAP';

export interface AdPostingResponse {
  exposureId: number;
  position: AdPostingPosition;
  displayOrder: number;
  targetType: 'JOB' | 'BOOTCAMP';
  /** 카드에 `AD` 표시를 붙일지. 어드민이 광고 상품으로 등록하면 기본 켬이다(계약 7절). */
  adLabel: boolean;
  /** `JOB_LIST` 노출의 직무(계약 8절). 다른 자리는 null 이다. */
  jobField: string | null;
  /** 노출 기간(KST, 오프셋 없음). 계약에 없는 칸이고 웹 공고 달력이 날짜를 가른다. */
  startAt: string | null;
  endAt: string | null;
  /** 오공고 PICK 노출의 추천 문구(계약 9절). 다른 자리는 null 이다. */
  recommendationTitle: string | null;
  recommendationDescription: string | null;
  job: UserJobSummaryResponse | null;
  bootcamp: UserBootcampSummaryResponse | null;
}

const POSITIONS: readonly string[] = [
  'JOB_LIST',
  'JOB_PICK',
  'JOB_DETAIL_SIDE',
  'CALENDAR_DAY',
  'MYPAGE_SCRAP',
];

const SEED: {
  exposureId: number;
  position: AdPostingPosition;
  targetType: 'JOB' | 'BOOTCAMP';
  targetId: number;
  adLabel: boolean;
  jobField?: string;
  startAt?: string;
  endAt?: string;
  recommendationTitle?: string;
  recommendationDescription?: string;
}[] = [
  {
    exposureId: 31,
    position: 'JOB_LIST',
    jobField: 'MARKETING_ADVERTISING',
    targetType: 'JOB',
    targetId: 588,
    adLabel: true,
  },
  {
    exposureId: 32,
    position: 'JOB_LIST',
    jobField: 'HR_GENERAL_AFFAIRS',
    targetType: 'JOB',
    targetId: 525,
    adLabel: false,
  },
  {
    exposureId: 33,
    position: 'JOB_LIST',
    jobField: 'PLANNING_STRATEGY',
    targetType: 'JOB',
    targetId: 653,
    adLabel: true,
  },
  {
    exposureId: 34,
    position: 'JOB_LIST',
    jobField: 'SALES',
    targetType: 'JOB',
    targetId: 683,
    adLabel: true,
  },
  {
    exposureId: 35,
    position: 'JOB_LIST',
    jobField: 'IT_DEVELOPMENT',
    targetType: 'JOB',
    targetId: 598,
    adLabel: true,
  },
  {
    exposureId: 36,
    position: 'JOB_LIST',
    jobField: 'IT_DEVELOPMENT',
    targetType: 'JOB',
    targetId: 592,
    adLabel: true,
  },
  {
    exposureId: 71,
    position: 'CALENDAR_DAY',
    targetType: 'JOB',
    targetId: 695,
    adLabel: true,
    startAt: '2026-11-16T00:00:00',
    endAt: '2026-12-01T00:00:00',
  },
  {
    exposureId: 72,
    position: 'CALENDAR_DAY',
    targetType: 'JOB',
    targetId: 674,
    adLabel: false,
    startAt: '2026-11-19T00:00:00',
    endAt: '2026-11-22T00:00:00',
  },
  { exposureId: 51, position: 'JOB_DETAIL_SIDE', targetType: 'JOB', targetId: 700, adLabel: true },
  { exposureId: 52, position: 'JOB_DETAIL_SIDE', targetType: 'JOB', targetId: 689, adLabel: true },
  { exposureId: 53, position: 'JOB_DETAIL_SIDE', targetType: 'JOB', targetId: 600, adLabel: false },
  { exposureId: 81, position: 'MYPAGE_SCRAP', targetType: 'JOB', targetId: 698, adLabel: true },
  { exposureId: 82, position: 'MYPAGE_SCRAP', targetType: 'JOB', targetId: 693, adLabel: false },
  {
    exposureId: 61,
    position: 'JOB_PICK',
    targetType: 'JOB',
    targetId: 7,
    adLabel: true,
    recommendationTitle: '바이오 QC 첫 커리어로 추천',
    recommendationDescription:
      '신입도 지원할 수 있는 품질관리 계약직이에요.\n샘플링 업무부터 차근차근 배울 수 있어요.',
  },
  {
    exposureId: 62,
    position: 'JOB_PICK',
    targetType: 'JOB',
    targetId: 690,
    adLabel: false,
    recommendationTitle: 'AI 엔지니어를 꿈꾼다면',
    recommendationDescription: '자산관리 서비스에 AI 를 붙이는 팀이에요.',
  },
];

/** `handlers.ts` 의 공고 요약과 같은 모양이다. 본문 칸을 빼고 등록 시각을 오프셋 없는 KST 로 적는다. */
const toJobSummary = ({
  companyAndTeamIntroduction: _companyAndTeamIntroduction,
  responsibilities: _responsibilities,
  qualifications: _qualifications,
  preferredQualifications: _preferredQualifications,
  compensation: _compensation,
  benefits: _benefits,
  hiringProcess: _hiringProcess,
  sourceUrl: _sourceUrl,
  ...summary
}: JobFixture): UserJobSummaryResponse => ({
  ...summary,
  registeredAt: new Date(Date.parse(registeredAtFor(summary.id)) + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19),
});

function toResponse(seed: (typeof SEED)[number], displayOrder: number): AdPostingResponse | null {
  const { exposureId, position, targetType, targetId, adLabel } = seed;
  const base = {
    exposureId,
    position,
    displayOrder,
    targetType,
    adLabel,
    jobField: seed.jobField ?? null,
    startAt: seed.startAt ?? null,
    endAt: seed.endAt ?? null,
    recommendationTitle: seed.recommendationTitle ?? null,
    recommendationDescription: seed.recommendationDescription ?? null,
  };
  const job = JOB_FIXTURES.find((fixture) => fixture.id === targetId);
  return job ? { ...base, job: toJobSummary(job), bootcamp: null } : null;
}

const listAdPostingsHandler = http.get(
  '*/api/v1/advertisement-exposures/postings',
  ({ request }) => {
    const params = new URL(request.url).searchParams;
    const position = params.get('position');
    const jobField = params.get('jobField');
    if (position === null || !POSITIONS.includes(position)) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: 'position: 광고 공고 자리를 보내 주세요.' },
        { status: 400 },
      );
    }
    if (position === 'JOB_LIST' && !jobField) {
      return HttpResponse.json(
        {
          status: 400,
          code: 'BAD_REQUEST',
          message: 'jobField: 리스트 상단 고정은 직무를 보내 주세요.',
        },
        { status: 400 },
      );
    }
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
    const data = SEED.filter(
      (seed) =>
        seed.position === position &&
        (position !== 'JOB_LIST' || seed.jobField === jobField) &&
        (!seed.startAt || seed.startAt <= now) &&
        (!seed.endAt || now < seed.endAt),
    )
      .map((seed, index) => toResponse(seed, index + 1))
      .filter((item): item is AdPostingResponse => item !== null);
    return HttpResponse.json(
      { status: 200, message: '요청이 성공했습니다.', data },
      { status: 200 },
    );
  },
);

export const advertisementPostingHandlers: HttpHandler[] = [listAdPostingsHandler];
