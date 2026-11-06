import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_INSTAGRAM_ACCOUNTS_PATH,
  ADMIN_INSTAGRAM_ADS_PATH,
  ADMIN_INSTAGRAM_FORMATS_PATH,
  type AdminInstagramAccountRequest,
  type AdminInstagramAccountResponse,
  type AdminInstagramAdRequest,
  type AdminInstagramAdResponse,
  type AdminInstagramFormatRequest,
  type AdminInstagramFormatResponse,
  type UpdateAdminInstagramAdRequest,
  type UpdateAdminInstagramFormatRequest,
} from '@ogonggo/api/src/instagram';
import { adminDelete, adminGet, adminWrite } from '@/shared/api/adminClient';

export type InstagramAccount = AdminInstagramAccountResponse;
export type InstagramAccountInput = AdminInstagramAccountRequest;
export type InstagramFormat = AdminInstagramFormatResponse;
export type InstagramFormatInput = AdminInstagramFormatRequest;
export type InstagramAd = AdminInstagramAdResponse;
export type InstagramAdInput = AdminInstagramAdRequest;

/**
 * 인스타그램 광고(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/instagram`)로 MSW 목을 부른다.
 * 계약은 `.claude/tasks/memos/백엔드-요청-인스타-광고-2026-11-06.md`.
 *
 * 쓰기 뒤에는 인스타 키 전부를 다시 받는다. 계정·유형 응답에 광고 수가 붙고, 광고 응답에 계정·유형 이름이 붙어 서로 낡는다.
 * 광고 쓰기는 계약의 이어 둔 수도 바꾸므로 광고주 키(계약이 그 아래에 있다)와 캘린더도 비운다.
 */
const ROOT = ['admin', 'instagram'] as const;

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'advertisers'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ad-calendar'] }),
    ]);
}

/** 계정 전부(사용 안 함 포함). 등록 순. */
export function useInstagramAccounts() {
  return useQuery({
    queryKey: [...ROOT, 'accounts'],
    queryFn: () => adminGet<InstagramAccount[]>(ADMIN_INSTAGRAM_ACCOUNTS_PATH),
  });
}

/** 등록과 수정. 수정도 폼이 모든 칸을 들고 있어 모두 보낸다. 표의 사용 스위치는 `enabled` 만 보낸다. */
export function useSaveInstagramAccount(accountId: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: Partial<InstagramAccountInput>) =>
      accountId === null
        ? adminWrite<InstagramAccount>('POST', ADMIN_INSTAGRAM_ACCOUNTS_PATH, input)
        : adminWrite<InstagramAccount>(
            'PATCH',
            `${ADMIN_INSTAGRAM_ACCOUNTS_PATH}/${accountId}`,
            input,
          ),
    onSuccess: invalidate,
  });
}

/** 삭제. 광고가 잡힌 계정은 서버가 거절한다. */
export function useDeleteInstagramAccount() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (accountId: number) => adminDelete(`${ADMIN_INSTAGRAM_ACCOUNTS_PATH}/${accountId}`),
    onSuccess: invalidate,
  });
}

/** 게재 유형 전부(사용 안 함 포함). 순서대로 온다. */
export function useInstagramFormats() {
  return useQuery({
    queryKey: [...ROOT, 'formats'],
    queryFn: () => adminGet<InstagramFormat[]>(ADMIN_INSTAGRAM_FORMATS_PATH),
  });
}

export function useSaveInstagramFormat(formatId: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: UpdateAdminInstagramFormatRequest) =>
      formatId === null
        ? adminWrite<InstagramFormat>('POST', ADMIN_INSTAGRAM_FORMATS_PATH, input)
        : adminWrite<InstagramFormat>(
            'PATCH',
            `${ADMIN_INSTAGRAM_FORMATS_PATH}/${formatId}`,
            input,
          ),
    onSuccess: invalidate,
  });
}

/** 순서를 통째로 바꾼다. 유형 id 를 빠짐없이 새 순서대로 보낸다. */
export function useReorderInstagramFormats() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (formatIds: number[]) =>
      adminWrite<InstagramFormat[]>('PUT', `${ADMIN_INSTAGRAM_FORMATS_PATH}/order`, { formatIds }),
    onSuccess: invalidate,
  });
}

export function useDeleteInstagramFormat() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (formatId: number) => adminDelete(`${ADMIN_INSTAGRAM_FORMATS_PATH}/${formatId}`),
    onSuccess: invalidate,
  });
}

/** 인스타 광고 목록의 서버 거르기. 비운 칸은 보내지 않는다. */
export interface InstagramAdQuery {
  /** `YYYY-MM`. 그달과 겹치는 광고. */
  month?: string;
  advertiserId?: number;
  contractId?: number;
}

/** 인스타 광고 목록. 게시 예정일이 이른 것이 먼저다. */
export function useInstagramAds(query: InstagramAdQuery, enabled = true) {
  return useQuery({
    queryKey: [...ROOT, 'ads', query],
    queryFn: () => adminGet<InstagramAd[]>(ADMIN_INSTAGRAM_ADS_PATH, { ...query }),
    enabled,
  });
}

/** 등록과 수정. 수정도 폼이 모든 칸을 들고 있어 모두 보낸다. */
export function useSaveInstagramAd(adId: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: InstagramAdInput) =>
      adId === null
        ? adminWrite<InstagramAd>('POST', ADMIN_INSTAGRAM_ADS_PATH, input)
        : adminWrite<InstagramAd>('PATCH', `${ADMIN_INSTAGRAM_ADS_PATH}/${adId}`, input),
    onSuccess: invalidate,
  });
}

/** 몇 칸만 고친다. 표의 상태·날짜·게시물 주소 바로 고치기가 쓴다. */
export function usePatchInstagramAd(adId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (changes: UpdateAdminInstagramAdRequest) =>
      adminWrite<InstagramAd>('PATCH', `${ADMIN_INSTAGRAM_ADS_PATH}/${adId}`, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteInstagramAd() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (adId: number) => adminDelete(`${ADMIN_INSTAGRAM_ADS_PATH}/${adId}`),
    onSuccess: invalidate,
  });
}
