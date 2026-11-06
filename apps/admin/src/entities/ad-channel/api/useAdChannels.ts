import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_AD_CHANNEL_FORMATS_PATH,
  ADMIN_AD_CHANNELS_PATH,
  ADMIN_CHANNEL_ADS_PATH,
  type AdChannelPlatform,
  type AdminAdChannelFormatRequest,
  type AdminAdChannelFormatResponse,
  type AdminAdChannelRequest,
  type AdminAdChannelResponse,
  type AdminChannelAdRequest,
  type AdminChannelAdResponse,
  type UpdateAdminAdChannelFormatRequest,
  type UpdateAdminAdChannelRequest,
  type UpdateAdminChannelAdRequest,
} from '@ogonggo/api/src/ad-channels';
import { adminDelete, adminGet, adminWrite } from '@/shared/api/adminClient';

export type AdChannel = AdminAdChannelResponse;
export type AdChannelInput = AdminAdChannelRequest;
export type AdChannelFormat = AdminAdChannelFormatResponse;
export type AdChannelFormatInput = AdminAdChannelFormatRequest;
export type ChannelAd = AdminChannelAdResponse;
export type ChannelAdInput = AdminChannelAdRequest;

/**
 * 채널 광고(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/ad-channels`)로 MSW 목을 부른다.
 * 계약은 `.claude/tasks/memos/백엔드-요청-채널-광고-2026-11-06.md`.
 *
 * 쓰기 뒤에는 채널 키 전부를 다시 받는다. 채널·유형 응답에 광고 수가 붙고, 광고 응답에 채널·유형 이름이 붙어 서로 낡는다.
 * 광고 쓰기는 계약의 이어 둔 수도 바꾸므로 광고주 키(계약이 그 아래에 있다)와 캘린더도 비운다.
 */
const ROOT = ['admin', 'ad-channels'] as const;

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'advertisers'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ad-calendar'] }),
    ]);
}

/** 채널 전부(사용 안 함, 모든 플랫폼 포함). 등록 순. */
export function useAdChannels() {
  return useQuery({
    queryKey: [...ROOT, 'channels'],
    queryFn: () => adminGet<AdChannel[]>(ADMIN_AD_CHANNELS_PATH),
  });
}

/** 등록과 수정. 수정도 폼이 모든 칸을 들고 있어 모두 보낸다. 표의 사용 스위치는 `enabled` 만 보낸다. */
export function useSaveAdChannel(channelId: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: UpdateAdminAdChannelRequest) =>
      channelId === null
        ? adminWrite<AdChannel>('POST', ADMIN_AD_CHANNELS_PATH, input)
        : adminWrite<AdChannel>('PATCH', `${ADMIN_AD_CHANNELS_PATH}/${channelId}`, input),
    onSuccess: invalidate,
  });
}

/** 삭제. 광고가 잡힌 채널은 서버가 거절한다. */
export function useDeleteAdChannel() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (channelId: number) => adminDelete(`${ADMIN_AD_CHANNELS_PATH}/${channelId}`),
    onSuccess: invalidate,
  });
}

/** 게재 유형 전부(사용 안 함, 모든 플랫폼 포함). 플랫폼 순, 그 안에서 순서대로 온다. */
export function useAdChannelFormats() {
  return useQuery({
    queryKey: [...ROOT, 'formats'],
    queryFn: () => adminGet<AdChannelFormat[]>(ADMIN_AD_CHANNEL_FORMATS_PATH),
  });
}

export function useSaveAdChannelFormat(formatId: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: UpdateAdminAdChannelFormatRequest) =>
      formatId === null
        ? adminWrite<AdChannelFormat>('POST', ADMIN_AD_CHANNEL_FORMATS_PATH, input)
        : adminWrite<AdChannelFormat>(
            'PATCH',
            `${ADMIN_AD_CHANNEL_FORMATS_PATH}/${formatId}`,
            input,
          ),
    onSuccess: invalidate,
  });
}

/** 한 플랫폼의 순서를 통째로 바꾼다. 그 플랫폼의 유형 id 를 빠짐없이 새 순서대로 보낸다. */
export function useReorderAdChannelFormats() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ platform, formatIds }: { platform: AdChannelPlatform; formatIds: number[] }) =>
      adminWrite<AdChannelFormat[]>('PUT', `${ADMIN_AD_CHANNEL_FORMATS_PATH}/order`, {
        platform,
        formatIds,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteAdChannelFormat() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (formatId: number) => adminDelete(`${ADMIN_AD_CHANNEL_FORMATS_PATH}/${formatId}`),
    onSuccess: invalidate,
  });
}

/** 채널 광고 목록의 서버 거르기. 비운 칸은 보내지 않는다. */
export interface ChannelAdQuery {
  /** `YYYY-MM`. 그달과 겹치는 광고. */
  month?: string;
  advertiserId?: number;
  contractId?: number;
}

/** 채널 광고 목록. 게시 예정일이 이른 것이 먼저다. */
export function useChannelAds(query: ChannelAdQuery, enabled = true) {
  return useQuery({
    queryKey: [...ROOT, 'ads', query],
    queryFn: () => adminGet<ChannelAd[]>(ADMIN_CHANNEL_ADS_PATH, { ...query }),
    enabled,
  });
}

/** 등록과 수정. 수정도 폼이 모든 칸을 들고 있어 모두 보낸다. */
export function useSaveChannelAd(adId: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: ChannelAdInput) =>
      adId === null
        ? adminWrite<ChannelAd>('POST', ADMIN_CHANNEL_ADS_PATH, input)
        : adminWrite<ChannelAd>('PATCH', `${ADMIN_CHANNEL_ADS_PATH}/${adId}`, input),
    onSuccess: invalidate,
  });
}

/** 몇 칸만 고친다. 표의 상태·날짜·확인 주소 바로 고치기가 쓴다. */
export function usePatchChannelAd(adId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (changes: UpdateAdminChannelAdRequest) =>
      adminWrite<ChannelAd>('PATCH', `${ADMIN_CHANNEL_ADS_PATH}/${adId}`, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteChannelAd() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (adId: number) => adminDelete(`${ADMIN_CHANNEL_ADS_PATH}/${adId}`),
    onSuccess: invalidate,
  });
}
