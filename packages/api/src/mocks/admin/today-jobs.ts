import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminJobDetailResponse,
  AdminTodayJobRequest,
  AdminTodayJobSummaryResponse,
  ReplaceAdminTodayJobsRequest,
  SuccessResponseListAdminTodayJobSummaryResponse,
} from '../../generated/admin/models';
import { ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { notFound, ok } from './paging';

/**
 * 오늘의 공고 핸들러(`GET`·`PUT /api/v1/admin/jobs/today`).
 *
 * 쓰기가 일어나는 곳이다. 고른 공고와 문구를 모듈 변수에 들고 있고, `PUT` 이 통째로 바꾼다 —
 * 스펙이 "전체 교체" 이고 한 건만 더하고 빼는 API 가 없다. 모듈 변수라 화면을 옮겨 다닐 때는
 * 남고, 브라우저에서 새로고침하면 처음 상태로 돌아온다.
 *
 * 응답은 읽을 때마다 픽스처의 현재 상태로 만든다. 목록 화면에서 노출을 바꾸거나 공고를 지우면
 * 여기에도 그대로 비친다. 스펙도 게시 상태와 무관하게 삭제되지 않은 공고를 준다고 한다.
 *
 * 거절은 스펙이 밝힌 것까지만 흉내 낸다 — 제목 30자·설명 50자 초과는 `400`, 없는 `jobId` 는
 * `404`. 빈 문구, 같은 공고 중복, 개수 상한은 서버 동작이 확인되지 않아 받아 준다. 지어낸 규칙으로
 * 화면을 맞추면 실서버에서 처음 틀어진다.
 *
 * `:jobId` 핸들러(`content.ts`)보다 앞에 등록돼야 한다. 뒤에 두면 `today` 가 id 로 잡혀 404 가 난다.
 */

const TITLE_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 50;

/** 시작 상태의 예시 문구. 한도 안에서 쓴다. */
const SAMPLE_COPY = [
  {
    recommendationTitle: '첫 지원으로 보기 좋아요',
    recommendationDescription: '요건이 부담스럽지 않아 처음 지원하는 분께 먼저 권해요',
  },
  {
    recommendationTitle: '이번 주에 확인해 보세요',
    recommendationDescription: '마감 전에 한 번쯤 살펴볼 만한 공고예요',
  },
  {
    recommendationTitle: '요즘 많이 보는 공고예요',
    recommendationDescription: '관심이 빠르게 모이고 있어 오늘의 공고로 골랐어요',
  },
];

/** 노출 중인 공고 세 건에 예시 문구를 붙여 시작한다. */
const visibleJobs = ADMIN_JOB_FIXTURES.filter((job) => job.visibility === 'VISIBLE');
let picks: AdminTodayJobRequest[] = SAMPLE_COPY.flatMap((copy, index) => {
  const job = visibleJobs[index];
  return job ? [{ jobId: job.id, ...copy }] : [];
});

/** 목록에 나가는 칸만 남기고 추천 문구를 더한다. `content.ts` 의 목록 응답과 같은 칸이다. */
const toTodayJob = (
  {
    companyAndTeamIntroduction: _companyAndTeamIntroduction,
    responsibilities: _responsibilities,
    qualifications: _qualifications,
    preferredQualifications: _preferredQualifications,
    compensation: _compensation,
    benefits: _benefits,
    hiringProcess: _hiringProcess,
    sourceUrl: _sourceUrl,
    ...summary
  }: AdminJobDetailResponse,
  pick: AdminTodayJobRequest,
): AdminTodayJobSummaryResponse => ({
  ...summary,
  recommendationTitle: pick.recommendationTitle,
  recommendationDescription: pick.recommendationDescription,
});

/** 고른 순서대로. 지워져서 픽스처에 없는 공고는 건너뛴다. */
function currentList(): AdminTodayJobSummaryResponse[] {
  return picks.flatMap((pick) => {
    const job = ADMIN_JOB_FIXTURES.find((fixture) => fixture.id === pick.jobId);
    return job ? [toTodayJob(job, pick)] : [];
  });
}

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

const listTodayJobsHandler = http.get('*/api/v1/admin/jobs/today', () => {
  const body: SuccessResponseListAdminTodayJobSummaryResponse = ok(currentList());
  return HttpResponse.json(body, { status: 200 });
});

/**
 * 오늘의 공고를 본문의 목록으로 통째로 바꾼다. 한 건이라도 거절되면 아무것도 바꾸지 않는다.
 *
 * 문구 길이(`400`)를 먼저 보고 그다음에 `jobId`(`404`)를 본다. 요청 모양이 틀린 것을 존재 여부보다
 * 먼저 거르는 쪽이 보통의 서버 검증 순서다.
 */
const replaceTodayJobsHandler = http.put('*/api/v1/admin/jobs/today', async ({ request }) => {
  const { jobs } = (await request.json()) as ReplaceAdminTodayJobsRequest;

  for (const [index, job] of jobs.entries()) {
    if (job.recommendationTitle.length > TITLE_MAX_LENGTH) {
      return badRequest(
        `[jobs[${index}].recommendationTitle] 추천 제목은 ${TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`,
      );
    }
    if (job.recommendationDescription.length > DESCRIPTION_MAX_LENGTH) {
      return badRequest(
        `[jobs[${index}].recommendationDescription] 추천 설명은 ${DESCRIPTION_MAX_LENGTH}자 이하로 입력해 주세요.`,
      );
    }
  }

  const missing = [
    ...new Set(
      jobs
        .map((job) => job.jobId)
        .filter((jobId) => !ADMIN_JOB_FIXTURES.some((fixture) => fixture.id === jobId)),
    ),
  ];
  if (missing.length > 0) {
    return HttpResponse.json(notFound(`채용공고를 찾을 수 없습니다: ${missing.join(', ')}`), {
      status: 404,
    });
  }

  // 요청이 실어 보낸 다른 키는 버린다. 본문 순서가 곧 노출 순서다.
  picks = jobs.map(({ jobId, recommendationTitle, recommendationDescription }) => ({
    jobId,
    recommendationTitle,
    recommendationDescription,
  }));

  const body: SuccessResponseListAdminTodayJobSummaryResponse = ok(currentList());
  return HttpResponse.json(body, { status: 200 });
});

export const todayJobHandlers: HttpHandler[] = [listTodayJobsHandler, replaceTodayJobsHandler];
