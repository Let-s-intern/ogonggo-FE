import { http, HttpResponse, type HttpHandler } from 'msw';
import { BOOTCAMP_FIXTURES } from './fixtures/bootcamp';
import { registeredAtFor } from './fixtures/admin-content';
import { JOB_FIXTURES, type JobFixture } from './fixtures/job';
import type { UserBootcampDetailResponse } from '../generated/user/models/userBootcampDetailResponse';
import type { UserBootcampSummaryResponse } from '../generated/user/models/userBootcampSummaryResponse';
import type { UserJobSummaryResponse } from '../generated/user/models/userJobSummaryResponse';
import { UserJobSummaryResponseJobField } from '../generated/user/models/userJobSummaryResponseJobField';

/**
 * 현재 공개 광고 공고 조회 응답을 흉내 낸다. JOB_LIST는 직군 탭마다 별도 상품이라 jobField를 필수로 받는다.
 *
 * 웹 목 서버(`apps/web/src/instrumentation.ts`)는 핸들러를 서버가 뜰 때 한 번 등록한다. 이 파일을 더한 뒤에는 웹 목
 * 서버를 다시 띄워야 서버 렌더가 이 응답을 받는다.
 */

export type AdPostingPosition = 'JOB_LIST' | 'JOB_DETAIL_SIDE' | 'JOB_PICK' | 'CALENDAR_DAY' | 'MYPAGE_SCRAP';

export interface AdPostingResponse {
  exposureId: number;
  position: AdPostingPosition;
  jobField: UserJobSummaryResponse['jobField'] | null;
  displayOrder: number;
  targetType: 'JOB' | 'BOOTCAMP';
  /** 카드에 `AD` 표시를 붙일지. 어드민이 광고 상품으로 등록하면 기본 켬이다(계약 7절). */
  adLabel: boolean;
  job: UserJobSummaryResponse | null;
  bootcamp: UserBootcampSummaryResponse | null;
}

const POSITIONS: readonly string[] = ['JOB_LIST', 'JOB_DETAIL_SIDE', 'JOB_PICK', 'CALENDAR_DAY', 'MYPAGE_SCRAP'];

const SEED: {
  exposureId: number;
  position: AdPostingPosition;
  jobField: UserJobSummaryResponse['jobField'] | null;
  targetType: 'JOB' | 'BOOTCAMP';
  targetId: number;
  adLabel: boolean;
}[] = [
  { exposureId: 31, position: 'JOB_LIST', jobField: 'IT_DEVELOPMENT', targetType: 'JOB', targetId: 700, adLabel: true },
  { exposureId: 32, position: 'JOB_LIST', jobField: 'IT_DEVELOPMENT', targetType: 'JOB', targetId: 650, adLabel: true },
  { exposureId: 33, position: 'JOB_LIST', jobField: 'IT_DEVELOPMENT', targetType: 'JOB', targetId: 600, adLabel: false },
  { exposureId: 51, position: 'JOB_DETAIL_SIDE', jobField: null, targetType: 'JOB', targetId: 700, adLabel: true },
  { exposureId: 52, position: 'JOB_DETAIL_SIDE', jobField: null, targetType: 'JOB', targetId: 689, adLabel: true },
  { exposureId: 61, position: 'JOB_PICK', jobField: null, targetType: 'JOB', targetId: 7, adLabel: true },
  { exposureId: 62, position: 'JOB_PICK', jobField: null, targetType: 'JOB', targetId: 690, adLabel: false },
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

const toBootcampSummary = ({
  content: _content,
  eligibilityAndSelectionProcess: _eligibilityAndSelectionProcess,
  applicationMethod: _applicationMethod,
  applicationUrl: _applicationUrl,
  managerEmail: _managerEmail,
  inquiryUrl: _inquiryUrl,
  publicationStartAt: _publicationStartAt,
  publicationEndAt: _publicationEndAt,
  sourceUrl: _sourceUrl,
  partners: _partners,
  curriculums: _curriculums,
  ...summary
}: UserBootcampDetailResponse): UserBootcampSummaryResponse => summary;

function toResponse(seed: (typeof SEED)[number], displayOrder: number): AdPostingResponse | null {
  const { exposureId, position, jobField, targetType, targetId, adLabel } = seed;
  const base = { exposureId, position, jobField, displayOrder, targetType, adLabel };
  if (targetType === 'JOB') {
    const job = JOB_FIXTURES.find((fixture) => fixture.id === targetId);
    return job
      ? {
          ...base,
          job: { ...toJobSummary(job), jobField: jobField ?? undefined },
          bootcamp: null,
        }
      : null;
  }
  const bootcamp = BOOTCAMP_FIXTURES.find((fixture) => fixture.id === targetId);
  return bootcamp ? { ...base, job: null, bootcamp: toBootcampSummary(bootcamp) } : null;
}

const listAdPostingsHandler = http.get(
  '*/api/v1/advertisement-exposures/postings',
  ({ request }) => {
    const params = new URL(request.url).searchParams;
    const position = params.get('position');
    const jobField = params.get('jobField');
    const validJobField =
      jobField !== null && Object.values(UserJobSummaryResponseJobField).some((value) => value === jobField);
    if (
      position === null ||
      !POSITIONS.includes(position) ||
      (position === 'JOB_LIST' && !validJobField) ||
      (position !== 'JOB_LIST' && jobField !== null)
    ) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: 'position 또는 jobField가 올바르지 않습니다.' },
        { status: 400 },
      );
    }
    const data = SEED.filter(
      (seed) => seed.position === position && (position !== 'JOB_LIST' || seed.jobField === jobField),
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
