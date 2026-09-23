import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNotice,
  deleteNotice,
  getNotice,
  listNotices,
  updateNotice,
  type AdminNoticeDetailResponse,
  type AdminNoticeSummaryResponse,
  type CreateAdminNoticeRequestVisibility,
} from '@ogonggo/api/src/admin';
import { textToLexical } from '@/entities/notice/lib/content';
import { unwrapData } from '@/shared/api/unwrapData';

export type NoticeSummary = AdminNoticeSummaryResponse;
export type NoticeDetail = AdminNoticeDetailResponse;
export type NoticeVisibility = CreateAdminNoticeRequestVisibility;

export interface NoticeWriteInput {
  title: string;
  /** 평문. 저장 직전에 Lexical EditorState JSON 으로 바꾼다(`../lib/content`). */
  content: string;
  pinned: boolean;
  visibility: NoticeVisibility;
}

/**
 * 공지 목록. 노출 여부와 무관하게 삭제되지 않은 공지가 오고, 고정이 먼저 그다음 최신순이다.
 *
 * 쪽이 나뉜다. 화면은 페이지만 넘기고 `keyword`·`visibility`·`pinned` 필터는 보내지 않는다 —
 * 공지는 수십 건을 넘지 않아 검색 상자를 둘 일이 없다.
 */
export function useNoticeList(page: number) {
  return useQuery({
    queryKey: ['admin', 'notices', page],
    queryFn: () => unwrapData(listNotices({ page })),
  });
}

/**
 * 공지 한 건. **목록에는 본문이 없어서** 수정 폼을 열 때 이것으로 받는다.
 *
 * 목록 행의 값으로 폼을 채우던 때와 달라진 점이다. `id` 가 없으면(새 공지) 부르지 않는다.
 */
export function useNoticeDetail(noticeId: number | null) {
  return useQuery({
    queryKey: ['admin', 'notices', 'detail', noticeId],
    queryFn: () => unwrapData(getNotice(noticeId as number)),
    enabled: noticeId !== null,
  });
}

/**
 * 새 공지 등록과 기존 공지 수정.
 *
 * 수정은 `PATCH` 라 보낸 값만 바뀌지만 폼이 네 칸을 모두 들고 있으므로 모두 보낸다. 일부만
 * 보내면 폼에서 지운 값이 서버에 남아 있는 것과 구분되지 않는다.
 */
export function useSaveNotice(noticeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoticeWriteInput) => {
      const body = {
        title: input.title,
        content: textToLexical(input.content),
        pinned: input.pinned,
        visibility: input.visibility,
      };
      return noticeId === null
        ? unwrapData(createNotice(body))
        : unwrapData(updateNotice(noticeId, body));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}

/** 삭제. 서버가 소프트 삭제하고 목록에서 사라진다. */
export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noticeId: number) => {
      await deleteNotice(noticeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}
