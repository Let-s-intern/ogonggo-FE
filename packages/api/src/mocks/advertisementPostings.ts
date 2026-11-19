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
 * - `JOB_LIST`: 공고 700 은 목록 첫 쪽에도 있는 공고다. 웹이 일반 목록에서 빼는지 본다.
 * - `JOB_PICK`: 홈 히어로 `오공고 PICK` 탭. 공고 7 은 PICK 목(`/api/v1/jobs/today`)에도 있는 공고다.
 *
 * 자리마다 하나(33·62)는 `adLabel` 이 false 라 `AD` 표시가 없어야 한다.
 *
 * 웹 목 서버(`apps/web/src/instrumentation.ts`)는 핸들러를 서버가 뜰 때 한 번 등록한다. 이 파일을 더한 뒤에는 웹 목
 * 서버를 다시 띄워야 서버 렌더가 이 응답을 받는다.
 */

export type AdPostingPosition = 'JOB_LIST' | 'JOB_PICK';

export interface AdPostingResponse {
  exposureId: number;
  position: AdPostingPosition;
  displayOrder: number;
  targetType: 'JOB' | 'BOOTCAMP';
  /** 카드에 `AD` 표시를 붙일지. 어드민이 광고 상품으로 등록하면 기본 켬이다(계약 7절). */
  adLabel: boolean;
  job: UserJobSummaryResponse | null;
  bootcamp: UserBootcampSummaryResponse | null;
}

const POSITIONS: readonly string[] = ['JOB_LIST', 'JOB_PICK'];

const SEED: {
  exposureId: number;
  position: AdPostingPosition;
  targetType: 'JOB' | 'BOOTCAMP';
  targetId: number;
  adLabel: boolean;
}[] = [
  { exposureId: 31, position: 'JOB_LIST', targetType: 'JOB', targetId: 700, adLabel: true },
  { exposureId: 32, position: 'JOB_LIST', targetType: 'JOB', targetId: 650, adLabel: true },
  { exposureId: 33, position: 'JOB_LIST', targetType: 'JOB', targetId: 600, adLabel: false },
  { exposureId: 61, position: 'JOB_PICK', targetType: 'JOB', targetId: 7, adLabel: true },
  { exposureId: 62, position: 'JOB_PICK', targetType: 'JOB', targetId: 690, adLabel: false },
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
  const base = { exposureId, position, displayOrder, targetType, adLabel };
  const job = JOB_FIXTURES.find((fixture) => fixture.id === targetId);
  return job ? { ...base, job: toJobSummary(job), bootcamp: null } : null;
}

const listAdPostingsHandler = http.get(
  '*/api/v1/advertisement-exposures/postings',
  ({ request }) => {
    const position = new URL(request.url).searchParams.get('position');
    if (position === null || !POSITIONS.includes(position)) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: 'position: 광고 공고 자리를 보내 주세요.' },
        { status: 400 },
      );
    }
    const data = SEED.filter((seed) => seed.position === position)
      .map((seed, index) => toResponse(seed, index + 1))
      .filter((item): item is AdPostingResponse => item !== null);
    return HttpResponse.json(
      { status: 200, message: '요청이 성공했습니다.', data },
      { status: 200 },
    );
  },
);

export const advertisementPostingHandlers: HttpHandler[] = [listAdPostingsHandler];
