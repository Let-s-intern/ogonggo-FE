import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_AD_POSTINGS_PATH,
  type AdPostingPlacement,
  type AdminAdPostingResponse,
  type CreateAdminAdPostingRequest,
  type UpdateAdminAdPostingRequest,
} from '@ogonggo/api/src/ad-postings';
import { adminDelete, adminGet, adminWrite } from '@/shared/api/adminClient';

export type AdPosting = AdminAdPostingResponse;

/**
 * 광고 공고 세팅(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/ad-postings`)로 MSW 목을 부른다.
 * 백엔드 배포 뒤 코드젠으로 바꾼다. 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md`.
 *
 * 배너 세팅(`entities/banner/api/useBanners.ts`)과 같은 모양이다. 쓰기가 끝나면 그 자리의 목록을 다시 받는다.
 */
const listKey = (placement: AdPostingPlacement) => ['admin', 'ad-postings', placement] as const;

/** 자리 하나의 광고 전부(꺼진 것·기간이 지난 것 포함). 순서대로 온다. */
export function useAdPostingList(placement: AdPostingPlacement) {
  return useQuery({
    queryKey: listKey(placement),
    queryFn: () => adminGet<AdPosting[]>(ADMIN_AD_POSTINGS_PATH, { placement }),
  });
}

function useInvalidate(placement: AdPostingPlacement) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: listKey(placement) });
}

/** 등록. 그 자리의 맨 뒤 칸에 붙는다. */
export function useCreateAdPosting(placement: AdPostingPlacement) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (input: CreateAdminAdPostingRequest) =>
      adminWrite<AdPosting>('POST', ADMIN_AD_POSTINGS_PATH, input),
    onSuccess: invalidate,
  });
}

/** 수정(광고주·기간·켜기). 표의 켜기 스위치는 `enabled` 한 칸만 보낸다. */
export function useUpdateAdPosting(placement: AdPostingPlacement, adPostingId: number) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (input: UpdateAdminAdPostingRequest) =>
      adminWrite<AdPosting>('PATCH', `${ADMIN_AD_POSTINGS_PATH}/${adPostingId}`, input),
    onSuccess: invalidate,
  });
}

/** 자리 안 순서를 통째로 바꾼다. 그 자리의 id 를 빠짐없이 새 순서대로 보낸다. */
export function useReorderAdPostings(placement: AdPostingPlacement) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (adPostingIds: number[]) =>
      adminWrite<AdPosting[]>('PUT', `${ADMIN_AD_POSTINGS_PATH}/order`, {
        placement,
        adPostingIds,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteAdPosting(placement: AdPostingPlacement) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (adPostingId: number) => adminDelete(`${ADMIN_AD_POSTINGS_PATH}/${adPostingId}`),
    onSuccess: invalidate,
  });
}
