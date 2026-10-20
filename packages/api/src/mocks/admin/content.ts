import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminBootcampDetailResponse,
  AdminBootcampSummaryResponse,
  AdminJobDetailResponse,
  AdminJobSummaryResponse,
  AdminRecruitmentPostSummaryResponse,
  ChangeAdminJobVisibilityRequest,
  ChangeAdminRecruitmentPostVisibilityRequest,
  PageResponseAdminBootcampSummaryResponse,
  PageResponseAdminJobSummaryResponse,
  PageResponseAdminRecruitmentPostSummaryResponse,
  SuccessResponseUnit,
  UpdateAdminBootcampRequest,
  UpdateAdminJobRequest,
} from '../../generated/admin/models';
import { enumParent } from '../../enums';
import {
  ADMIN_BOOTCAMP_FIXTURES,
  ADMIN_JOB_FIXTURES,
  ADMIN_SIDE_STUDY_FIXTURES,
  recruitmentStatusOf,
} from '../fixtures/admin-content';
import {
  RECRUITMENT_POST_FIXTURES,
  type RecruitmentPostFixture,
} from '../fixtures/recruitment-post';
import { clearRejection } from '../fixtures/admin-rejection';
import { matches, notFound, ok, paginate, readPaging } from './paging';

/**
 * 콘텐츠 목록·상세 핸들러.
 *
 * 세 화면이 칸 구성은 같지만 필터가 다르다. 채용공고는 계산한 모집 상태(`recruitmentStatus`),
 * 부트캠프는 저장된 `BootcampStatus`(`status`), 사이드·스터디는 종류(`recruitmentType`)와 모집 상태로
 * 거른다.
 *
 * 채용공고·부트캠프의 응답 타입은 admin 스펙의 생성 모델이다.
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
  sourceUrl: _sourceUrl,
  ...summary
}: AdminJobDetailResponse): AdminJobSummaryResponse => summary;

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
}: AdminBootcampDetailResponse): AdminBootcampSummaryResponse => summary;

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
  const body: PageResponseAdminJobSummaryResponse = {
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

/**
 * 운영 값 수정으로 반려를 보내면 백엔드처럼 400 을 준다. 반려는 사유가 있어야 해서 검수 화면
 * (`PATCH /content-reviews/{type}/{id}`) 에서만 한다. 메시지는 로컬 백엔드의 응답을 그대로 옮겼다.
 *
 * 등록 경로(`source`) 는 스펙의 요청 모델에 없고 백엔드는 보내도 버린다. 목도 읽지 않는다.
 */
function rejectedViaPatch(body: UpdateAdminJobRequest | UpdateAdminBootcampRequest) {
  if (body.reviewStatus !== 'REJECTED') {
    return null;
  }
  return HttpResponse.json(
    {
      status: 400,
      code: 'BAD_REQUEST',
      message: '[reviewStatus] 반려는 검수 화면에서 사유와 함께 처리해 주세요.',
    },
    { status: 400 },
  );
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

/** `[필드] 사유` 꼴의 400. 백엔드 `AdminApiExceptionHandler.validationMessage` 와 같은 모양이다. */
const badRequest = (field: string, reason: string) =>
  HttpResponse.json(
    { status: 400, code: 'BAD_REQUEST', message: `[${field}] ${reason}` },
    { status: 400 },
  );

/** `clear` 로 비울 수 있는 공고 정보. 백엔드 `AdminJobClearableField` 와 같다. */
const JOB_CLEARABLE_FIELDS = [
  'parentCompanyName',
  'industry',
  'coverImageUrl',
  'logoUrl',
  'jobField',
  'jobRole',
  'experienceMinYears',
  'region',
  'subRegion',
  'recruitmentHeadcount',
  'recruitmentStartAt',
  'recruitmentEndAt',
  'closesWhenFilled',
  'autoCloseEnabled',
  'recruitmentNotice',
  'applicationMethod',
  'applyEmail',
  'inquiryEmail',
  'sourceUrl',
] as const;

/** 공백만 보내면 400 인 칸. 백엔드 요청의 `notBlank` 와 같다. 비우기는 `clear` 로 받는다. */
const JOB_NOT_BLANK_FIELDS = [
  'companyName',
  'parentCompanyName',
  'industry',
  'coverImageUrl',
  'logoUrl',
  'recruitmentNotice',
  'applyEmail',
  'inquiryEmail',
  'sourceUrl',
] as const;

/**
 * 공고 정보(회사명부터 원문 주소까지)를 합친 값. 백엔드 `AdminJobDetailsPatch.mergeInto` 를 옮겼다.
 *
 * 보낸 값은 쓰고, `clear` 에 담은 값은 지우고, 나머지는 지금 값을 둔다. 직군·시·도·모집 기간 유형을
 * 바꾸면 딸린 값(직무, 시·군·구, 모집 종료 일시)이 맞지 않을 수 있어, 함께 보내지 않았으면 맞지 않는
 * 지금 값을 지운다. 함께 보낸 값이 맞지 않으면 400 이다.
 *
 * 공고에 바로 쓰지 않고 합친 값을 돌려준다. 확인이 다 끝난 뒤에 쓰므로 400 이 나도 공고가 반쯤
 * 바뀌지 않는다.
 */
function mergeJobDetails(
  job: AdminJobDetailResponse,
  body: UpdateAdminJobRequest,
): { error: Response } | { next: Partial<AdminJobDetailResponse> } {
  const sent = body as Record<string, unknown>;
  const current = job as unknown as Record<string, unknown>;
  const cleared = body.clear ?? [];

  const notClearable = cleared.find(
    (name) => !(JOB_CLEARABLE_FIELDS as readonly string[]).includes(name),
  );
  if (notClearable !== undefined) {
    return { error: badRequest('clear', `비울 수 없는 필드입니다: ${notClearable}`) };
  }
  const sentAndCleared = cleared.find((name) => sent[name] != null);
  if (sentAndCleared !== undefined) {
    return { error: badRequest(sentAndCleared, '값을 보내면서 비울 수 없습니다.') };
  }
  const blank = JOB_NOT_BLANK_FIELDS.find((field) => body[field]?.trim() === '');
  if (blank !== undefined) {
    return { error: badRequest(blank, '공백일 수 없습니다. 비우려면 clear에 담아 주세요.') };
  }

  const pick = (field: string): unknown =>
    sent[field] != null ? sent[field] : cleared.includes(field) ? undefined : current[field];

  // 직무만 보내면 그 직무의 직군으로 맞춘다. 시·도와 시·군·구도 같다.
  const jobField =
    body.jobField ??
    (body.jobRole ? enumParent('JobRole', body.jobRole) : undefined) ??
    pick('jobField');
  const currentRole = pick('jobRole') as string | undefined;
  if (body.jobRole && enumParent('JobRole', body.jobRole) !== jobField) {
    return { error: badRequest('jobRole', 'jobField와 같은 직군의 직무여야 합니다.') };
  }
  const jobRole =
    currentRole && enumParent('JobRole', currentRole) === jobField ? currentRole : undefined;

  const region =
    body.region ??
    (body.subRegion ? enumParent('SubRegion', body.subRegion) : undefined) ??
    pick('region');
  const currentSubRegion = pick('subRegion') as string | undefined;
  if (body.subRegion && enumParent('SubRegion', body.subRegion) !== region) {
    return { error: badRequest('subRegion', 'region과 같은 시·도의 시·군·구여야 합니다.') };
  }
  const subRegion =
    currentSubRegion && enumParent('SubRegion', currentSubRegion) === region
      ? currentSubRegion
      : undefined;

  const recruitmentType = body.recruitmentType ?? job.recruitmentType;
  if (recruitmentType === 'ALWAYS_OPEN' && body.recruitmentEndAt != null) {
    return {
      error: badRequest('recruitmentEndAt', '상시 채용에는 모집 종료 일시를 둘 수 없습니다.'),
    };
  }
  const recruitmentEndAt =
    recruitmentType === 'ALWAYS_OPEN'
      ? undefined
      : (pick('recruitmentEndAt') as string | undefined);
  const recruitmentStartAt = pick('recruitmentStartAt') as string | undefined;
  if (
    recruitmentStartAt &&
    recruitmentEndAt &&
    new Date(recruitmentStartAt).getTime() > new Date(recruitmentEndAt).getTime()
  ) {
    return { error: badRequest('recruitmentStartAt', '모집 종료 일시보다 늦을 수 없습니다.') };
  }

  const picked = Object.fromEntries(
    [
      'parentCompanyName',
      'industry',
      'coverImageUrl',
      'logoUrl',
      'experienceMinYears',
      'recruitmentHeadcount',
      'closesWhenFilled',
      'autoCloseEnabled',
      'recruitmentNotice',
      'applicationMethod',
      'applyEmail',
      'inquiryEmail',
      'sourceUrl',
    ].map((field) => [field, pick(field)]),
  );
  return {
    next: {
      ...picked,
      companyName: body.companyName ?? job.companyName,
      employmentType: body.employmentType ?? job.employmentType,
      experienceType: body.experienceType ?? job.experienceType,
      educationLevel: body.educationLevel ?? job.educationLevel,
      jobField,
      jobRole,
      region,
      subRegion,
      recruitmentType,
      recruitmentStartAt,
      recruitmentEndAt,
    } as Partial<AdminJobDetailResponse>,
  };
}

/**
 * 채용공고의 운영 값·공고 정보·제목과 본문을 고친다.
 *
 * 넘어온 칸만 바꾼다. 두 값을 늘 함께 보내게 하면 화면이 안 건드린 값까지 되돌려 쓰게 되고,
 * 그 사이 다른 곳에서 바뀐 값이 조용히 덮인다.
 */
const patchJobHandler = http.patch('*/api/v1/admin/jobs/:jobId', async ({ params, request }) => {
  const job = ADMIN_JOB_FIXTURES.find((fixture) => fixture.id === Number(params.jobId));
  if (!job) {
    return HttpResponse.json(notFound('채용공고를 찾을 수 없습니다.'), { status: 404 });
  }

  const body = (await request.json()) as UpdateAdminJobRequest;
  const rejected = rejectedViaPatch(body);
  if (rejected) {
    return rejected;
  }

  const merged = mergeJobDetails(job, body);
  if ('error' in merged) {
    return merged.error;
  }

  const error = applyContentPatch(
    job as unknown as Record<string, unknown>,
    body,
    JOB_CONTENT_FIELDS,
  );
  if (error) {
    return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message: error }, { status: 400 });
  }
  Object.assign(job, merged.next);
  // 모집 상태는 저장값이 아니라 일정에서 계산한다. 지난 마감일을 미루면 모집 중으로 돌아가고,
  // 직접 마감한 공고(`closedAt`)는 마감으로 남는다.
  job.recruitmentStatus = recruitmentStatusOf({
    closedAt: job.closedAt,
    recruitmentEndAt: job.recruitmentEndAt,
    alwaysOpen: job.recruitmentType === 'ALWAYS_OPEN',
  });

  if (body.visibility !== undefined) {
    job.visibility = body.visibility;
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

    const body = (await request.json()) as UpdateAdminBootcampRequest;
    const rejected = rejectedViaPatch(body);
    if (rejected) {
      return rejected;
    }
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
    // 검수 상태 규칙은 채용공고와 같다.
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
 * 노출 일괄 변경(`PATCH /api/v1/admin/{jobs|bootcamps}/visibility`). 백엔드(LC-3429)와 같은 규칙이다.
 *
 * - 하나라도 바꿀 수 없으면 아무것도 바꾸지 않는다.
 * - 없는 id 가 있으면 404 이고 메시지 끝에 그 id 를 담는다.
 * - 승인 전 기업회원 콘텐츠를 노출로 바꾸려 하면 409 다.
 *
 * `:jobId` 핸들러보다 앞에 둬야 한다. 뒤에 두면 `visibility` 가 id 로 잡혀 404 가 난다.
 */
function changeVisibilities<
  T extends { id: number; visibility: string; source: string; reviewStatus?: string | null },
>(rows: T[], body: ChangeAdminJobVisibilityRequest, noun: string) {
  const ids = [...new Set(body.ids)];
  const targets = ids.map((id) => rows.find((row) => row.id === id));
  const missing = ids.filter((_, index) => !targets[index]);
  if (missing.length > 0) {
    return HttpResponse.json(notFound(`${noun}를 찾을 수 없습니다: ${missing.join(', ')}`), {
      status: 404,
    });
  }

  const found = targets as T[];
  const unapproved = found.filter(
    (row) => row.source === 'COMPANY' && row.reviewStatus !== 'APPROVED',
  );
  if (body.visibility === 'VISIBLE' && unapproved.length > 0) {
    return HttpResponse.json(
      {
        status: 409,
        code: 'CONFLICT',
        message: `승인 전 ${noun}는 노출할 수 없습니다: ${unapproved.map((row) => row.id).join(', ')}`,
      },
      { status: 409 },
    );
  }

  for (const row of found) {
    row.visibility = body.visibility;
  }
  const response: SuccessResponseUnit = ok({});
  return HttpResponse.json(response, { status: 200 });
}

const changeJobVisibilitiesHandler = http.patch(
  '*/api/v1/admin/jobs/visibility',
  async ({ request }) =>
    changeVisibilities(
      ADMIN_JOB_FIXTURES,
      (await request.json()) as ChangeAdminJobVisibilityRequest,
      '채용공고',
    ),
);

const changeBootcampVisibilitiesHandler = http.patch(
  '*/api/v1/admin/bootcamps/visibility',
  async ({ request }) =>
    changeVisibilities(
      ADMIN_BOOTCAMP_FIXTURES,
      (await request.json()) as ChangeAdminJobVisibilityRequest,
      '부트캠프',
    ),
);

/**
 * 삭제. 배열에서 실제로 뺀다. 응답은 스펙대로 `SuccessResponseUnit` 이고 `data` 는 빈 객체다.
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
  const body: SuccessResponseUnit = ok({});
  return HttpResponse.json(body, { status: 200 });
});

const deleteBootcampHandler = http.delete('*/api/v1/admin/bootcamps/:bootcampId', ({ params }) => {
  const id = Number(params.bootcampId);
  if (!removeById(ADMIN_BOOTCAMP_FIXTURES, id)) {
    return HttpResponse.json(notFound('부트캠프를 찾을 수 없습니다.'), { status: 404 });
  }
  clearRejection('BOOTCAMP', id);
  const body: SuccessResponseUnit = ok({});
  return HttpResponse.json(body, { status: 200 });
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
  const status = url.searchParams.get('status') ?? '';
  const visibility = url.searchParams.get('visibility') ?? '';
  const source = url.searchParams.get('source') ?? '';
  const reviewStatus = url.searchParams.get('reviewStatus') ?? '';
  const { page, size } = readPaging(url);

  // 채용공고와 같은 필터를 받는다. 같은 일을 하러 두 화면을 오갈 때 조작이 달라지면 안 된다.
  const filtered = ADMIN_BOOTCAMP_FIXTURES.filter((bootcamp) => {
    if (keyword && !matches(`${bootcamp.title} ${bootcamp.companyName}`, keyword)) {
      return false;
    }
    if (status && bootcamp.status !== status) {
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
  const body: PageResponseAdminBootcampSummaryResponse = {
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
 * 사이드·스터디 목록(`GET /api/v1/admin/recruitment-posts`).
 *
 * 사용자 웹 모집글 목의 12 건(`RECRUITMENT_POST_FIXTURES`)을 admin 모델로 옮긴다. 상세·삭제는
 * 아직 백엔드가 없어 `ADMIN_SIDE_STUDY_FIXTURES` 에 남아 있다. 두 픽스처는 id 가 같으므로 거기서
 * 지워진 글은 목록에서도 빼고, 등록일도 거기서 가져온다. 노출은 목록 픽스처에 없는 값이라 따로 든다.
 */
const recruitmentPostVisibility = new Map<
  number,
  AdminRecruitmentPostSummaryResponse['visibility']
>();

const toAdminRecruitmentPost = (
  post: RecruitmentPostFixture,
  registeredAt: string,
): AdminRecruitmentPostSummaryResponse => ({
  id: post.id,
  title: post.title,
  recruitmentType: post.recruitmentType,
  progressMethod: post.progressMethod,
  capacity: post.capacity,
  activityDurationMonths: post.activityDurationMonths,
  positions: post.positions,
  technologyStacks: post.technologyStacks,
  recruitmentStartDate: post.recruitmentStartDate,
  recruitmentEndDate: post.recruitmentEndDate,
  recruitmentStatus: post.recruitmentStatus,
  viewCount: post.viewCount,
  bookmarkCount: post.bookmarkCount,
  commentCount: post.commentCount,
  visibility: recruitmentPostVisibility.get(post.id) ?? 'VISIBLE',
  authorUserId: post.author.userId,
  authorNickname: post.author.nickname,
  registeredAt,
});

const adminRecruitmentPosts = (): AdminRecruitmentPostSummaryResponse[] =>
  RECRUITMENT_POST_FIXTURES.flatMap((post) => {
    const study = ADMIN_SIDE_STUDY_FIXTURES.find((fixture) => fixture.id === post.id);
    return study ? [toAdminRecruitmentPost(post, study.registeredAt)] : [];
  });

const listRecruitmentPostsHandler = http.get('*/api/v1/admin/recruitment-posts', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const visibility = url.searchParams.get('visibility') ?? '';
  const recruitmentType = url.searchParams.get('recruitmentType') ?? '';
  const recruitmentStatus = url.searchParams.get('recruitmentStatus') ?? '';
  const { page, size } = readPaging(url);

  const filtered = adminRecruitmentPosts().filter((post) => {
    if (keyword && !matches(`${post.title} ${post.authorNickname ?? ''}`, keyword)) {
      return false;
    }
    if (visibility && post.visibility !== visibility) {
      return false;
    }
    if (recruitmentType && post.recruitmentType !== recruitmentType) {
      return false;
    }
    if (recruitmentStatus && post.recruitmentStatus !== recruitmentStatus) {
      return false;
    }
    return true;
  });

  const sorted = sortContent(filtered, readSort(url));
  const body: PageResponseAdminRecruitmentPostSummaryResponse = paginate(sorted, page, size);
  return HttpResponse.json(ok(body), { status: 200 });
});

/** 하나라도 없는 id 가 있으면 아무것도 바꾸지 않는다. 채용공고·부트캠프와 같다. */
const changeRecruitmentPostVisibilitiesHandler = http.patch(
  '*/api/v1/admin/recruitment-posts/visibility',
  async ({ request }) => {
    const body = (await request.json()) as ChangeAdminRecruitmentPostVisibilityRequest;
    const known = new Set(adminRecruitmentPosts().map((post) => post.id));
    const missing = body.ids.filter((id) => !known.has(id));
    if (missing.length > 0) {
      return HttpResponse.json(
        notFound(`사이드·스터디 글을 찾을 수 없습니다: ${missing.join(', ')}`),
        { status: 404 },
      );
    }
    for (const id of body.ids) {
      recruitmentPostVisibility.set(id, body.visibility);
    }
    const response: SuccessResponseUnit = ok({});
    return HttpResponse.json(response, { status: 200 });
  },
);

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
  changeJobVisibilitiesHandler,
  patchJobHandler,
  listBootcampsHandler,
  getBootcampHandler,
  changeBootcampVisibilitiesHandler,
  patchBootcampHandler,
  deleteJobHandler,
  deleteBootcampHandler,
  deleteSideStudyHandler,
  listRecruitmentPostsHandler,
  changeRecruitmentPostVisibilitiesHandler,
  getSideStudyHandler,
];
