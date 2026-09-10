import { useQuery } from '@tanstack/react-query';
import type {
  CompanyMemberSummary,
  UserMemberSummary,
} from '@ogonggo/api/src/mocks/fixtures/admin-member';
import type { JobReviewStatus, Visibility } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import type { UserMemberActivity } from '@ogonggo/api/src/mocks/fixtures/admin-member-activity';
import { adminGet, type PageResponse } from '@/shared/api/adminClient';

export interface MemberListFilters {
  page: number;
  keyword: string;
  status: string;
  joinedWithinDays: string;
}

export function useUserMemberList(filters: MemberListFilters) {
  return useQuery({
    queryKey: ['admin', 'members', 'users', filters],
    queryFn: () =>
      adminGet<PageResponse<UserMemberSummary>>('/api/v1/admin/members/users', { ...filters }),
  });
}

/** 상세는 기본 정보에 북마크와 작성 글을 함께 준다. */
export type UserMemberDetail = UserMemberSummary & UserMemberActivity;

export function useUserMemberDetail(memberId: number) {
  return useQuery({
    queryKey: ['admin', 'members', 'users', memberId],
    queryFn: () => adminGet<UserMemberDetail>(`/api/v1/admin/members/users/${memberId}`),
    enabled: Number.isInteger(memberId),
  });
}

export function useCompanyMemberList(filters: MemberListFilters) {
  return useQuery({
    queryKey: ['admin', 'members', 'companies', filters],
    queryFn: () =>
      adminGet<PageResponse<CompanyMemberSummary>>('/api/v1/admin/members/companies', {
        ...filters,
      }),
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
    enabled: Number.isInteger(memberId),
  });
}
