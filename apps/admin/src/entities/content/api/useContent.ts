import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminBootcampDetail,
  AdminBootcampSummary,
  AdminJobDetail,
  AdminJobSummary,
  AdminSideStudy,
} from '@ogonggo/api/src/mocks/fixtures/admin-content';
import type {
  AdminBootcampPatchRequest,
  AdminJobPatchRequest,
} from '@ogonggo/api/src/mocks/admin/content';
import { adminDelete, adminGet, adminWrite, type PageResponse } from '@/shared/api/adminClient';

/**
 * 콘텐츠 목록·상세 조회.
 *
 * 백엔드 어드민 API 가 아직 없어 응답 타입을 MSW 픽스처가 내보내는 것에서 가져온다 — 그 타입이
 * 지금은 계약 그 자체다. 백엔드가 생기면 orval 생성 타입으로 갈아끼우고 이 import 를 지운다.
 *
 * 쿼리 키에 필터를 통째로 넣는다. 필터를 바꿀 때마다 새 키가 되므로 이전 결과가 섞이지 않고,
 * 뒤로 가기로 돌아오면 캐시가 그대로 뜬다.
 */

export interface JobListFilters {
  page: number;
  keyword: string;
  visibility: string;
  source: string;
  reviewStatus: string;
  sort: string;
}

export function useJobList(filters: JobListFilters) {
  return useQuery({
    queryKey: ['admin', 'jobs', filters],
    queryFn: () => adminGet<PageResponse<AdminJobSummary>>('/api/v1/admin/jobs', { ...filters }),
  });
}

export function useJobDetail(jobId: number) {
  return useQuery({
    queryKey: ['admin', 'jobs', jobId],
    queryFn: () => adminGet<AdminJobDetail>(`/api/v1/admin/jobs/${jobId}`),
    // NaN 이 들어오면 요청을 보내지 않는다. 주소창에 숫자가 아닌 id 가 들어온 경우다.
    enabled: Number.isInteger(jobId),
  });
}

export interface BootcampListFilters {
  page: number;
  keyword: string;
  status: string;
  sort: string;
}

export function useBootcampList(filters: BootcampListFilters) {
  return useQuery({
    queryKey: ['admin', 'bootcamps', filters],
    queryFn: () =>
      adminGet<PageResponse<AdminBootcampSummary>>('/api/v1/admin/bootcamps', { ...filters }),
  });
}

export function useBootcampDetail(bootcampId: number) {
  return useQuery({
    queryKey: ['admin', 'bootcamps', bootcampId],
    queryFn: () => adminGet<AdminBootcampDetail>(`/api/v1/admin/bootcamps/${bootcampId}`),
    enabled: Number.isInteger(bootcampId),
  });
}

export interface SideStudyListFilters {
  page: number;
  keyword: string;
  kind: string;
  sort: string;
}

export function useSideStudyList(filters: SideStudyListFilters) {
  return useQuery({
    queryKey: ['admin', 'side-studies', filters],
    queryFn: () =>
      adminGet<PageResponse<AdminSideStudy>>('/api/v1/admin/side-studies', { ...filters }),
  });
}

export function useSideStudyDetail(postId: number) {
  return useQuery({
    queryKey: ['admin', 'side-studies', postId],
    queryFn: () => adminGet<AdminSideStudy>(`/api/v1/admin/side-studies/${postId}`),
    enabled: Number.isInteger(postId),
  });
}

/**
 * 채용공고의 운영 값(노출·등록 경로·검수 상태)을 고친다.
 *
 * 목록과 대시보드가 같은 값을 세고 있으므로 함께 무효화한다. 상세만 갱신하면 목록으로 돌아갔을
 * 때 예전 상태가 보인다.
 */
export function usePatchJob(jobId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminJobPatchRequest) =>
      adminWrite<AdminJobDetail>('PATCH', `/api/v1/admin/jobs/${jobId}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    },
  });
}

export type { AdminBootcampPatchRequest, AdminJobPatchRequest };

/** 부트캠프의 제목·본문·노출을 고친다. */
export function usePatchBootcamp(bootcampId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminBootcampPatchRequest) =>
      adminWrite<AdminBootcampDetail>('PATCH', `/api/v1/admin/bootcamps/${bootcampId}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bootcamps'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    },
  });
}

/**
 * 콘텐츠 삭제.
 *
 * 성공하면 그 콘텐츠의 캐시를 지우고 목록을 다시 받는다. 남겨 두면 뒤로 가기로 돌아왔을 때
 * 없는 글의 상세가 캐시에서 그려진다.
 */
export function useDeleteContent(kind: 'jobs' | 'bootcamps' | 'side-studies') {
  const queryClient = useQueryClient();
  const queryKey = kind === 'side-studies' ? 'side-studies' : kind;
  return useMutation({
    mutationFn: (id: number) => adminDelete(`/api/v1/admin/${kind}/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', queryKey] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rejections'] });
    },
  });
}
