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
import { clearRejection } from '../fixtures/admin-rejection';
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
  const visibility = url.searchParams.get('visibility') ?? '';
  const source = url.searchParams.get('source') ?? '';
  const reviewStatus = url.searchParams.get('reviewStatus') ?? '';
  const recruitmentStatus = url.searchParams.get('recruitmentStatus') ?? '';
  const { page, size } = readPaging(url);

  const filtered = ADMIN_JOB_FIXTURES.filter((job) => {
    if (keyword && !matches(`${job.title} ${job.companyName}`, keyword)) {
      return false;
    }
    if (visibility && job.visibility !== visibility) {
      return false;
    }
    if (source && job.source !== source) {
      return false;
    }
    if (reviewStatus && job.reviewStatus !== reviewStatus) {
      return false;
    }
    if (recruitmentStatus && job.recruitmentStatus !== recruitmentStatus) {
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

/**
 * 어드민이 고칠 수 있는 본문 칸.
 *
 * 크롤링 수집분이든 비즈니스 등록분이든 운영자가 고칠 수 있다. 크롤러가 원문 구조를 잘못 읽어
 * 오는 일이 있고, 그때 고칠 방법이 없으면 그 공고는 통째로 내리는 수밖에 없다.
 *
 * 목록에 없는 키는 무시한다. 요청이 아무 필드나 실어 보내 `id` 나 `viewCount` 를 덮어쓰는 일을
 * 막는다.
 */
export const JOB_CONTENT_FIELDS = [
  'companyAndTeamIntroduction',
  'responsibilities',
  'qualifications',
  'preferredQualifications',
  'compensation',
  'benefits',
  'hiringProcess',
] as const;

export const BOOTCAMP_CONTENT_FIELDS = ['content', 'eligibilityAndSelectionProcess'] as const;

export interface AdminContentPatchRequest {
  title?: string;
  /** 칸 이름 -> 새 내용. 빈 문자열은 그 칸을 비우는 뜻이다. */
  fields?: Record<string, string>;
}

/** 상세 화면에서 고칠 수 있는 운영 값. */
export interface AdminJobPatchRequest extends AdminContentPatchRequest {
  visibility?: AdminJobDetail['visibility'];
  source?: AdminJobDetail['source'];
  reviewStatus?: AdminJobDetail['reviewStatus'];
}

export interface AdminBootcampPatchRequest extends AdminContentPatchRequest {
  visibility?: AdminBootcampDetail['visibility'];
  source?: AdminBootcampDetail['source'];
  reviewStatus?: AdminBootcampDetail['reviewStatus'];
}

/** 제목과 본문 칸을 적용한다. 허용 목록에 없는 키는 버린다. */
function applyContentPatch(
  target: Record<string, unknown>,
  body: AdminContentPatchRequest,
  allowed: readonly string[],
): string | null {
  if (body.title !== undefined) {
    const title = body.title.trim();
    if (title.length === 0) {
      return '제목을 입력해 주세요.';
    }
    target.title = title;
  }
  Object.entries(body.fields ?? {}).forEach(([field, value]) => {
    if (allowed.includes(field)) {
      // 빈 문자열은 칸을 비우는 뜻이라 `undefined` 로 넣는다 — 화면이 빈 칸을 그리지 않는다.
      target[field] = value.trim() === '' ? undefined : value;
    }
  });
  return null;
}

/**
 * 채용공고의 운영 값을 고친다.
 *
 * 넘어온 칸만 바꾼다. 세 값을 늘 함께 보내게 하면 화면이 안 건드린 값까지 되돌려 쓰게 되고,
 * 그 사이 다른 곳에서 바뀐 값이 조용히 덮인다.
 *
 * 크롤링 수집분으로 되돌리면 검수 상태를 지운다. 검수는 외부에서 올라온 글에만 있는 개념이라
 * 등록 경로가 크롤링인데 검수 상태가 남아 있으면 목록의 검수 필터가 이상한 행을 집는다.
 */
const patchJobHandler = http.patch('*/api/v1/admin/jobs/:jobId', async ({ params, request }) => {
  const job = ADMIN_JOB_FIXTURES.find((fixture) => fixture.id === Number(params.jobId));
  if (!job) {
    return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
  }

  const body = (await request.json()) as AdminJobPatchRequest;

  const error = applyContentPatch(
    job as unknown as Record<string, unknown>,
    body,
    JOB_CONTENT_FIELDS,
  );
  if (error) {
    return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message: error }, { status: 400 });
  }

  if (body.visibility !== undefined) {
    job.visibility = body.visibility;
  }
  if (body.source !== undefined) {
    job.source = body.source;
    if (body.source === 'CRAWLER') {
      job.reviewStatus = null;
    } else if (job.reviewStatus === null) {
      job.reviewStatus = 'PENDING';
    }
  }
  if (body.reviewStatus !== undefined && job.source === 'COMPANY') {
    job.reviewStatus = body.reviewStatus;
  }
  // 반려가 풀리면 보낸 사유도 함께 사라진다. 남겨 두면 반려 보관에 허용된 건이 섞인다.
  if (job.reviewStatus !== 'REJECTED') {
    clearRejection('JOB', job.id);
  }

  return HttpResponse.json(ok(job), { status: 200 });
});

const patchBootcampHandler = http.patch(
  '*/api/v1/admin/bootcamps/:bootcampId',
  async ({ params, request }) => {
    const bootcamp = ADMIN_BOOTCAMP_FIXTURES.find(
      (fixture) => fixture.id === Number(params.bootcampId),
    );
    if (!bootcamp) {
      return HttpResponse.json(notFound('부트캠프를 찾을 수 없습니다.'), { status: 404 });
    }

    const body = (await request.json()) as AdminBootcampPatchRequest;
    const error = applyContentPatch(
      bootcamp as unknown as Record<string, unknown>,
      body,
      BOOTCAMP_CONTENT_FIELDS,
    );
    if (error) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: error },
        { status: 400 },
      );
    }

    if (body.visibility !== undefined) {
      bootcamp.visibility = body.visibility;
    }
    // 등록 경로·검수 상태 규칙은 채용공고와 같다. 이유는 위 patchJobHandler 주석에 있다.
    if (body.source !== undefined) {
      bootcamp.source = body.source;
      if (body.source === 'CRAWLER') {
        bootcamp.reviewStatus = null;
      } else if (bootcamp.reviewStatus === null) {
        bootcamp.reviewStatus = 'PENDING';
      }
    }
    if (body.reviewStatus !== undefined && bootcamp.source === 'COMPANY') {
      bootcamp.reviewStatus = body.reviewStatus;
    }
    if (bootcamp.reviewStatus !== 'REJECTED') {
      clearRejection('BOOTCAMP', bootcamp.id);
    }

    return HttpResponse.json(ok(bootcamp), { status: 200 });
  },
);

/**
 * 삭제. 배열에서 실제로 뺀다.
 *
 * 되돌릴 길을 두지 않는다 — 화면에서 문구를 그대로 입력해야만 버튼이 열리고, 그 확인이
 * 되돌리기를 대신한다. 실제 백엔드에서는 soft delete 로 두는 편이 낫고, 그 결정은 계약을
 * 넘길 때 함께 정한다.
 */
function removeById<T extends { id: number }>(list: T[], id: number): boolean {
  const position = list.findIndex((entry) => entry.id === id);
  if (position < 0) {
    return false;
  }
  list.splice(position, 1);
  return true;
}

const deleteJobHandler = http.delete('*/api/v1/admin/jobs/:jobId', ({ params }) => {
  const id = Number(params.jobId);
  if (!removeById(ADMIN_JOB_FIXTURES, id)) {
    return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
  }
  clearRejection('JOB', id);
  return HttpResponse.json(ok({ id }), { status: 200 });
});

const deleteBootcampHandler = http.delete('*/api/v1/admin/bootcamps/:bootcampId', ({ params }) => {
  const id = Number(params.bootcampId);
  if (!removeById(ADMIN_BOOTCAMP_FIXTURES, id)) {
    return HttpResponse.json(notFound('부트캠프를 찾을 수 없습니다.'), { status: 404 });
  }
  clearRejection('BOOTCAMP', id);
  return HttpResponse.json(ok({ id }), { status: 200 });
});

const deleteSideStudyHandler = http.delete('*/api/v1/admin/side-studies/:postId', ({ params }) => {
  const id = Number(params.postId);
  if (!removeById(ADMIN_SIDE_STUDY_FIXTURES, id)) {
    return HttpResponse.json(notFound('사이드·스터디 글을 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok({ id }), { status: 200 });
});

const listBootcampsHandler = http.get('*/api/v1/admin/bootcamps', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const recruitmentStatus = url.searchParams.get('recruitmentStatus') ?? '';
  const visibility = url.searchParams.get('visibility') ?? '';
  const source = url.searchParams.get('source') ?? '';
  const reviewStatus = url.searchParams.get('reviewStatus') ?? '';
  const { page, size } = readPaging(url);

  // 채용공고와 같은 필터를 받는다. 같은 일을 하러 두 화면을 오갈 때 조작이 달라지면 안 된다.
  const filtered = ADMIN_BOOTCAMP_FIXTURES.filter((bootcamp) => {
    if (keyword && !matches(`${bootcamp.title} ${bootcamp.companyName}`, keyword)) {
      return false;
    }
    if (recruitmentStatus && bootcamp.recruitmentStatus !== recruitmentStatus) {
      return false;
    }
    if (visibility && bootcamp.visibility !== visibility) {
      return false;
    }
    if (source && bootcamp.source !== source) {
      return false;
    }
    if (reviewStatus && bootcamp.reviewStatus !== reviewStatus) {
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
  patchJobHandler,
  listBootcampsHandler,
  getBootcampHandler,
  patchBootcampHandler,
  deleteJobHandler,
  deleteBootcampHandler,
  deleteSideStudyHandler,
  listSideStudiesHandler,
  getSideStudyHandler,
];
