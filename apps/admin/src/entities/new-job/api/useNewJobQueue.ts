import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  deleteJobInspection,
  getJob,
  listJobs,
  replaceJobAnalysis,
  replaceJobInspection,
  updateJob,
  type AdminJobDetailResponse,
  type AdminJobDetailResponseVisibility as Visibility,
  type AdminJobSummaryResponse,
  type Analysis,
  type ListJobsParams,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';
import { withKstOffset } from '@/shared/lib/kstDateTime';

export type NewJob = AdminJobSummaryResponse;
export type NewJobDetail = AdminJobDetailResponse;

/**
 * 오늘 올라온 공고(LC-3567). 오늘(KST 달력 날짜) 등록된 크롤러·고용24 공고다. 자정이 지나면 새 날짜로 다시 받는다.
 *
 * 검수 완료 표시·해제, 분석 수정, 상세의 `inspectedAt`·`analysis`·`analysisCurrent`·`analysisEditedAt`, 목록의
 * `registeredFrom`·`registeredTo`·`inspected`, 수정의 `sourceHtml` 은 생성 모델과 생성 함수
 * (`replaceJobInspection`·`deleteJobInspection`·`replaceJobAnalysis`)를 쓴다. 백엔드는 빈 칸을 null 로 주는데 생성
 * 모델은 선택 칸이라, 화면은 null 과 빈 칸을 같이 다룬다.
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

/**
 * 시각의 KST 날짜. 백엔드 등록 시각은 시간대 없는 한국 시간이라 `+09:00` 으로 읽는다(`withKstOffset`). 브라우저
 * 시간대로 읽으면 한국 밖에서 날짜가 어긋난다.
 */
export const kstDate = (dateTime: string): string =>
  new Date(Date.parse(withKstOffset(dateTime)) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** 지금의 오프셋 없는 KST date-time. 백엔드가 주는 시각과 같은 모양이다. */
export const kstNow = (): string =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);

/**
 * 한 등록 경로의 그날 공고. 등록일 필터를 보내되, 받은 것을 여기서도 날짜로 거른다. 이 거르기는 필터를 모르는
 * 백엔드를 위한 대비일 뿐이다.
 *
 * 필터는 KST 날짜(`YYYY-MM-DD`)이고 두 날짜를 포함한다. 그날 하루는 두 칸에 같은 날짜를 보낸다. 필터를 모르는
 * 백엔드라도 정렬이 등록일 역순이라 그날보다 앞선 공고가 나오면 거기서 멈추면 된다.
 */
async function fetchSource(source: (typeof SOURCES)[number], date: string): Promise<NewJob[]> {
  const items: NewJob[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const params: ListJobsParams = {
      source,
      sort: 'REGISTERED_AT',
      registeredFrom: date,
      registeredTo: date,
      page,
      size: PAGE_SIZE,
    };
    const data = await unwrapData(listJobs(params));
    const rows = data?.items ?? [];
    items.push(...rows.filter((row) => kstDate(row.registeredAt) === date));
    const reachedOlder = rows.some((row) => kstDate(row.registeredAt) < date);
    if (!data || reachedOlder || page >= data.pageInfo.totalPages) {
      break;
    }
  }
  return items;
}

/** 오늘의 KST 날짜(`YYYY-MM-DD`). */
export const kstToday = (): string => kstDate(new Date().toISOString());

/** 다음 KST 자정까지 남은 시간(ms). */
const msUntilKstMidnight = (): number => {
  const kst = Date.now() + 9 * 60 * 60 * 1000;
  const day = 24 * 60 * 60 * 1000;
  return day - (kst % day);
};

/**
 * 오늘(KST) 날짜. 화면을 켜 둔 채 자정이 지나면 바뀐다 — 자정에 맞춘 타이머, 창에 다시 포커스가 올 때, 탭이 다시
 * 보일 때 다시 잰다(잠자기에서 깨어나면 타이머가 늦을 수 있다).
 */
export function useKstToday(): string {
  const [today, setToday] = useState(kstToday);
  useEffect(() => {
    const refresh = () => setToday(kstToday());
    const timer = window.setTimeout(refresh, msUntilKstMidnight() + 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [today]);
  return today;
}

/**
 * 그날(`date`, KST `YYYY-MM-DD`)의 대상 목록. 등록 시각 역순이다. 날짜가 키에 들어 있어 자정이 지나면
 * (`useKstToday`) 새 날짜로 받는다.
 *
 * 같은 날 안에서는 `staleTime` 을 무한으로 둔다(검수 대기 `useReviewQueue` 와 같다). 다시 받으면 같은 날 안의 순서가
 * 바뀌어 보던 위치가 흔들린다. 동작이 성공하면 그 건만 캐시에서 고친다(`patchQueueItem`). 그날 새로 올라온 공고는
 * 새로고침하면 보인다.
 */
export function useNewJobQueue(date: string) {
  return useQuery(newJobQueueQuery(date));
}

/**
 * 그날 목록의 쿼리. 화면(`useNewJobQueue`)과 AI 비서의 오늘 공고 목록(`list_today_review_jobs`)이 같은 캐시를 읽어
 * 건수가 어긋나지 않는다.
 */
export const newJobQueueQuery = (date: string) => ({
  queryKey: [...QUEUE_KEY, date],
  queryFn: async (): Promise<NewJobQueue> => {
    // 오늘 등록분만 본다(2026-11-04 사용자). 전에는 크롤러 공고 중 가장 늦은 등록일을 기준으로 삼아, 수집이
    // 없는 날에도 전날 공고가 남았다.
    const lists = await Promise.all(SOURCES.map((source) => fetchSource(source, date)));
    const items = lists
      .flat()
      .sort(
        (a, b) =>
          Date.parse(withKstOffset(b.registeredAt)) - Date.parse(withKstOffset(a.registeredAt)),
      );
    return { date, items };
  },
  staleTime: Number.POSITIVE_INFINITY,
});

/** 큐의 한 건만 고친다. 목록을 다시 받지 않는다. 날짜마다 캐시가 따로라 모두 고친다. */
export function patchQueueItem(queryClient: QueryClient, jobId: number, patch: Partial<NewJob>) {
  queryClient.setQueriesData<NewJobQueue>({ queryKey: QUEUE_KEY }, (queue) =>
    queue
      ? {
          ...queue,
          items: queue.items.map((item) => (item.id === jobId ? { ...item, ...patch } : item)),
        }
      : queue,
  );
}

const detailQuery = (jobId: number) => ({
  // 채용공고 상세(`useJobDetail`)와 같은 키다. 상세에서 고친 값이 그대로 이어지고, 수정 저장이 `['admin',
  // 'jobs']` 를 무효화하면 이 화면도 다시 받는다.
  queryKey: ['admin', 'jobs', jobId],
  queryFn: () => unwrapData(getJob(jobId)),
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

/**
 * 검수 완료 표시·해제(`replaceJobInspection`·`deleteJobInspection`). 요청 본문이 없고 응답 `data` 는 null 이다.
 * 노출 상태는 바꾸지 않는다.
 *
 * 응답에 시각이 없어 완료 시각은 지금으로 적어 두고, 상세는 다시 받아 서버 시각으로 맞춘다.
 */
export function useSetJobInspected() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, inspected }: { jobId: number; inspected: boolean }) =>
      setJobInspected(queryClient, jobId, inspected),
  });
}

/**
 * 검수 완료 표시·해제를 저장하고 캐시를 맞춘다. 화면의 체크(`useSetJobInspected`)와 AI 비서의 `mark_inspected` 가
 * 같이 쓴다 — 비서가 체크해도 화면에 그대로 보인다.
 */
export async function setJobInspected(queryClient: QueryClient, jobId: number, inspected: boolean) {
  if (inspected) {
    await replaceJobInspection(jobId);
  } else {
    await deleteJobInspection(jobId);
  }
  patchQueueItem(queryClient, jobId, {
    inspectedAt: inspected ? kstNow() : undefined,
  });
  void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
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

/**
 * 원문 HTML 을 저장했는데 응답에 반영되지 않았다. 원문 칸을 모르는 옛 백엔드는 모르는 칸을 버리고 200 을 준다 —
 * 성공으로 보이면 운영자는 고친 줄 안다.
 */
export class SourceHtmlNotSavedError extends Error {}

/**
 * 이 상세를 준 백엔드가 원문 HTML 저장을 받는지. 원문 저장은 검수 칸(`inspectedAt`)과 같은 배포에 들어 있어, 상세에
 * 그 칸이 없으면 옛 백엔드다. 검수 칸은 비어도 null 로 온다.
 */
export const supportsSourceHtmlEdit = (job: NewJobDetail): boolean => 'inspectedAt' in job;

/**
 * 원문 HTML 고치기. 같은 `PATCH /api/v1/admin/jobs/{jobId}` 에 `sourceHtml` 을 싣는다. 백엔드는 걸러서 저장하고
 * 비울 수 없다(공백이면 400 `[sourceHtml]`). 원문만 고치면 분석은 낡지 않는다.
 *
 * 응답의 상세로 저장됐는지 확인한다. 검수 칸이 없으면(옛 백엔드) 또는 원문이 저장 전과 같으면 실패로 돌린다.
 */
export function useSetJobSourceHtml() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      sourceHtml,
      previous,
    }: {
      jobId: number;
      sourceHtml: string;
      /** 저장 전 원문. 응답의 원문이 이것과 같으면 저장되지 않은 것이다. */
      previous: string;
    }) => {
      const detail = await unwrapData(updateJob(jobId, { sourceHtml }));
      if (!detail || !supportsSourceHtmlEdit(detail)) {
        throw new SourceHtmlNotSavedError(
          '원문이 저장되지 않았습니다. 지금 백엔드는 원문 HTML 저장을 받지 않습니다.',
        );
      }
      if ((detail.sourceHtml ?? '') === previous) {
        throw new SourceHtmlNotSavedError(
          '원문이 저장되지 않았습니다. 저장 뒤에도 원문이 그대로입니다 — 걸러지는 태그만 고쳤는지 확인해 주세요.',
        );
      }
      return detail;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] }),
  });
}

/**
 * 운영자 분석 수정(`PUT /api/v1/admin/jobs/{jobId}/analysis`, `replaceJobAnalysis`). 본문은 분석 전체이고 응답은
 * 바뀐 상세다. 지금 본문 기준으로 저장돼 바로 사용자에게 보이고, 본문이 바뀌기 전까지 AI 가 덮어쓰지 않는다.
 */
export function useSaveJobAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, analysis }: { jobId: number; analysis: Analysis }) =>
      unwrapData(replaceJobAnalysis(jobId, analysis)),
    onSuccess: (detail, { jobId }) => {
      queryClient.setQueryData(['admin', 'jobs', jobId], detail);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
  });
}
