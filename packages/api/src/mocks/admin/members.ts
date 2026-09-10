import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  COMPANY_MEMBER_FIXTURES,
  USER_MEMBER_FIXTURES,
  type CompanyMemberSummary,
  type UserMemberSummary,
} from '../fixtures/admin-member';
import { ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { activityFor } from '../fixtures/admin-member-activity';
import { matches, notFound, ok, paginate, readPaging, type PageResponse } from './paging';

/**
 * 회원 목록·상세 핸들러.
 *
 * 두 화면 모두 읽기 전용이다. 제재는 운영자가 쿼리로 걸고 콘솔은 그 결과를 보여주기만 한다
 * (PRD "하지 않는 것"). 그래서 상태를 바꾸는 핸들러가 없다.
 */

/** 가입 기간 필터. 화면 드롭다운의 값과 1:1 이다. */
const JOINED_WITHIN_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function joinedWithin(joinedAt: string, key: string): boolean {
  const days = JOINED_WITHIN_DAYS[key];
  if (days === undefined) {
    return true;
  }
  return new Date(joinedAt).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

const listUserMembersHandler = http.get('*/api/v1/admin/members/users', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const joinedWithinDays = url.searchParams.get('joinedWithinDays') ?? '';
  const { page, size } = readPaging(url);

  const filtered = USER_MEMBER_FIXTURES.filter((member) => {
    if (keyword && !matches(`${member.nickname} ${member.email}`, keyword)) {
      return false;
    }
    if (status && member.status !== status) {
      return false;
    }
    if (joinedWithinDays && !joinedWithin(member.joinedAt, joinedWithinDays)) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
  );
  const paged = paginate(sorted, page, size);
  const body: PageResponse<UserMemberSummary> = paged;
  return HttpResponse.json(ok(body), { status: 200 });
});

/** 상세는 기본 정보에 북마크와 작성 글을 함께 준다. 요청을 셋으로 나누면 화면이 세 번 흔들린다. */
const getUserMemberHandler = http.get('*/api/v1/admin/members/users/:memberId', ({ params }) => {
  const memberId = Number(params.memberId);
  const member = USER_MEMBER_FIXTURES.find((fixture) => fixture.id === memberId);
  if (!member) {
    return HttpResponse.json(notFound('회원을 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok({ ...member, ...activityFor(memberId) }), { status: 200 });
});

const listCompanyMembersHandler = http.get('*/api/v1/admin/members/companies', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const joinedWithinDays = url.searchParams.get('joinedWithinDays') ?? '';
  const { page, size } = readPaging(url);

  const filtered = COMPANY_MEMBER_FIXTURES.filter((member) => {
    if (keyword && !matches(`${member.companyName} ${member.managerName}`, keyword)) {
      return false;
    }
    if (status && member.status !== status) {
      return false;
    }
    if (joinedWithinDays && !joinedWithin(member.joinedAt, joinedWithinDays)) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
  );
  const paged = paginate(sorted, page, size);
  const body: PageResponse<CompanyMemberSummary> = paged;
  return HttpResponse.json(ok(body), { status: 200 });
});

/**
 * 비즈니스 회원 상세는 그 회사가 등록한 공고를 함께 준다.
 *
 * 회사명으로 잇는다. 픽스처에 회사 id 가 없어서인데, 백엔드에는 외래키가 있을 자리다 —
 * 계약을 넘길 때 `companyId` 로 바꾼다.
 */
const getCompanyMemberHandler = http.get(
  '*/api/v1/admin/members/companies/:memberId',
  ({ params }) => {
    const memberId = Number(params.memberId);
    const member = COMPANY_MEMBER_FIXTURES.find((fixture) => fixture.id === memberId);
    if (!member) {
      return HttpResponse.json(notFound('비즈니스 회원을 찾을 수 없습니다.'), { status: 404 });
    }

    const jobs = ADMIN_JOB_FIXTURES.filter(
      (job) => job.source === 'COMPANY' && job.companyName === member.companyName,
    ).map((job) => ({
      id: job.id,
      title: job.title,
      visibility: job.visibility,
      reviewStatus: job.reviewStatus,
      registeredAt: job.registeredAt,
      viewCount: job.viewCount,
    }));

    return HttpResponse.json(ok({ ...member, jobs }), { status: 200 });
  },
);

export const memberHandlers: HttpHandler[] = [
  listUserMembersHandler,
  getUserMemberHandler,
  listCompanyMembersHandler,
  getCompanyMemberHandler,
];
