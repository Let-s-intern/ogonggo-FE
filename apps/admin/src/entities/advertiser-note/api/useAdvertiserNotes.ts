import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ADVERTISER_NOTES_PATH,
  adminAdvertiserNotesPath,
  type AdminAdvertiserNoteRequest,
  type AdminAdvertiserNoteResponse,
} from '@ogonggo/api/src/advertiser-notes';
import { adminDelete, adminGet, adminWrite } from '@/shared/api/adminClient';

export type AdvertiserNote = AdminAdvertiserNoteResponse;

/**
 * 광고주 어드민 메모(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/advertiser-notes`)로 MSW 목을
 * 부른다. 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "어드민 메모".
 */
const listKey = (advertiserId: number) => ['admin', 'advertiser-notes', advertiserId] as const;

/** 광고주 한 곳의 메모. 최신순으로 온다. */
export function useAdvertiserNotes(advertiserId: number) {
  return useQuery({
    queryKey: listKey(advertiserId),
    queryFn: () => adminGet<AdvertiserNote[]>(adminAdvertiserNotesPath(advertiserId)),
    enabled: Number.isInteger(advertiserId),
  });
}

/** 등록과 수정. 쓴 사람은 서버가 관리자 토큰에서 정한다. */
export function useSaveAdvertiserNote(advertiserId: number, noteId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminAdvertiserNoteRequest) =>
      noteId === null
        ? adminWrite<AdvertiserNote>('POST', adminAdvertiserNotesPath(advertiserId), input)
        : adminWrite<AdvertiserNote>('PATCH', `${ADMIN_ADVERTISER_NOTES_PATH}/${noteId}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey(advertiserId) }),
  });
}

export function useDeleteAdvertiserNote(advertiserId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: number) => adminDelete(`${ADMIN_ADVERTISER_NOTES_PATH}/${noteId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey(advertiserId) }),
  });
}
