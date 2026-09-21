import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteBootcamp,
  deleteJob,
  getBootcamp,
  getJob,
  listBootcamps,
  listJobs,
  updateBootcamp,
  updateJob,
  type ListBootcampsParams,
  type ListJobsParams,
  type UpdateAdminBootcampRequest,
  type UpdateAdminJobRequest,
} from '@ogonggo/api/src/admin';
import type { AdminSideStudy } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import { adminDelete, adminGet, type PageResponse } from '@/shared/api/adminClient';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { unwrapData } from '@/shared/api/unwrapData';
import { isBackendPending } from '@/shared/config/backendPending';

/**
 * 콘텐츠 목록·상세 조회.
 *
 * 채용공고·부트캠프는 admin 스펙의 생성 함수를 부른다. 사이드·스터디는 백엔드 API 가 없어 MSW
 * 목에만 있으므로 `adminClient` 로 부르고 픽스처의 타입을 그대로 쓴다.
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
  recruitmentStatus: string;
  sort: string;
}

export function useJobList(filters: JobListFilters) {
  return useQuery({
    queryKey: ['admin', 'jobs', filters],
    // 필터 값은 화면의 선택지에서 오므로 스펙의 enum 과 같다. 빈 값("전체") 만 뺀다.
    queryFn: () => unwrapData(listJobs(omitEmpty({ ...filters }) as ListJobsParams)),
  });
}

export function useJobDetail(jobId: number) {
  return useQuery({
    queryKey: ['admin', 'jobs', jobId],
    queryFn: () => unwrapData(getJob(jobId)),
    // NaN 이 들어오면 요청을 보내지 않는다. 주소창에 숫자가 아닌 id 가 들어온 경우다.
    enabled: Number.isInteger(jobId),
  });
}

export interface BootcampListFilters {
  page: number;
  keyword: string;
  status: string;
  visibility: string;
  source: string;
  reviewStatus: string;
  sort: string;
}

export function useBootcampList(filters: BootcampListFilters) {
  return useQuery({
    queryKey: ['admin', 'bootcamps', filters],
    queryFn: () => unwrapData(listBootcamps(omitEmpty({ ...filters }) as ListBootcampsParams)),
  });
}

export function useBootcampDetail(bootcampId: number) {
  return useQuery({
    queryKey: ['admin', 'bootcamps', bootcampId],
    queryFn: () => unwrapData(getBootcamp(bootcampId)),
    enabled: Number.isInteger(bootcampId),
  });
}

// 사이드·스터디는 백엔드에 없고 MSW 목에만 있다. 그래서 아래 두 훅과 삭제는 `adminClient` 로
// 부르고, 실서버 모드에서는 아예 부르지 않는다 — 화면이 안내를 대신 그린다
// (`@/shared/config/backendPending`). 같은 파일의 채용공고·부트캠프는 백엔드가 있어 두 모드에서
// 모두 데이터가 나온다.
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
    enabled: !isBackendPending,
  });
}

export function useSideStudyDetail(postId: number) {
  return useQuery({
    queryKey: ['admin', 'side-studies', postId],
    queryFn: () => adminGet<AdminSideStudy>(`/api/v1/admin/side-studies/${postId}`),
    enabled: !isBackendPending && Number.isInteger(postId),
  });
}

/**
 * 채용공고의 운영 값(노출·검수 상태)을 고친다.
 *
 * 목록과 대시보드가 같은 값을 세고 있으므로 함께 무효화한다. 상세만 갱신하면 목록으로 돌아갔을
 * 때 예전 상태가 보인다.
 */
export function usePatchJob(jobId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdminJobRequest) => unwrapData(updateJob(jobId, input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    },
  });
}

/** 부트캠프의 제목·본문·노출을 고친다. */
export function usePatchBootcamp(bootcampId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdminBootcampRequest) =>
      unwrapData(updateBootcamp(bootcampId, input)),
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
    mutationFn: async (id: number) => {
      if (kind === 'jobs') {
        await deleteJob(id);
      } else if (kind === 'bootcamps') {
        await deleteBootcamp(id);
      } else {
        // 사이드·스터디는 목에만 있다.
        await adminDelete(`/api/v1/admin/side-studies/${id}`);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', queryKey] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rejections'] });
    },
  });
}
