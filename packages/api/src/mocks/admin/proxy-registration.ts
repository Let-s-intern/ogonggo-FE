import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminBootcampDetailResponse,
  AdminJobDetailResponse,
  CreateProxyBootcampRequest,
  CreateProxyJobRequest,
  ErrorResponse,
} from '../../generated/admin/models';
import {
  ADMIN_BOOTCAMP_FIXTURES,
  ADMIN_JOB_FIXTURES,
  recruitmentStatusOf,
} from '../fixtures/admin-content';
import { COMPANY_MEMBER_FIXTURES } from '../fixtures/admin-member';
import { ok } from './paging';

/**
 * 비즈니스 회원 대리 등록(`POST /api/v1/admin/company-members/{userId}/jobs`, `.../bootcamps`, 백엔드 LC-3574).
 *
 * 백엔드처럼 없는 회원은 404 `USER_NOT_FOUND`, 정지·탈퇴 회원은 409 `COMPANY_MEMBER_NOT_ACTIVE` 다. 만든 공고는
 * 어드민 픽스처에 넣어 저장 뒤 넘어가는 상세와 목록에 바로 보인다. 검수 없이 승인(`APPROVED`)이고 `adminRegistered` 가 참이다.
 *
 * 칸 검증은 화면이 막는 필수 칸만 다시 본다. 나머지 규칙(`JobWriteValidator`·`BootcampWriteValidator`)은 백엔드가 한다.
 * 회원 상세의 등록 공고는 회사명으로 잇기 때문에(`./members.ts`) 회원 회사명 그대로 올린 공고만 거기에 보인다.
 */

const error = (status: number, code: string, message: string) => {
  const body: ErrorResponse = { status, code, message };
  return HttpResponse.json(body, { status });
};

const badField = (field: string, reason: string) =>
  error(400, 'BAD_REQUEST', `[${field}] ${reason}`);

/** 대리 등록할 수 있는 회원인지. 막히면 응답을, 되면 `null` 을 준다. */
function rejectMember(userId: number): Response | null {
  const member = COMPANY_MEMBER_FIXTURES.find((fixture) => fixture.id === userId);
  if (!member) {
    return error(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
  }
  if (member.status !== 'ACTIVE') {
    return error(
      409,
      'COMPANY_MEMBER_NOT_ACTIVE',
      '정지·탈퇴한 비즈니스 회원에게는 공고를 대신 등록할 수 없습니다.',
    );
  }
  return null;
}

/** 백엔드 모양(오프셋 없는 KST date-time)의 지금. */
const nowKst = (): string => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);

const nextId = (rows: { id: number }[]): number =>
  rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const blank = (value: string | undefined): boolean => !value || value.trim() === '';

const createJobHandler = http.post(
  '*/api/v1/admin/company-members/:userId/jobs',
  async ({ params, request }) => {
    const rejected = rejectMember(Number(params.userId));
    if (rejected) {
      return rejected;
    }
    const { visibility, ...body } = (await request.json()) as CreateProxyJobRequest;
    if (blank(body.companyName)) {
      return badField('companyName', '공백일 수 없습니다.');
    }
    if (blank(body.title)) {
      return badField('title', '공백일 수 없습니다.');
    }
    if (body.recruitmentType === 'ALWAYS_OPEN' && body.recruitmentEndAt) {
      return badField('recruitmentEndAt', '상시 채용에는 모집 종료 일시를 둘 수 없습니다.');
    }
    if (body.applicationMethod === 'EMAIL' && blank(body.applyEmail)) {
      return badField('applyEmail', '이메일 지원에는 지원 이메일이 필요합니다.');
    }

    const job: AdminJobDetailResponse = {
      ...body,
      id: nextId(ADMIN_JOB_FIXTURES),
      educationLevel: body.educationLevel ?? 'ANY',
      viewCount: 0,
      bookmarkCount: 0,
      commentCount: 0,
      visibility: visibility ?? 'VISIBLE',
      source: 'COMPANY',
      reviewStatus: 'APPROVED',
      recruitmentStatus: recruitmentStatusOf({
        recruitmentEndAt: body.recruitmentEndAt,
        alwaysOpen: body.recruitmentType === 'ALWAYS_OPEN',
      }),
      registeredAt: nowKst(),
      priorityExposed: true,
      adminRegistered: true,
      analysisCurrent: false,
    };
    ADMIN_JOB_FIXTURES.push(job);
    return HttpResponse.json({ ...ok(job), status: 201 }, { status: 201 });
  },
);

const createBootcampHandler = http.post(
  '*/api/v1/admin/company-members/:userId/bootcamps',
  async ({ params, request }) => {
    const rejected = rejectMember(Number(params.userId));
    if (rejected) {
      return rejected;
    }
    const { visibility, partners, curriculums, ...body } =
      (await request.json()) as CreateProxyBootcampRequest;
    for (const field of [
      'companyName',
      'title',
      'programType',
      'representativeImageUrl',
      'shortDescription',
      'content',
    ] as const) {
      if (blank(body[field])) {
        return badField(field, '공백일 수 없습니다.');
      }
    }
    if (body.applicationMethod === 'EXTERNAL_PAGE' && blank(body.applicationUrl)) {
      return badField('applicationUrl', '외부 페이지 지원 링크는 필수입니다.');
    }
    if (new Set(partners.map((partner) => partner.partnerName)).size !== partners.length) {
      return badField('partners', '중복된 파트너사명은 등록할 수 없습니다.');
    }

    const registeredAt = nowKst();
    const bootcamp: AdminBootcampDetailResponse = {
      ...body,
      id: nextId(ADMIN_BOOTCAMP_FIXTURES),
      closedAt: body.status === 'CLOSED' ? registeredAt : undefined,
      viewCount: 0,
      bookmarkCount: 0,
      commentCount: 0,
      visibility: visibility ?? 'VISIBLE',
      source: 'COMPANY',
      reviewStatus: 'APPROVED',
      registeredAt,
      priorityExposed: true,
      adminRegistered: true,
      partners: partners.map(({ partnerName, displayOrder }) => ({
        name: partnerName,
        displayOrder,
      })),
      curriculums,
      images: [],
    };
    ADMIN_BOOTCAMP_FIXTURES.push(bootcamp);
    return HttpResponse.json({ ...ok(bootcamp), status: 201 }, { status: 201 });
  },
);

export const proxyRegistrationHandlers: HttpHandler[] = [createJobHandler, createBootcampHandler];
