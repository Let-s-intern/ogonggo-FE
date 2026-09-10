import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notice } from '@ogonggo/api/src/mocks/fixtures/admin-notice';
import { adminGet, adminWrite } from '@/shared/api/adminClient';

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
