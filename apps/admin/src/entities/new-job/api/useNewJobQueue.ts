import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  getJob,
  listJobs,
  updateJob,
  type AdminJobDetailResponseVisibility as Visibility,
  type ListJobsParams,
} from '@ogonggo/api/src/admin';
import type {
  AdminJobDetailWithInspection,
  AdminJobSummaryWithInspection,
} from '@ogonggo/api/src/mocks/admin/inspection';
import { adminDelete, adminWrite } from '@/shared/api/adminClient';
import { unwrapData } from '@/shared/api/unwrapData';

export type NewJob = AdminJobSummaryWithInspection;
export type NewJobDetail = AdminJobDetailWithInspection;

/**
 * 오늘 올라온 공고(LC-3567). 오늘(KST 달력 날짜) 등록된 크롤러·고용24 공고다. 자정이 지나면 전날 공고는 빠진다.
 *
 * 검수 완료 표시·해제, 상세의 `inspectedAt`·`analysis`·`analysisCurrent`, 목록의 `registeredFrom`·`registeredTo`
 * 는 백엔드에 아직 없다(PRD `prd-admin-today-job-review.md` "백엔드 요청" 1~3). 타입은 목의 계약
 * (`@ogonggo/api/src/mocks/admin/inspection`)에서 가져오고, 검수 완료는 `adminClient` 로 부른다. 코드젠 뒤 생성
 * 모델과 생성 함수로 바꾼다.
 */

export interface NewJobQueue {
  /** 목록을 받은 날(KST `YYYY-MM-DD`). */
  date: string;
  items: NewJob[];
}

const QUEUE_KEY = ['admin', 'new-jobs', 'queue'] as const;

/** 목록 API 의 페이지 크기 상한(백엔드 `validatePageRequest`). */
const PAGE_SIZE = 100;
/** 하루치에서 읽을 최대 쪽 수. 크롤러 하루 수집분이 수백 건을 넘지 않는다. */
const MAX_PAGES = 10;

/** 비즈니스 회원 공고는 넣지 않는다. 검수 대기에서 사전 승인을 거쳤다(PRD 결정 필요 3). */
const SOURCES = ['CRAWLER', 'WORK24'] as const;

/** 등록 시각의 KST 날짜. */
export const kstDate = (iso: string): string =>
  new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const nextDate = (date: string): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/**
 * 한 등록 경로의 그날 공고. 등록일 필터(백엔드 요청 3)를 보내되, 받은 것을 여기서도 날짜로 거른다.
 *
 * 지금 배포된 백엔드는 이 필터를 모르고 무시한다. 그래도 정렬이 등록일 역순이라 그날보다 앞선 공고가 나오면
 * 거기서 멈추면 된다. 필터가 생기면 첫 쪽에서 끝난다.
 */
async function fetchSource(source: (typeof SOURCES)[number], date: string): Promise<NewJob[]> {
  const items: NewJob[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const params = {
      source,
      sort: 'REGISTERED_AT',
      registeredFrom: `${date}T00:00:00+09:00`,
      registeredTo: `${nextDate(date)}T00:00:00+09:00`,
      page,
      size: PAGE_SIZE,
    } as ListJobsParams;
    const data = await unwrapData(listJobs(params));
    const rows = (data?.items ?? []) as NewJob[];
    items.push(...rows.filter((row) => kstDate(row.registeredAt) === date));
    const reachedOlder = rows.some((row) => kstDate(row.registeredAt) < date);
    if (!data || reachedOlder || page >= data.pageInfo.totalPages) {
      break;
    }
  }
  return items;
}

/**
 * 대상 목록. 등록 시각 역순이다.
 *
 * `staleTime` 을 무한으로 둔다(검수 대기 `useReviewQueue` 와 같다). 다시 받으면 같은 날 안의 순서가 바뀌어 보던
 * 위치가 흔들린다. 동작이 성공하면 그 건만 캐시에서 고친다(`patchQueueItem`).
 */
export function useNewJobQueue() {
  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: async (): Promise<NewJobQueue> => {
      // 오늘 등록분만 본다(2026-11-04 사용자). 전에는 크롤러 공고 중 가장 늦은 등록일을 기준으로 삼아, 수집이
      // 없는 날에도 전날 공고가 남았다.
      const date = kstDate(new Date().toISOString());
      const lists = await Promise.all(SOURCES.map((source) => fetchSource(source, date)));
      const items = lists
        .flat()
        .sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt));
      return { date, items };
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/** 큐의 한 건만 고친다. 목록을 다시 받지 않는다. */
export function patchQueueItem(queryClient: QueryClient, jobId: number, patch: Partial<NewJob>) {
  queryClient.setQueryData<NewJobQueue>(QUEUE_KEY, (queue) =>
    queue
      ? {
          ...queue,
          items: queue.items.map((item) => (item.id === jobId ? { ...item, ...patch } : item)),
        }
      : queue,
  );
}

/** 처음부터 다시 받는다. 새 공고가 올라왔는지 볼 때 쓴다. */
export function useReloadNewJobQueue() {
  const queryClient = useQueryClient();
  return () => queryClient.resetQueries({ queryKey: QUEUE_KEY });
}

const detailQuery = (jobId: number) => ({
  // 채용공고 상세(`useJobDetail`)와 같은 키다. 상세에서 고친 값이 그대로 이어지고, 수정 저장이 `['admin',
  // 'jobs']` 를 무효화하면 이 화면도 다시 받는다.
  queryKey: ['admin', 'jobs', jobId],
  queryFn: async () => (await unwrapData(getJob(jobId))) as NewJobDetail | undefined,
});

/** 검수할 공고의 상세(분류, 썸네일, 본문, 원문, 분석). */
export function useNewJobDetail(jobId: number | undefined) {
  return useQuery({
    ...detailQuery(jobId ?? 0),
    enabled: jobId !== undefined,
  });
}

/** 다음 건을 미리 받는다. A/D 로 넘길 때 기다리지 않게 한다. */
export function usePrefetchNewJobDetail() {
  const queryClient = useQueryClient();
  return (jobId: number) => void queryClient.prefetchQuery(detailQuery(jobId));
}

const inspectionPath = (jobId: number) => `/api/v1/admin/jobs/${jobId}/inspection`;

/**
 * 검수 완료 표시·해제(백엔드 요청 1). 노출 상태는 바꾸지 않는다.
 *
 * 응답 본문이 없어 완료 시각은 지금으로 적어 두고, 상세는 다시 받아 서버 시각으로 맞춘다.
 */
export function useSetJobInspected() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, inspected }: { jobId: number; inspected: boolean }) => {
      if (inspected) {
        await adminWrite('PUT', inspectionPath(jobId), undefined);
      } else {
        await adminDelete(inspectionPath(jobId));
      }
    },
    onSuccess: (_, { jobId, inspected }) => {
      patchQueueItem(queryClient, jobId, {
        inspectedAt: inspected ? new Date().toISOString() : null,
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
  });
}

/**
 * 노출·비노출(`PATCH /api/v1/admin/jobs/{jobId}` 의 `visibility`). 되돌리기가 지금 보는 건이 아닌 공고에도
 * 보내야 해서 `usePatchJob` 대신 공고 id 를 인자로 받는다. 무효화하는 키는 `usePatchJob` 과 같다.
 */
export function useSetJobVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, visibility }: { jobId: number; visibility: Visibility }) =>
      unwrapData(updateJob(jobId, { visibility })),
    onSuccess: (_, { jobId, visibility }) => {
      patchQueueItem(queryClient, jobId, { visibility });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}
