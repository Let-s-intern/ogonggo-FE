import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  RECRUITMENT_POST_FIXTURES,
  type RecruitmentPostFixture,
} from './fixtures/recruitment-post';
import type { CreateRecruitmentPostRequest } from '../generated/user/models/createRecruitmentPostRequest';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { RecruitmentPostFormResponse } from '../generated/user/models/recruitmentPostFormResponse';
import type { RecruitmentPostManagementItemResponse } from '../generated/user/models/recruitmentPostManagementItemResponse';
import type { SuccessResponseCreateRecruitmentPostResponse } from '../generated/user/models/successResponseCreateRecruitmentPostResponse';
import type { SuccessResponsePageResponseRecruitmentPostManagementItemResponse } from '../generated/user/models/successResponsePageResponseRecruitmentPostManagementItemResponse';
import type { SuccessResponseRecruitmentPostFormResponse } from '../generated/user/models/successResponseRecruitmentPostFormResponse';

/**
 * 내 모집글(작성한 모집글 표·작성 화면) 목 핸들러. 목록·폼 조회·복사·생성·수정.
 *
 * 생성 핸들러의 무작위 응답으로는 작성 화면을 볼 수 없어 손으로 썼다 — 목록의 `postId` 와 폼 조회가
 * 서로 맞지 않고, 첨부 사진·본문이 매번 바뀐다. 사이드·스터디 목 글(`./fixtures/recruitment-post.ts`)
 * 12 건을 모두 내 글로 두고 브라우저 워커가 도는 동안 메모리에서 고친다. 새로 고치면 처음으로 돌아간다.
 *
 * 생성·수정은 백엔드처럼 본문(`content`)에 이미지 노드가 있으면 400 이다. 사진은 `imageIds` 로만 붙는다.
 * 필수값·길이 검사는 하지 않는다. 목록 필터·정렬도 무시하고 최근 것부터 준다.
 */

interface MyPost {
  form: RecruitmentPostFormResponse;
  viewCount: number;
  commentCount: number;
  applicationCount: number;
  lastSavedAt: string;
}

const toForm = (post: RecruitmentPostFixture): RecruitmentPostFormResponse => ({
  postId: post.id,
  status: 'PUBLISHED',
  recruitmentStatus: post.recruitmentStatus,
  title: post.title,
  recruitmentType: post.recruitmentType,
  capacity: post.capacity,
  progressMethod: post.progressMethod,
  activityDurationMonths: post.activityDurationMonths,
  technologyStacks: post.technologyStacks,
  summary: post.summary,
  content: post.content,
  images: post.images,
  eligibilityAndSelectionProcess: post.eligibilityAndSelectionProcess,
  recruitmentStartDate: post.recruitmentStartDate,
  recruitmentEndDate: post.recruitmentEndDate,
  positions: post.positions,
  contactMethod: post.contact.method,
  contactValue: post.contact.value,
  agreedToPolicy: false,
});

const store = new Map<number, MyPost>(
  RECRUITMENT_POST_FIXTURES.map((post) => [
    post.id,
    {
      form: toForm(post),
      viewCount: post.viewCount,
      commentCount: post.commentCount,
      applicationCount: post.applicationCount,
      lastSavedAt: `${post.recruitmentStartDate}T09:00:00`,
    },
  ]),
);
let nextPostId = 1_000;
let nextImageId = 1;

const now = () => new Date().toISOString().slice(0, 19);

const errorResponse = (status: number, code: string, message: string) => {
  const body: ErrorResponse = { status, code, message };
  return HttpResponse.json(body, { status });
};

const notFound = () =>
  errorResponse(404, 'RECRUITMENT_POST_NOT_FOUND', '모집글을 찾을 수 없습니다.');

const findPost = (postId: unknown) => store.get(Number(postId));

/** 본문에 이미지 노드가 있는지. 노드 모양은 `@ogonggo/ui` 편집기의 `lexicalImageNode.tsx` 가 낸다. */
const hasImageNode = (content: unknown) =>
  JSON.stringify(content ?? null).includes('"type":"image"');

/** 저장 요청을 폼으로. 수정은 전체 교체라 요청에 없는 칸은 비운다. */
const applyRequest = (
  base: Pick<RecruitmentPostFormResponse, 'postId' | 'recruitmentStatus' | 'images'>,
  request: CreateRecruitmentPostRequest,
): RecruitmentPostFormResponse => ({
  postId: base.postId,
  status: request.saveMode === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
  recruitmentStatus: base.recruitmentStatus,
  title: request.title,
  recruitmentType: request.recruitmentType,
  capacity: request.capacity,
  progressMethod: request.progressMethod,
  activityDurationMonths: request.activityDurationMonths,
  technologyStacks: request.technologyStacks ?? [],
  summary: request.summary,
  content: request.content,
  // 주소를 알 수 없는 새 사진(발급 목이 만든 id)은 첫 목 사진 주소로 둔다.
  images: request.imageIds.map(
    (id) => base.images.find((image) => image.id === id) ?? { id, url: '/hero/side-studies.png' },
  ),
  eligibilityAndSelectionProcess: request.eligibilityAndSelectionProcess,
  recruitmentStartDate: request.recruitmentStartDate,
  recruitmentEndDate: request.recruitmentEndDate,
  positions: request.positions ?? [],
  contactMethod: request.contactMethod,
  contactValue: request.contactValue,
  agreedToPolicy: false,
});

const rejectImageContent = () =>
  errorResponse(400, 'BAD_REQUEST', '[content] 본문에는 사진을 넣을 수 없습니다.');

/** `listMyRecruitmentPosts`(`GET /api/v1/users/me/recruitment-posts`). */
const listHandler = http.get('*/api/v1/users/me/recruitment-posts', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const page = Math.max(Number(params.get('page') ?? 1), 1);
  const size = Math.max(Number(params.get('size') ?? 10), 1);
  const all = [...store.values()].sort((a, b) => b.form.postId - a.form.postId);
  const items = all
    .slice((page - 1) * size, page * size)
    .map(({ form, ...rest }): RecruitmentPostManagementItemResponse => ({
      postId: form.postId,
      status: form.status,
      title: form.title,
      recruitmentType: form.recruitmentType,
      progressMethod: form.progressMethod,
      activityDurationMonths: form.activityDurationMonths,
      recruitmentStatus: form.status === 'DRAFT' ? undefined : form.recruitmentStatus,
      recruitmentStartDate: form.recruitmentStartDate,
      recruitmentEndDate: form.recruitmentEndDate,
      capacity: form.capacity,
      applicationCount: rest.applicationCount,
      viewCount: rest.viewCount,
      commentCount: rest.commentCount,
      lastSavedAt: rest.lastSavedAt,
      continueWriting: form.status === 'DRAFT',
    }));
  const body: SuccessResponsePageResponseRecruitmentPostManagementItemResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: {
      items,
      pageInfo: {
        pageNum: page,
        pageSize: size,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
      },
    },
  };
  return HttpResponse.json(body);
});

/** `getMyRecruitmentPostForm`(`GET /api/v1/users/me/recruitment-posts/{postId}`). */
const formHandler = http.get('*/api/v1/users/me/recruitment-posts/:postId', ({ params }) => {
  const post = findPost(params.postId);
  if (!post) {
    return notFound();
  }
  const body: SuccessResponseRecruitmentPostFormResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: post.form,
  };
  return HttpResponse.json(body);
});

/**
 * `copyMyRecruitmentPost`(`POST /api/v1/users/me/recruitment-posts/{postId}/copies`). 새 `DRAFT` 를
 * 만든다. 백엔드처럼 첨부 사진을 새 이미지로 복제한다 — id 는 새로, 주소는 그대로다.
 */
const copyHandler = http.post(
  '*/api/v1/users/me/recruitment-posts/:postId/copies',
  ({ params }) => {
    const post = findPost(params.postId);
    if (!post) {
      return notFound();
    }
    const postId = nextPostId++;
    const form: RecruitmentPostFormResponse = {
      ...post.form,
      postId,
      status: 'DRAFT',
      images: post.form.images.map((image) => ({
        id: `my-post-copy-image-${nextImageId++}`,
        url: image.url,
      })),
    };
    store.set(postId, {
      form,
      viewCount: 0,
      commentCount: 0,
      applicationCount: 0,
      lastSavedAt: now(),
    });
    const body: SuccessResponseRecruitmentPostFormResponse = {
      status: 200,
      message: '요청이 성공했습니다.',
      data: form,
    };
    return HttpResponse.json(body);
  },
);

/** `createRecruitmentPost`(`POST /api/v1/recruitment-posts`). */
const createHandler = http.post('*/api/v1/recruitment-posts', async ({ request }) => {
  const body = (await request.json()) as CreateRecruitmentPostRequest;
  if (hasImageNode(body.content)) {
    return rejectImageContent();
  }
  const postId = nextPostId++;
  store.set(postId, {
    form: applyRequest({ postId, recruitmentStatus: 'RECRUITING', images: [] }, body),
    viewCount: 0,
    commentCount: 0,
    applicationCount: 0,
    lastSavedAt: now(),
  });
  const response: SuccessResponseCreateRecruitmentPostResponse = {
    status: 201,
    message: 'Created',
    data: { id: postId },
  };
  return HttpResponse.json(response, { status: 201 });
});

/** `updateRecruitmentPost`(`PUT /api/v1/recruitment-posts/{postId}`). */
const updateHandler = http.put(
  '*/api/v1/recruitment-posts/:postId',
  async ({ params, request }) => {
    const post = findPost(params.postId);
    if (!post) {
      return notFound();
    }
    const body = (await request.json()) as CreateRecruitmentPostRequest;
    if (hasImageNode(body.content)) {
      return rejectImageContent();
    }
    post.form = applyRequest(post.form, body);
    post.lastSavedAt = now();
    return HttpResponse.json({ status: 200, message: '요청이 성공했습니다.' });
  },
);

export const myRecruitmentPostHandlers: HttpHandler[] = [
  listHandler,
  copyHandler,
  formHandler,
  createHandler,
  updateHandler,
];
