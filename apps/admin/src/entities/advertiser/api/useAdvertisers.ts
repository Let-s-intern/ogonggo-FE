import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ADVERTISERS_PATH,
  type AdminAdvertiserResponse,
  type AdvertiserType,
  type CreateAdminAdvertiserRequest,
  type UpdateAdminAdvertiserRequest,
} from '@ogonggo/api/src/advertisers';
import { adminGet, adminWrite } from '@/shared/api/adminClient';

export type Advertiser = AdminAdvertiserResponse;
export type AdvertiserInput = CreateAdminAdvertiserRequest;

/**
 * 광고주(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/advertisers`)로 MSW 목을 부른다.
 * 백엔드 배포 뒤 코드젠으로 바꾼다. 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "광고주".
 */
const LIST_KEY = ['admin', 'advertisers'] as const;

/**
 * 비즈니스 회원·광고 문의 기업·직접 더한 기업을 합친 목록. 검색어와 회원·비회원으로 좁힌다. 입력하는 동안 앞 결과를
 * 들고 있는다. 행마다 배너·광고 공고 수가 붙는다.
 */
export function useAdvertiserList(keyword: string, type: AdvertiserType | '' = '') {
  return useQuery({
    queryKey: [...LIST_KEY, keyword, type],
    queryFn: () => adminGet<Advertiser[]>(ADMIN_ADVERTISERS_PATH, { keyword, type }),
    placeholderData: keepPreviousData,
  });
}

/** 광고주 한 건(광고주별 광고 상세). 목록과 같은 키 아래에 두어 쓰기 뒤 함께 다시 받는다. */
export function useAdvertiserDetail(advertiserId: number) {
  return useQuery({
    queryKey: [...LIST_KEY, 'detail', advertiserId],
    queryFn: () => adminGet<Advertiser>(`${ADMIN_ADVERTISERS_PATH}/${advertiserId}`),
    enabled: Number.isInteger(advertiserId),
  });
}

/** 비회원 광고주 수정. 회원 광고주는 서버가 거절한다(회원 정보를 따른다). */
export function useUpdateAdvertiser(advertiserId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdminAdvertiserRequest) =>
      adminWrite<Advertiser>('PATCH', `${ADMIN_ADVERTISERS_PATH}/${advertiserId}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

/** 비회원 광고주를 더한다. 더한 뒤 목록을 다시 받는다. */
export function useCreateAdvertiser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvertiserInput) =>
      adminWrite<Advertiser>('POST', ADMIN_ADVERTISERS_PATH, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}
