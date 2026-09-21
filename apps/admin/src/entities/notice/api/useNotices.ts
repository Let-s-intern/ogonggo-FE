import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notice } from '@ogonggo/api/src/mocks/fixtures/admin-notice';
// 공지 API 는 백엔드에 없고 MSW 목에만 있다. 그래서 생성 함수가 아니라 `adminClient` 로 부르고,
// 실서버 모드에서는 아예 부르지 않는다 — 화면이 안내를 대신 그린다(`@/shared/config/backendPending`).
import { adminGet, adminWrite } from '@/shared/api/adminClient';
import { isBackendPending } from '@/shared/config/backendPending';

export interface NoticeWriteInput {
  title: string;
  content: string;
  publicationStartAt: string;
  publicationEndAt?: string;
  pinned: boolean;
  active: boolean;
}

/** 저장 응답. 고정을 옮기면서 풀린 공지의 제목이 함께 온다. */
export interface NoticeWriteResult {
  notice: Notice;
  unpinnedNoticeTitle: string | null;
}

export function useNoticeList() {
  return useQuery({
    queryKey: ['admin', 'notices'],
    queryFn: () => adminGet<Notice[]>('/api/v1/admin/notices'),
    enabled: !isBackendPending,
  });
}

export function useSaveNotice(noticeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoticeWriteInput) =>
      noticeId === null
        ? adminWrite<NoticeWriteResult>('POST', '/api/v1/admin/notices', input)
        : adminWrite<NoticeWriteResult>('PUT', `/api/v1/admin/notices/${noticeId}`, input),
    onSuccess: () => {
      // 고정을 옮기면 다른 공지도 바뀌므로 목록 전체를 다시 받는다.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}
