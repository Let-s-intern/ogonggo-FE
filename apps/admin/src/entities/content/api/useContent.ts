import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteBootcamp,
  deleteJob,
  getBootcamp,
  getConcern,
  getJob,
  listBootcamps,
  listConcerns,
  listJobs,
  listRecruitmentPosts,
  updateBootcamp,
  updateBootcampVisibilities,
  updateConcernVisibilities,
  updateJob,
  updateJobVisibilities,
  updateRecruitmentPostVisibilities,
  type ChangeAdminJobVisibilityRequest,
  type ListBootcampsParams,
  type ListConcernsParams,
  type ListJobsParams,
  type ListRecruitmentPostsParams,
  type UpdateAdminBootcampRequest,
  type UpdateAdminJobRequest,
} from '@ogonggo/api/src/admin';
import type { AdminSideStudy } from '@ogonggo/api/src/mocks/fixtures/admin-content';
import { adminDelete, adminGet } from '@/shared/api/adminClient';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { unwrapData } from '@/shared/api/unwrapData';
import { isBackendPending } from '@/shared/config/backendPending';

/**
 * 콘텐츠 목록·상세 조회.
 *
 * admin 스펙의 생성 함수를 부른다. 사이드·스터디의 상세·삭제는 백엔드 API 가 없어 MSW 목에만
 * 있으므로 `adminClient` 로 부르고 픽스처의 타입을 그대로 쓴다.
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

/** 목록 API 의 페이지 크기 상한이다(백엔드 `validatePageRequest`). */
const ALL_IDS_PAGE_SIZE = 100;

/**
 * 필터에 맞는 id 를 정렬 순서대로 페이지를 넘겨 가며 `limit` 건까지 모은다. 검색 결과의 노출을
 * 한꺼번에 바꿀 때 쓴다. 페이지 번호는 필터에서 무시한다.
 */
export async function listAllIds(
  kind: VisibilityContentKind,
  filters: JobListFilters | BootcampListFilters | SideStudyListFilters | ConcernListFilters,
  limit: number,
): Promise<number[]> {
  const ids: number[] = [];
  for (let page = 1; ; page += 1) {
    const params = omitEmpty({ ...filters, page, size: ALL_IDS_PAGE_SIZE });
    const data =
      kind === 'jobs'
        ? await unwrapData(listJobs(params as ListJobsParams))
        : kind === 'bootcamps'
          ? await unwrapData(listBootcamps(params as ListBootcampsParams))
          : kind === 'concerns'
            ? await unwrapData(listConcerns(params as ListConcernsParams))
            : await unwrapData(listRecruitmentPosts(params as ListRecruitmentPostsParams));
    ids.push(...(data?.items ?? []).map((row) => row.id));
    if (!data || ids.length >= limit || page >= data.pageInfo.totalPages)
      return ids.slice(0, limit);
  }
}

export function useJobDetail(jobId: number) {
  return useQuery({
    queryKey: ['admin', 'jobs', jobId],
    queryFn: () => unwrapData(getJob(jobId)),
    // NaN 이 들어오면 요청을 보내지 않는다. 주소창에 숫자가 아닌 id 가 들어온 경우다.
    enabled: Number.isInteger(jobId),
  });
}

/**
 * 검색어가 공고 번호로 읽히면 그 숫자를, 아니면 `null`.
 *
 * 숫자로만 이뤄진 입력만 본다. `2026 상반기` 처럼 글이 섞이면 제목 검색이다. 번호는 앞자리가
 * 0 이 아닌 양의 정수라, `05` 나 `0` 은 번호가 아니라 글자로만 찾는다.
 */
export function parseJobId(keyword: string): number | null {
  const text = keyword.trim();
  if (!/^[1-9]\d*$/.test(text)) {
    return null;
  }
  const id = Number(text);
  return Number.isSafeInteger(id) ? id : null;
}

/**
 * 검색어가 공고 번호면 `GET /api/v1/admin/jobs/{id}` 로 그 공고를 찾는다.
 *
 * 목록 API 의 `keyword` 는 제목·회사명만 맞춰 번호로는 찾을 수 없다. 번호가 제목에 든 공고(예:
 * 2026)도 있으므로 목록 검색을 대신하지 않고 곁들인다.
 *
 * 없으면(404) 조용히 비운다. 이 칸에서 "찾지 못함" 은 오류가 아니라 보통의 결과이고, 기본 재시도
 * (3회)를 기다리면 목록 결과까지 그만큼 늦게 보인다. 쿼리 키가 `useJobDetail` 과 같아 상세로
 * 들어가면 캐시가 이어지고, 공고를 고치면 `['admin', 'jobs']` 무효화로 함께 다시 받아진다.
 */
export function useJobIdLookup(keyword: string) {
  const jobId = parseJobId(keyword);
  const query = useQuery({
    queryKey: ['admin', 'jobs', jobId],
    queryFn: () => unwrapData(getJob(jobId ?? 0)),
    enabled: jobId !== null,
    retry: false,
  });
  return {
    job: jobId === null ? undefined : query.data,
    /** 번호로 찾는 요청이 오가는 중. 번호가 아닌 검색어이면 항상 `false`. */
    isLookingUp: jobId !== null && query.isPending,
  };
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

export interface SideStudyListFilters {
  page: number;
  keyword: string;
  visibility: string;
  recruitmentType: string;
  recruitmentStatus: string;
  sort: string;
}

export function useSideStudyList(filters: SideStudyListFilters) {
  return useQuery({
    queryKey: ['admin', 'side-studies', filters],
    queryFn: () =>
      unwrapData(listRecruitmentPosts(omitEmpty({ ...filters }) as ListRecruitmentPostsParams)),
  });
}

// 사이드·스터디 상세와 삭제는 백엔드에 없고 MSW 목에만 있다. 그래서 `adminClient` 로 부르고,
// 실서버 모드에서는 아예 부르지 않는다 — 화면이 안내를 대신 그린다(`@/shared/config/backendPending`).
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

export interface ConcernListFilters {
  page: number;
  keyword: string;
  visibility: string;
  category: string;
  sort: string;
}

/** 취준고민 고민글 목록(`GET /api/v1/admin/concerns`). */
export function useConcernList(filters: ConcernListFilters) {
  return useQuery({
    queryKey: ['admin', 'concerns', filters],
    queryFn: () => unwrapData(listConcerns(omitEmpty({ ...filters }) as ListConcernsParams)),
  });
}

export function useConcernDetail(concernId: number) {
  return useQuery({
    queryKey: ['admin', 'concerns', concernId],
    queryFn: () => unwrapData(getConcern(concernId)),
    enabled: Number.isInteger(concernId),
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

/** 노출을 한꺼번에 바꿀 수 있는 콘텐츠. 사이드·스터디의 API 경로는 `recruitment-posts` 다. */
export type VisibilityContentKind = 'jobs' | 'bootcamps' | 'side-studies' | 'concerns';

/**
 * 여러 건의 노출을 한꺼번에 바꾼다(`PATCH /api/v1/admin/{jobs|bootcamps|recruitment-posts|concerns}/visibility`).
 *
 * 백엔드는 하나라도 바꿀 수 없으면 아무것도 바꾸지 않는다. 그래서 실패해도 목록을 다시 받을
 * 필요가 없다. 성공하면 건별 수정(`usePatchJob`)과 같은 캐시를 무효화한다.
 */
export function useChangeVisibilities(kind: VisibilityContentKind) {
  const queryClient = useQueryClient();
  return useMutation({
    // 네 요청의 본문 모양이 같다(`ids`, `visibility`). 검색 결과 전체를 고른 경우 ids 는 함수로
    // 와서 보내기 직전에 받는다 — 받는 동안도 같은 진행 중·실패 상태로 보인다.
    mutationFn: async ({
      ids,
      visibility,
    }: {
      ids: number[] | (() => Promise<number[]>);
      visibility: ChangeAdminJobVisibilityRequest['visibility'];
    }) => {
      const input = { ids: typeof ids === 'function' ? await ids() : ids, visibility };
      return unwrapData(
        kind === 'jobs'
          ? updateJobVisibilities(input)
          : kind === 'bootcamps'
            ? updateBootcampVisibilities(input)
            : kind === 'concerns'
              ? updateConcernVisibilities(input)
              : updateRecruitmentPostVisibilities(input),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', kind] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
      if (kind === 'jobs') {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      }
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
