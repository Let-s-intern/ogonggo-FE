import { useQuery } from '@tanstack/react-query';
import {
  listCompanyMembers,
  listGeneralMembers,
  type ListCompanyMembersParams,
  type ListGeneralMembersParams,
} from '@ogonggo/api/src/admin';
import type {
  CompanyMemberSummary,
  UserMemberSummary,
} from '@ogonggo/api/src/mocks/fixtures/admin-member';
import type { JobReviewStatus, Visibility } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import type { UserMemberActivity } from '@ogonggo/api/src/mocks/fixtures/admin-member-activity';
import { adminGet } from '@/shared/api/adminClient';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { unwrapData } from '@/shared/api/unwrapData';
import { isBackendPending } from '@/shared/config/backendPending';

/**
 * 회원 목록·상세 조회.
 *
 * 목록 둘은 admin 스펙의 생성 함수(`listGeneralMembers`·`listCompanyMembers`) 를 부른다. 상세는
 * 백엔드 API 가 없어 MSW 목에만 있으므로 `adminClient` 로 부르고, 실서버 모드에서는 아예 부르지
 * 않는다 — 화면이 안내를 대신 그린다(`@/shared/config/backendPending`).
 */

export interface MemberListFilters {
  page: number;
  keyword: string;
  status: string;
  joinedWithinDays: string;
}

/** 가입 기간 드롭다운의 값(`JOINED_WITHIN_OPTIONS`) 이 며칠 전부터인지. */
const JOINED_WITHIN_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/**
 * 화면의 필터를 API 파라미터로 옮긴다.
 *
 * API 는 "최근 N일" 이 아니라 가입일 범위(`joinedFrom`·`joinedTo`, `YYYY-MM-DD`, 양끝 포함) 를
 * 받는다. 드롭다운은 그대로 두고 여기서 오늘부터 N일 전 날짜를 `joinedFrom` 으로 만든다. 끝은
 * 열어 둔다 — 오늘 가입한 회원까지 들어와야 한다.
 *
 * 날짜는 브라우저의 로컬 날짜로 만든다. `toISOString()` 은 UTC 라 한국 시간 오전 9시 전에는
 * 하루 앞 날짜가 나간다.
 */
function toMemberListParams({ joinedWithinDays, ...filters }: MemberListFilters) {
  const days = JOINED_WITHIN_DAYS[joinedWithinDays];
  const joinedFrom = days === undefined ? '' : localDateDaysAgo(days);
  return omitEmpty({ ...filters, joinedFrom });
}

function localDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function useUserMemberList(filters: MemberListFilters) {
  return useQuery({
    queryKey: ['admin', 'members', 'users', filters],
    // 상태 값은 화면의 선택지에서 오므로 스펙의 enum 과 같다.
    queryFn: () =>
      unwrapData(listGeneralMembers(toMemberListParams(filters) as ListGeneralMembersParams)),
  });
}

/** 상세는 기본 정보에 북마크와 작성 글을 함께 준다. */
export type UserMemberDetail = UserMemberSummary & UserMemberActivity;

export function useUserMemberDetail(memberId: number) {
  return useQuery({
    queryKey: ['admin', 'members', 'users', memberId],
    queryFn: () => adminGet<UserMemberDetail>(`/api/v1/admin/members/users/${memberId}`),
    enabled: !isBackendPending && Number.isInteger(memberId),
  });
}

export function useCompanyMemberList(filters: MemberListFilters) {
  return useQuery({
    queryKey: ['admin', 'members', 'companies', filters],
    queryFn: () =>
      unwrapData(listCompanyMembers(toMemberListParams(filters) as ListCompanyMembersParams)),
  });
}

/** 비즈니스 회원 상세는 그 회사가 등록한 공고 목록을 함께 준다. */
export interface CompanyMemberJob {
  id: number;
  title: string;
  visibility: Visibility;
  reviewStatus: JobReviewStatus | null;
  registeredAt: string;
  viewCount: number;
}

export type CompanyMemberDetail = CompanyMemberSummary & { jobs: CompanyMemberJob[] };

export function useCompanyMemberDetail(memberId: number) {
  return useQuery({
    queryKey: ['admin', 'members', 'companies', memberId],
    queryFn: () => adminGet<CompanyMemberDetail>(`/api/v1/admin/members/companies/${memberId}`),
    enabled: !isBackendPending && Number.isInteger(memberId),
  });
}
