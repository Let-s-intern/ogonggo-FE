import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminJobDetailResponse,
  AdminJobSummaryResponse,
  Analysis,
} from '../../generated/admin/models';
import { enumLabel } from '../../enums';
import { ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { notFound, ok } from './paging';

/**
 * 오늘 올라온 공고 검수(LC-3567)의 목. 구현된(배포 전) 백엔드 계약을 이 파일 한 곳에 모았다
 * (`ogonggo-BE` 브랜치 `LC-3567-어드민-오늘-올라온-공고-검수-화면`). 시각은 오프셋 없는 KST date-time 이다.
 *
 * 1. 검수 완료 표시 `PUT /api/v1/admin/jobs/{jobId}/inspection`(`replaceJobInspection`), 해제 `DELETE` 같은 경로
 *    (`deleteJobInspection`). 둘 다 본문 없이 200 `data: null`, 없는 공고는 404. 다시 PUT 해도 처음 시각이다.
 * 2. 목록 필터 `registeredFrom`·`registeredTo`(`YYYY-MM-DD`, 두 날짜 포함)와 `inspected`. 목록·상세·`/today` 의
 *    `inspectedAt`.
 * 3. 상세의 `analysis`(`Analysis`)·`analysisCurrent`·`analysisEditedAt`.
 * 4. 운영자 분석 수정 `PUT /api/v1/admin/jobs/{jobId}/analysis`(`replaceJobAnalysis`). 본문 `Analysis`, 응답은 상세.
 * 5. `PATCH /api/v1/admin/jobs/{jobId}` 의 `sourceHtml`. 걸러서 저장하고 비울 수 없다(400 `[sourceHtml]`).
 *
 * 백엔드가 배포되면 코드젠으로 생성 모델에 이 칸들이 생긴다. 그때 아래 타입을 생성 모델로 바꾸고, 이 파일의
 * 핸들러는 생성 모델의 이름으로 옮긴다. 화면(`apps/admin/src/entities/new-job`)은 이 파일의 타입만 가져다 쓴다.
 *
 * `Analysis` 는 배포된 어드민 스펙에 이미 있는 생성 모델이다(AI 서버 저장 본문과 같은 스키마라 코드젠 뒤에도 같은
 * 이름이다). 백엔드는 빈 `Fact` 칸을 null 로 주는데 생성 모델은 선택 칸(`value?: string`)이라, 화면은 null 과 빈
 * 칸을 같이 다룬다.
 */
export type { Analysis };

/** 백엔드가 어드민 상세에 더하는 칸. */
export interface AdminJobInspectionFields {
  /** 검수 완료 시각. 미검수면 null. */
  inspectedAt?: string | null;
  /** 저장된 공고 분석. 분석이 없으면 null. */
  analysis?: Analysis | null;
  /** 분석이 지금 본문으로 만든 것인지. 본문이 바뀌어 다시 분석을 기다리거나 분석이 없으면 false. */
  analysisCurrent?: boolean;
  /** 운영자가 분석을 고친 시각. AI 가 바뀐 본문으로 다시 분석해 저장하면 null 로 돌아간다. */
  analysisEditedAt?: string | null;
}

/**
 * `PATCH /api/v1/admin/jobs/{jobId}` 본문의 원문 HTML. 배포된 `UpdateAdminJobRequest` 에는 아직 없다. 백엔드는
 * 크롤러 원문과 같은 거르기(`JobSourceHtmlSanitizer`)를 거쳐 저장하고, 공백이거나 거른 뒤 남는 것이 없으면 400
 * `[sourceHtml]` 이다. 원문만 고치면 분석은 낡지 않는다. 코드젠 뒤 생성 모델의 칸으로 바꾸고 이 타입을 지운다.
 */
export interface AdminJobSourceHtmlPatch {
  sourceHtml?: string;
}

export type AdminJobDetailWithInspection = AdminJobDetailResponse & AdminJobInspectionFields;
export type AdminJobSummaryWithInspection = AdminJobSummaryResponse &
  Pick<AdminJobInspectionFields, 'inspectedAt'>;

/** 등록 시각의 KST 날짜(`YYYY-MM-DD`). 검수 대상은 오늘(KST) 등록분이다. */
const kstDate = (iso: string): string =>
  new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** 지금의 오프셋 없는 KST date-time(`2026-11-04T13:05:09`). 백엔드 `LocalDateTime` 과 같은 모양이다. */
const kstNow = (): string => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

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

/**
 * 운영자가 고친 분석과 그 시각. 검수 완료처럼 "새로고침해도 남는다" 를 확인해야 해서 `localStorage` 에도 적는다.
 * 본문 고침은 메모리라 새로고침하면 처음 본문으로 돌아가고, 고친 분석은 그 본문 기준으로 남는다.
 */
const EDITS_KEY = 'ogonggo.mock.admin.jobAnalysisEdits';

interface AnalysisEdit {
  analysis: Analysis;
  editedAt: string;
}

function loadEdits(): Map<number, AnalysisEdit> {
  try {
    const raw = globalThis.localStorage?.getItem(EDITS_KEY);
    return new Map(raw ? (JSON.parse(raw) as [number, AnalysisEdit][]) : []);
  } catch {
    return new Map();
  }
}

const analysisEdits = loadEdits();

function saveEdits() {
  try {
    globalThis.localStorage?.setItem(EDITS_KEY, JSON.stringify([...analysisEdits]));
  } catch {
    // 메모리에는 남는다.
  }
}

// --- 오늘 등록분 픽스처 ------------------------------------------------------------------------

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
function analysisOf(job: AdminJobDetailResponse): Analysis {
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
const analyses = new Map<number, Analysis | null>();
const staleAnalyses = new Set<number>();

/**
 * 오늘(KST) 등록된 크롤러 공고에 원문과 분석을 붙이고, 검수에서 잡아야 할 경우를 한 건씩 심는다. 화면과 같은
 * 날짜 규칙이다. 등록 시각은 픽스처가 지금을 기준으로 흩어 두므로(`registeredAtFor`) 언제 열어도 오늘 등록분이
 * 있다.
 *
 * 나머지 공고는 손대지 않는다. 사용자 픽스처의 원문이 있는 공고(1번)는 그 원문을 그대로 둔다.
 */
function seedBatch() {
  const today = kstDate(new Date().toISOString());
  const batch = ADMIN_JOB_FIXTURES.filter(
    (job) => job.source === 'CRAWLER' && kstDate(job.registeredAt) === today,
  ).sort((a, b) => a.id - b.id);

  batch.forEach((job, index) => {
    job.sourceHtml ??= sourceHtmlOf(job);
    job.coverImageUrl ??= `https://picsum.photos/seed/ogonggo-batch-${job.id}/960/600`;
    job.logoUrl ??= `https://picsum.photos/seed/ogonggo-batch-logo-${job.id}/120`;
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
        // 목 픽스처에는 고용24 공고가 없어 오늘 공고 두 건을 고용24로 바꾼다.
        job.source = 'WORK24';
        break;
      case 9:
        // 썸네일 자리에 회사 로고 주소가 들어갔다.
        job.coverImageUrl = job.logoUrl;
        break;
      default:
    }
  });
}

seedBatch();

// 고친 분석은 지금 본문 기준이다(백엔드는 지금 본문 해시로 저장한다).
analysisEdits.forEach(({ analysis }, jobId) => {
  analyses.set(jobId, analysis);
  staleAnalyses.delete(jobId);
});

/**
 * 내용 수정으로 본문이 바뀌면 분석이 낡는다. 백엔드는 본문 해시로 같은 일을 한다. 운영자 수정 시각은 남는다 —
 * 백엔드는 AI 가 새 본문으로 다시 분석해 저장할 때 지운다. 목에는 AI 가 없어 다시 분석은 오지 않는다.
 */
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
    analysisEditedAt: analysisEdits.get(job.id)?.editedAt ?? null,
  };
}

/** 목록 응답 항목에 `inspectedAt` 을 얹는다. */
export function withInspectedAt<T extends { id: number }>(
  summary: T,
): T & { inspectedAt: string | null } {
  return { ...summary, inspectedAt: inspections.get(summary.id) ?? null };
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 목록 필터의 날짜 검사. `YYYY-MM-DD` 가 아니면(date-time 포함) 400, 시작일이 끝일보다 늦으면 400
 * `[registeredFrom]`. 문제가 없으면 null.
 */
export function rejectInspectionFilters(url: URL) {
  const from = url.searchParams.get('registeredFrom');
  const to = url.searchParams.get('registeredTo');
  for (const [name, value] of [
    ['registeredFrom', from],
    ['registeredTo', to],
  ] as const) {
    if (value !== null && !DATE_ONLY.test(value)) {
      return badRequest(`[${name}] 날짜는 YYYY-MM-DD 로 보내 주세요.`);
    }
  }
  if (from && to && from > to) {
    return badRequest('[registeredFrom] 시작일이 종료일보다 늦습니다.');
  }
  return null;
}

/**
 * 목록 필터. 보내지 않으면 지금과 같다.
 *
 * `registeredFrom`·`registeredTo` 는 KST 날짜(`YYYY-MM-DD`)이고 두 날짜를 포함한다. 오늘분은 두 칸에 오늘 날짜다.
 * 형식 검사는 `rejectInspectionFilters` 가 먼저 한다.
 */
export function matchesInspectionFilters(job: AdminJobDetailResponse, url: URL): boolean {
  const date = kstDate(job.registeredAt);
  const from = url.searchParams.get('registeredFrom');
  const to = url.searchParams.get('registeredTo');
  if (from && date < from) {
    return false;
  }
  if (to && date > to) {
    return false;
  }
  const inspected = url.searchParams.get('inspected');
  if (inspected === 'true' || inspected === 'false') {
    return inspections.has(job.id) === (inspected === 'true');
  }
  return true;
}

/**
 * 원문 HTML 의 위험한 부분을 지운다. 백엔드 `JobSourceHtmlSanitizer` 의 흉내다 — 스크립트·스타일·틀 태그, `on*`
 * 속성, `javascript:` 주소. 목에서만 쓴다. 화면은 저장된 원문을 다시 거르지 않고 그린다(`SourcePane`).
 */
function sanitizeSourceHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1="#"');
}

/**
 * 공고 수정 본문의 `sourceHtml` 을 거른 값. 보내지 않으면 `{}`, 공백이거나 거른 뒤 남는 것이 없으면 400 응답이다.
 * 백엔드는 다른 칸을 저장하기 전에 거절하므로, 수정 목은 이것을 먼저 부르고 저장은 끝에 한다. 분석은 본문 칸으로
 * 만드므로 낡게 하지 않는다.
 */
export function readSourceHtmlPatch(body: AdminJobSourceHtmlPatch): {
  html?: string;
  error?: ReturnType<typeof badRequest>;
} {
  if (typeof body.sourceHtml !== 'string') {
    return {};
  }
  if (body.sourceHtml.trim() === '') {
    return { error: badRequest('[sourceHtml] 원문 HTML 은 비울 수 없습니다.') };
  }
  const html = sanitizeSourceHtml(body.sourceHtml).trim();
  if (html.replace(/<[^>]*>/g, '').trim() === '' && !/<img\b/i.test(html)) {
    return { error: badRequest('[sourceHtml] 안전한 태그만 남기면 보여 줄 내용이 없습니다.') };
  }
  return { html };
}

const TEXT_MAX = 1000;

/**
 * 운영자 분석 본문 검사. 백엔드 `AiJobAnalysisRequest.Analysis` 의 제약과 같다 — 할 일·역량 3개, 필수·우대 8개,
 * 경험 3개, 글 1000자, 할 일의 태그·글과 역량의 이름·문장·설명은 비울 수 없다. 걸리면 `[칸] 사유`.
 */
function analysisError(analysis: Analysis): string | null {
  const long = (text: string | null | undefined) => (text ?? '').length > TEXT_MAX;
  const blank = (text: string | null | undefined) => (text ?? '').trim() === '';
  if (analysis.tasks.length > 3) return '[tasks] 할 일은 3개까지입니다.';
  if (analysis.required.length > 8) return '[required] 필수 조건은 8개까지입니다.';
  if (analysis.preferred.length > 8) return '[preferred] 우대 조건은 8개까지입니다.';
  if (analysis.competencies.length > 3) return '[competencies] 역량은 3개까지입니다.';
  for (const [index, task] of analysis.tasks.entries()) {
    if ([task.tag, task.text].some((text) => blank(text) || long(text))) {
      return `[tasks[${index}]] 할 일의 태그와 내용을 1000자 안으로 입력해 주세요.`;
    }
  }
  for (const key of ['required', 'preferred'] as const) {
    if (analysis[key].some((item) => blank(item) || long(item))) {
      return `[${key}] 빈 조건이나 1000자를 넘는 조건이 있습니다.`;
    }
  }
  const facts: Fact[] = [
    ...Object.values(analysis.employment),
    ...Object.values(analysis.submission),
  ];
  if (facts.some((fact) => long(fact.value) || long(fact.note))) {
    return '[employment] 근무 조건·제출의 값과 보충은 1000자까지입니다.';
  }
  for (const [index, competency] of analysis.competencies.entries()) {
    if (
      [competency.name, competency.quote, competency.description].some((t) => blank(t) || long(t))
    ) {
      return `[competencies[${index}]] 역량의 이름·문장·설명을 1000자 안으로 입력해 주세요.`;
    }
    if (competency.experiences.length > 3) {
      return `[competencies[${index}].experiences] 경험은 3개까지입니다.`;
    }
  }
  return null;
}

/** 백엔드가 주는 `Fact`. 빈 칸은 null 이다. */
interface Fact {
  value?: string | null;
  note?: string | null;
}

/** 공백뿐인 `Fact` 칸은 null 로 저장한다(백엔드 `Fact.toFact`). */
const toFact = (fact: Fact): Fact => ({
  value: fact.value?.trim() ? fact.value : null,
  note: fact.note?.trim() ? fact.note : null,
});

const findJob = (jobId: unknown) =>
  ADMIN_JOB_FIXTURES.find((fixture) => fixture.id === Number(jobId));

/** 표시. 이미 표시돼 있으면 처음 시각을 지킨다. 노출 상태는 바꾸지 않는다. */
const markInspectedHandler = http.put('*/api/v1/admin/jobs/:jobId/inspection', ({ params }) => {
  const job = findJob(params.jobId);
  if (!job) {
    return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
  }
  if (!inspections.has(job.id)) {
    inspections.set(job.id, kstNow());
    saveInspections();
  }
  return HttpResponse.json(ok(null), { status: 200 });
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
    return HttpResponse.json(ok(null), { status: 200 });
  },
);

/**
 * 운영자 분석 수정. 통째로 바꾸고 지금 본문 기준으로 저장한다 — 바로 사용자에게 보이고, 본문이 바뀌기 전까지 AI 가
 * 덮어쓰지 않는다. 분석이 없던 공고에도 저장할 수 있다.
 */
const replaceAnalysisHandler = http.put(
  '*/api/v1/admin/jobs/:jobId/analysis',
  async ({ params, request }) => {
    const job = findJob(params.jobId);
    if (!job) {
      return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
    }
    const body = (await request.json()) as Analysis;
    const error = analysisError(body);
    if (error) {
      return badRequest(error);
    }
    const { employment: e, submission: s } = body;
    const analysis = {
      ...body,
      employment: {
        type: toFact(e.type),
        conversion: toFact(e.conversion),
        salary: toFact(e.salary),
        affiliation: toFact(e.affiliation),
      },
      submission: {
        documents: toFact(s.documents),
        essay: toFact(s.essay),
        process: toFact(s.process),
        deadline: toFact(s.deadline),
      },
    } as Analysis;
    analyses.set(job.id, analysis);
    staleAnalyses.delete(job.id);
    analysisEdits.set(job.id, { analysis, editedAt: kstNow() });
    saveEdits();
    return HttpResponse.json(ok(withInspection(job)), { status: 200 });
  },
);

export const inspectionHandlers: HttpHandler[] = [
  markInspectedHandler,
  unmarkInspectedHandler,
  replaceAnalysisHandler,
];
