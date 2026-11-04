import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminJobDetailResponse,
  AdminJobSummaryResponse,
  SuccessResponseUnit,
} from '../../generated/admin/models';
import type { UserJobAnalysisResponse } from '../../generated/user/models/userJobAnalysisResponse';
import { enumLabel } from '../../enums';
import { ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { notFound, ok } from './paging';

/**
 * 오늘 올라온 공고 검수(LC-3567)의 목. 백엔드에 아직 없는 계약을 이 파일 한 곳에 모았다.
 * PRD `.claude/tasks/todo/prd-admin-today-job-review.md` "백엔드 요청" 1~3 의 제안 모양이다.
 *
 * 1. 검수 완료 표시 `PUT /api/v1/admin/jobs/{jobId}/inspection`, 해제 `DELETE` 같은 경로. 둘 다 본문 없이 200.
 * 2. 어드민 상세의 `analysis`(사용자 `UserJobAnalysisResponse` 와 같은 모양)와 `analysisCurrent`.
 * 3. 목록 필터 `registeredFrom`·`registeredTo`(이상·미만)와 `inspected`. 목록·상세 응답의 `inspectedAt`.
 *
 * 백엔드가 배포되면 코드젠으로 생성 모델에 이 칸들이 생긴다. 그때 아래 타입을 생성 모델로 바꾸고, 이 파일의
 * 핸들러는 생성 모델의 이름으로 옮긴다. 화면(`apps/admin/src/entities/new-job`)은 이 파일의 타입만 가져다 쓴다.
 */

/** 백엔드 요청 2. 사용자 상세의 분석과 같은 모양이다. */
export type AdminJobAnalysis = UserJobAnalysisResponse;

/** 백엔드 요청 1·2 가 어드민 상세에 더하는 칸. */
export interface AdminJobInspectionFields {
  /** 검수 완료 시각. 미검수면 null. */
  inspectedAt?: string | null;
  /** 저장된 공고 분석. 분석이 없으면 null. */
  analysis?: AdminJobAnalysis | null;
  /** 분석이 지금 본문으로 만든 것인지. 본문이 바뀌어 다시 분석을 기다리면 false. */
  analysisCurrent?: boolean;
}

export type AdminJobDetailWithInspection = AdminJobDetailResponse & AdminJobInspectionFields;
export type AdminJobSummaryWithInspection = AdminJobSummaryResponse &
  Pick<AdminJobInspectionFields, 'inspectedAt'>;

/** 등록 시각의 KST 날짜(`YYYY-MM-DD`). 기준 수집일을 KST 로 정한다(PRD 결정 필요 2). */
const kstDate = (iso: string): string =>
  new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

// --- 검수 완료 ------------------------------------------------------------------------------

/**
 * 검수 완료 시각. 목은 메모리라 새로고침하면 사라지는데, 이 기능은 "새로고침해도 완료로 남는다" 를 확인해야
 * 해서 브라우저면 `localStorage` 에도 적는다. 쓸 수 없는 환경(Node 테스트, 사생활 보호 창)에서는 메모리만 쓴다.
 */
const STORAGE_KEY = 'ogonggo.mock.admin.jobInspections';

function loadInspections(): Map<number, string> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return new Map(raw ? (JSON.parse(raw) as [number, string][]) : []);
  } catch {
    return new Map();
  }
}

const inspections = loadInspections();

function saveInspections() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify([...inspections]));
  } catch {
    // 메모리에는 남는다.
  }
}

// --- 오늘 묶음 픽스처 ------------------------------------------------------------------------

const BODY_LABELS: [keyof AdminJobDetailResponse, string][] = [
  ['companyAndTeamIntroduction', '회사 소개'],
  ['responsibilities', '주요 업무'],
  ['qualifications', '자격 요건'],
  ['preferredQualifications', '우대 사항'],
  ['compensation', '급여'],
  ['benefits', '복지'],
  ['hiringProcess', '채용 절차'],
];

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const linesOf = (text: string | undefined): string[] =>
  (text ?? '')
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[-•·*\s]+/, '').trim())
    .filter((line) => line.length > 0);

/** 본문 칸으로 원문 HTML 을 지어낸다. 크롤러가 원문을 저장한 모양(제목과 목록)을 흉내 낸다. */
function sourceHtmlOf(job: AdminJobDetailResponse): string {
  const sections = BODY_LABELS.flatMap(([field, label]) => {
    const lines = linesOf(job[field] as string | undefined);
    return lines.length === 0
      ? []
      : [
          `<h3>${label}</h3><ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`,
        ];
  });
  return [
    `<h2>${escapeHtml(job.title)}</h2>`,
    `<p>${escapeHtml(job.companyName)}</p>`,
    ...sections,
  ].join('');
}

/** 원문 앞뒤에 섞인 쓰레기 글. 앞은 메뉴와 쿠키 안내, 뒤는 다른 공고 목록과 바닥글이다. */
const GARBAGE_TOP = [
  '<p>홈 | 채용정보 | 기업정보 | 커뮤니티 | 로그인 | 회원가입</p>',
  '<p>이 사이트는 서비스 개선을 위해 쿠키를 사용합니다. 계속 이용하시면 쿠키 사용에 동의하는 것으로 간주합니다. [동의] [거부]</p>',
].join('');
const GARBAGE_BOTTOM = [
  '<h3>이 기업의 다른 공고</h3><ul><li>[경력] 물류센터 야간 관리자 (D-3)</li><li>[신입] 매장 판매직 상시 채용</li><li>[인턴] 회계팀 사무보조</li></ul>',
  '<p>Copyright © 2026 Recruit Portal. All rights reserved. 사업자등록번호 000-00-00000</p>',
].join('');

/** 본문 칸으로 공고 분석을 지어낸다. 사용자 상세의 분석과 같은 모양이다. */
function analysisOf(job: AdminJobDetailResponse): AdminJobAnalysis {
  const required = linesOf(job.qualifications).slice(0, 8);
  const preferred = linesOf(job.preferredQualifications).slice(0, 8);
  const process = linesOf(job.hiringProcess)[0];
  return {
    tasks: linesOf(job.responsibilities)
      .slice(0, 3)
      .map((text) => ({ tag: '업무', text })),
    required,
    preferred,
    employment: {
      type: { value: enumLabel('JobEmploymentType', job.employmentType) },
      conversion: { note: '공고에 정규직 전환 언급이 없습니다' },
      salary: job.compensation ? { value: linesOf(job.compensation)[0] } : { note: '회사 내규' },
      affiliation: { value: job.companyName },
    },
    submission: {
      documents: { value: '이력서' },
      essay: {},
      process: process ? { value: process } : {},
      deadline: job.recruitmentEndAt
        ? { value: job.recruitmentEndAt.slice(0, 10) }
        : { value: '상시 채용' },
    },
    competencies: required.slice(0, 2).map((quote, index) => ({
      name: index === 0 ? '직무 이해' : '협업',
      quote,
      description: '공고가 요구하는 역량입니다.',
      experiences: ['관련 프로젝트 경험', '인턴·아르바이트 경험'],
    })),
  };
}

/** 분석. 없으면 null(분석 없음). 값이 있는 동안 `stale` 에 든 공고는 다시 분석을 기다린다. */
const analyses = new Map<number, AdminJobAnalysis | null>();
const staleAnalyses = new Set<number>();

/**
 * 크롤러 공고 중 가장 늦은 등록 시각의 KST 날짜. 화면의 기준 수집일과 같은 규칙이다(PRD 결정 필요 2).
 * 고용24는 기준에 넣지 않는다. 매일 04:00 에 몇 건만 들어와 전날 크롤러 묶음을 밀어낸다.
 */
const latestCrawlerDate = (): string | null => {
  const latest = ADMIN_JOB_FIXTURES.filter((job) => job.source === 'CRAWLER')
    .map((job) => job.registeredAt)
    .sort()
    .at(-1);
  return latest ? kstDate(latest) : null;
};

/**
 * 기준 수집일 공고에 원문과 분석을 붙이고, 검수에서 잡아야 할 경우를 한 건씩 심는다.
 *
 * 나머지 공고는 손대지 않는다. 사용자 픽스처의 원문이 있는 공고(1번)는 그 원문을 그대로 둔다.
 */
function seedBatch() {
  const batchDate = latestCrawlerDate();
  if (!batchDate) {
    return;
  }
  const batch = ADMIN_JOB_FIXTURES.filter(
    (job) => job.source === 'CRAWLER' && kstDate(job.registeredAt) === batchDate,
  ).sort((a, b) => a.id - b.id);

  batch.forEach((job, index) => {
    job.sourceHtml ??= sourceHtmlOf(job);
    analyses.set(job.id, analysisOf(job));
    switch (index) {
      case 0:
        // 원문에 메뉴·쿠키 안내·다른 공고 목록이 섞였다.
        job.sourceHtml = `${GARBAGE_TOP}${job.sourceHtml}${GARBAGE_BOTTOM}`;
        break;
      case 1:
        // 썸네일이 없다.
        job.coverImageUrl = undefined;
        job.logoUrl = undefined;
        break;
      case 2:
        // 직군·직무를 뽑지 못했다.
        job.jobField = undefined;
        job.jobRole = undefined;
        break;
      case 3:
        // 분석이 없다.
        analyses.set(job.id, null);
        break;
      case 4:
        // 본문이 바뀌어 다시 분석을 기다린다.
        staleAnalyses.add(job.id);
        break;
      case 5:
        // 원문을 저장하지 못했다.
        job.sourceHtml = undefined;
        break;
      case 6: {
        // 분석에 원문에 없는 조건이 들어갔다.
        const analysis = analyses.get(job.id);
        analysis?.required.unshift('운전면허 1종 보통 소지자');
        break;
      }
      case 7:
      case 8:
        // 목 픽스처에는 고용24 공고가 없어 기준일 공고 두 건을 고용24로 바꾼다. 기준일은 크롤러로만 정한다.
        job.source = 'WORK24';
        break;
      default:
    }
  });
}

seedBatch();

/** 내용 수정으로 본문이 바뀌면 분석이 낡는다. 백엔드는 본문 해시로 같은 일을 한다. */
export function markAnalysisStale(jobId: number) {
  if (analyses.get(jobId)) {
    staleAnalyses.add(jobId);
  }
}

/** 어드민 상세 응답. 생성 모델에 검수 칸을 얹는다. */
export function withInspection(job: AdminJobDetailResponse): AdminJobDetailWithInspection {
  const analysis = analyses.get(job.id) ?? null;
  return {
    ...job,
    inspectedAt: inspections.get(job.id) ?? null,
    analysis,
    analysisCurrent: analysis ? !staleAnalyses.has(job.id) : false,
  };
}

/** 목록 응답 항목에 `inspectedAt` 을 얹는다. */
export function withInspectedAt<T extends { id: number }>(
  summary: T,
): T & { inspectedAt: string | null } {
  return { ...summary, inspectedAt: inspections.get(summary.id) ?? null };
}

/**
 * 목록 필터(백엔드 요청 3). 보내지 않으면 지금과 같다.
 *
 * `registeredFrom` 이상, `registeredTo` 미만. 값은 오프셋이 붙은 date-time 이다(`2026-11-04T00:00:00+09:00`).
 * 읽을 수 없는 값은 백엔드처럼 400 을 주는 대신 무시한다 — 화면은 늘 만든 값을 보낸다.
 */
export function matchesInspectionFilters(job: AdminJobDetailResponse, url: URL): boolean {
  const time = new Date(job.registeredAt).getTime();
  const from = Date.parse(url.searchParams.get('registeredFrom') ?? '');
  const to = Date.parse(url.searchParams.get('registeredTo') ?? '');
  if (!Number.isNaN(from) && time < from) {
    return false;
  }
  if (!Number.isNaN(to) && time >= to) {
    return false;
  }
  const inspected = url.searchParams.get('inspected');
  if (inspected === 'true' || inspected === 'false') {
    return inspections.has(job.id) === (inspected === 'true');
  }
  return true;
}

const findJob = (jobId: unknown) =>
  ADMIN_JOB_FIXTURES.find((fixture) => fixture.id === Number(jobId));

/** 표시. 이미 표시돼 있으면 처음 시각을 지킨다. 노출 상태는 바꾸지 않는다. */
const markInspectedHandler = http.put('*/api/v1/admin/jobs/:jobId/inspection', ({ params }) => {
  const job = findJob(params.jobId);
  if (!job) {
    return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
  }
  if (!inspections.has(job.id)) {
    inspections.set(job.id, new Date().toISOString());
    saveInspections();
  }
  const body: SuccessResponseUnit = ok({});
  return HttpResponse.json(body, { status: 200 });
});

/** 해제. 표시가 없어도 200 이다. */
const unmarkInspectedHandler = http.delete(
  '*/api/v1/admin/jobs/:jobId/inspection',
  ({ params }) => {
    const job = findJob(params.jobId);
    if (!job) {
      return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
    }
    inspections.delete(job.id);
    saveInspections();
    const body: SuccessResponseUnit = ok({});
    return HttpResponse.json(body, { status: 200 });
  },
);

export const inspectionHandlers: HttpHandler[] = [markInspectedHandler, unmarkInspectedHandler];
