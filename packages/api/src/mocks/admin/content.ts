import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  ADMIN_BOOTCAMP_FIXTURES,
  ADMIN_JOB_FIXTURES,
  ADMIN_SIDE_STUDY_FIXTURES,
  type AdminBootcampDetail,
  type AdminBootcampSummary,
  type AdminJobDetail,
  type AdminJobSummary,
  type AdminSideStudy,
} from '../fixtures/admin-content';
import { matches, notFound, ok, paginate, readPaging, type PageResponse } from './paging';

/**
 * 콘텐츠 목록·상세 핸들러.
 *
 * 세 화면이 칸 구성은 같지만 필터가 다르다. 채용공고에만 등록 경로와 검수 상태가 있고,
 * 부트캠프는 `BootcampStatus`, 사이드·스터디는 종류(`kind`)로 거른다.
 *
 * 정렬은 등록일 역순이 기본이고 조회 수 정렬을 함께 받는다. 목록 화면이 실제로 정렬을 바꾸는지
 * 확인하려면 목이 파라미터를 반영해야 한다 — 받아 두고 무시하면 계약이 검증되지 않는다.
 */

type ContentSort = 'REGISTERED_AT' | 'VIEW_COUNT';

const readSort = (url: URL): ContentSort =>
  url.searchParams.get('sort') === 'VIEW_COUNT' ? 'VIEW_COUNT' : 'REGISTERED_AT';

/** 등록일 역순이 기본. 조회 수 정렬은 동률이면 등록일 역순으로 되돌린다. */
function sortContent<T extends { registeredAt: string; viewCount: number }>(
  rows: T[],
  sort: ContentSort,
): T[] {
  return [...rows].sort((a, b) => {
    const byRegisteredAt = new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    return sort === 'VIEW_COUNT' ? b.viewCount - a.viewCount || byRegisteredAt : byRegisteredAt;
  });
}

/** 목록에 나가는 칸만 남긴다. 본문을 목록 응답에 실으면 페이지 하나가 수백 KB 가 된다. */
const toJobSummary = ({
  companyAndTeamIntroduction: _companyAndTeamIntroduction,
  responsibilities: _responsibilities,
  qualifications: _qualifications,
  preferredQualifications: _preferredQualifications,
  compensation: _compensation,
  benefits: _benefits,
  hiringProcess: _hiringProcess,
  ...summary
}: AdminJobDetail): AdminJobSummary => summary;

const toBootcampSummary = ({
  content: _content,
  eligibilityAndSelectionProcess: _eligibilityAndSelectionProcess,
  partners: _partners,
  curriculums: _curriculums,
  ...summary
}: AdminBootcampDetail): AdminBootcampSummary => summary;

const listJobsHandler = http.get('*/api/v1/admin/jobs', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const publicationStatus = url.searchParams.get('publicationStatus') ?? '';
  const source = url.searchParams.get('source') ?? '';
  const reviewStatus = url.searchParams.get('reviewStatus') ?? '';
  const { page, size } = readPaging(url);

  const filtered = ADMIN_JOB_FIXTURES.filter((job) => {
    if (keyword && !matches(`${job.title} ${job.companyName}`, keyword)) {
      return false;
    }
    if (publicationStatus && job.publicationStatus !== publicationStatus) {
      return false;
    }
    if (source && job.source !== source) {
      return false;
    }
    if (reviewStatus && job.reviewStatus !== reviewStatus) {
      return false;
    }
    return true;
  });

  const sorted = sortContent(filtered, readSort(url));
  const paged = paginate(sorted, page, size);
  const body: PageResponse<AdminJobSummary> = {
    items: paged.items.map(toJobSummary),
    pageInfo: paged.pageInfo,
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

const getJobHandler = http.get('*/api/v1/admin/jobs/:jobId', ({ params }) => {
  const jobId = Number(params.jobId);
  const job = ADMIN_JOB_FIXTURES.find((fixture) => fixture.id === jobId);
  if (!job) {
    return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok(job), { status: 200 });
});

const listBootcampsHandler = http.get('*/api/v1/admin/bootcamps', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const { page, size } = readPaging(url);

  const filtered = ADMIN_BOOTCAMP_FIXTURES.filter((bootcamp) => {
    if (keyword && !matches(`${bootcamp.title} ${bootcamp.companyName}`, keyword)) {
      return false;
    }
    if (status && bootcamp.status !== status) {
      return false;
    }
    return true;
  });

  const sorted = sortContent(filtered, readSort(url));
  const paged = paginate(sorted, page, size);
  const body: PageResponse<AdminBootcampSummary> = {
    items: paged.items.map(toBootcampSummary),
    pageInfo: paged.pageInfo,
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

const getBootcampHandler = http.get('*/api/v1/admin/bootcamps/:bootcampId', ({ params }) => {
  const bootcampId = Number(params.bootcampId);
  const bootcamp = ADMIN_BOOTCAMP_FIXTURES.find((fixture) => fixture.id === bootcampId);
  if (!bootcamp) {
    return HttpResponse.json(notFound('부트캠프를 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok(bootcamp), { status: 200 });
});

/**
 * 사이드·스터디는 백엔드 도메인 자체가 없다(`ogonggo-core` 의 `StudyPackage.kt` 는 주석
 * 하나뿐이다). 사용자 웹이 쓰는 픽스처에 등록일만 얹어 쓴다.
 */
const listSideStudiesHandler = http.get('*/api/v1/admin/side-studies', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const kind = url.searchParams.get('kind') ?? '';
  const { page, size } = readPaging(url);

  const filtered = ADMIN_SIDE_STUDY_FIXTURES.filter((study) => {
    if (keyword && !matches(`${study.title} ${study.authorNickname}`, keyword)) {
      return false;
    }
    if (kind && study.kind !== kind) {
      return false;
    }
    return true;
  });

  const sorted = sortContent(filtered, readSort(url));
  const paged = paginate(sorted, page, size);
  const body: PageResponse<AdminSideStudy> = {
    items: paged.items,
    pageInfo: paged.pageInfo,
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

const getSideStudyHandler = http.get('*/api/v1/admin/side-studies/:postId', ({ params }) => {
  const postId = Number(params.postId);
  const study = ADMIN_SIDE_STUDY_FIXTURES.find((fixture) => fixture.id === postId);
  if (!study) {
    return HttpResponse.json(notFound('사이드·스터디 글을 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok(study), { status: 200 });
});

export const contentHandlers: HttpHandler[] = [
  // 목록 경로가 상세 경로의 접두사라 목록을 먼저 둔다.
  listJobsHandler,
  getJobHandler,
  listBootcampsHandler,
  getBootcampHandler,
  listSideStudiesHandler,
  getSideStudyHandler,
];
