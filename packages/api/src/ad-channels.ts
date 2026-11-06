import type { AdContractSummary } from './ad-contracts';
import type { AdvertiserSummary } from './advertisers';

/**
 * 채널 광고(이슈 #573, 2026-11-06 사용자). 광고주의 홍보를 우리 SNS·오픈채팅 채널(인스타그램 계정, 카카오톡 오픈채팅방)에 올려
 * 주는 상품이다. 채널이 여럿이고 올리는 방식(피드 게시물·릴스, 오픈채팅 공지 등)도 플랫폼마다 달라 운영자가 `채널 등록` 에서
 * 채널과 게재 유형을 등록하고, `채널 광고` 에서 광고주별 게시 일정을 잡는다. 처음에는 인스타그램만 있었고(인스타 광고) 카카오톡
 * 오픈채팅을 더하며 이름을 바꿨다.
 *
 * 백엔드 API 가 아직 없어 손으로 적었다. 계약은 `.claude/tasks/memos/백엔드-요청-채널-광고-2026-11-06.md` 이고, 목
 * (`./mocks/admin/ad-channels.ts`)이 이 모양 그대로 응답한다. 백엔드 배포 뒤 코드젠으로 바꾼다.
 */

/** 채널 플랫폼. 인스타그램 계정, 카카오톡 오픈채팅방. */
export type AdChannelPlatform = 'INSTAGRAM' | 'KAKAO_OPENCHAT';

/** 화면의 탭·고르기 순서다. */
export const AD_CHANNEL_PLATFORMS: readonly AdChannelPlatform[] = ['INSTAGRAM', 'KAKAO_OPENCHAT'];

/** 우리 채널(인스타그램 계정, 오픈채팅방). `GET /api/v1/admin/ad-channels` 한 건. */
export interface AdminAdChannelResponse {
  id: number;
  /** 등록한 뒤에는 바꾸지 않는다. */
  platform: AdChannelPlatform;
  /** 표시 이름. 인스타그램은 `렛츠커리어 오공고`, 오픈채팅은 방 이름(`마케팅 채용공고 큐레이션`). */
  name: string;
  /**
   * 인스타그램 계정 이름(`@` 를 뺀 `letscareer.job`). 영문·숫자·`.`·`_` 30자까지, 겹치지 않는다. 인스타그램은 필수,
   * 오픈채팅은 `null`.
   */
  handle: string | null;
  /** 인스타그램 프로필 주소, 오픈채팅방 참여 주소(`https://open.kakao.com/o/...`). */
  url: string;
  /** 프로필 이미지. `https://` 주소이거나 웹 사이트 안 경로(`/community/...`). 없으면 `null`. */
  profileImageUrl: string | null;
  /** 오픈채팅방 인원, 인스타그램 팔로워 수. 안내용이고 운영자가 가끔 고친다. 없으면 `null`. */
  memberCount: number | null;
  /** 끄면 새 채널 광고에서 고를 수 없다. 이미 잡힌 광고는 그대로다. */
  enabled: boolean;
  memo: string | null;
  /** 이 채널에 잡힌 채널 광고 수. 서버가 센다. 1 이상이면 지울 수 없다. */
  adCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAdChannelRequest {
  platform: AdChannelPlatform;
  name: string;
  handle: string | null;
  url: string;
  profileImageUrl: string | null;
  memberCount: number | null;
  enabled: boolean;
  memo: string | null;
}

/** `platform` 은 보내도 바꾸지 않는다(다르면 400). */
export type UpdateAdminAdChannelRequest = Partial<AdminAdChannelRequest>;

/** 목록·등록, `/{channelId}` 수정·삭제. */
export const ADMIN_AD_CHANNELS_PATH = '/api/v1/admin/ad-channels';

/** 게재 유형(피드 게시물, 오픈채팅 공지 등). 플랫폼마다 따로 정하고 순서를 바꾼다. `GET /api/v1/admin/ad-channel-formats` 한 건. */
export interface AdminAdChannelFormatResponse {
  id: number;
  /** 등록한 뒤에는 바꾸지 않는다. */
  platform: AdChannelPlatform;
  /** 이름(예: `릴스(숏츠)`). 같은 플랫폼 안에서 겹치지 않는다. */
  name: string;
  description: string | null;
  enabled: boolean;
  /** 기본 단가(원). 안내용이고 계약 금액에 더하지 않는다. 없으면 `null`. */
  defaultPrice: number | null;
  /** 이 유형으로 올릴 수 있는 채널(같은 플랫폼만). 비어 있으면 그 플랫폼의 모든 채널이다. */
  channelIds: number[];
  /** 플랫폼 안에서 1부터. 목록과 고르기 칸이 이 순서다. */
  displayOrder: number;
  /** 이 유형으로 잡힌 채널 광고 수. 1 이상이면 지울 수 없다. */
  adCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAdChannelFormatRequest {
  platform: AdChannelPlatform;
  name: string;
  description: string | null;
  enabled: boolean;
  defaultPrice: number | null;
  channelIds: number[];
}

export type UpdateAdminAdChannelFormatRequest = Partial<AdminAdChannelFormatRequest>;

/**
 * 목록(플랫폼 순, 그 안에서 `displayOrder` 순)·등록, `/{formatId}` 수정·삭제, `PUT /order`(`{ platform, formatIds }`)로 한
 * 플랫폼의 순서 바꾸기.
 */
export const ADMIN_AD_CHANNEL_FORMATS_PATH = '/api/v1/admin/ad-channel-formats';

/** 채널 광고 진행 상태. 예정, 게시 완료, 취소. 운영자가 바꾼다(날짜로 저절로 바뀌지 않는다). */
export type ChannelAdStatus = 'SCHEDULED' | 'PUBLISHED' | 'CANCELED';

export const CHANNEL_AD_STATUSES: readonly ChannelAdStatus[] = [
  'SCHEDULED',
  'PUBLISHED',
  'CANCELED',
];

/** 채널 광고 한 건. `GET /api/v1/admin/channel-ads` 한 건. */
export interface AdminChannelAdResponse {
  id: number;
  advertiserId: number;
  /** 서버가 `advertiserId` 로 읽어 싣는다. 광고주가 지워졌으면 `null`. */
  advertiser: AdvertiserSummary | null;
  contractId: number | null;
  contract: AdContractSummary | null;
  /** 응답 전용. 채널의 플랫폼이다. */
  platform: AdChannelPlatform;
  channelId: number;
  channel: Pick<AdminAdChannelResponse, 'id' | 'platform' | 'name' | 'handle'> | null;
  formatId: number;
  format: Pick<AdminAdChannelFormatResponse, 'id' | 'platform' | 'name'> | null;
  /** 게시 예정일(KST `YYYY-MM-DD`). 게시하면 실제 게시일로 고친다. */
  postDate: string;
  /**
   * 스토리·하이라이트 고정·오픈채팅 공지 고정처럼 기간이 있는 것의 노출 끝 날(KST `YYYY-MM-DD`, 그날 포함). 없으면 `null`
   * (하루짜리 게시).
   */
  endDate: string | null;
  status: ChannelAdStatus;
  /**
   * 게시 확인 주소. 인스타그램은 올린 게시물 주소, 오픈채팅은 글 주소가 없어 캡처 이미지 링크 등을 적는다. 게시 뒤 적고 비워도
   * 된다.
   */
  postUrl: string | null;
  /** 소재·문구 메모(광고주가 준 문구, 이미지 위치 등). */
  creativeMemo: string | null;
  /** 담당자 메모. */
  adminMemo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChannelAdRequest {
  advertiserId: number;
  contractId: number | null;
  channelId: number;
  formatId: number;
  postDate: string;
  endDate: string | null;
  status: ChannelAdStatus;
  postUrl: string | null;
  creativeMemo: string | null;
  adminMemo: string | null;
}

export type UpdateAdminChannelAdRequest = Partial<AdminChannelAdRequest>;

/**
 * 목록·등록, `/{adId}` 수정·삭제. 목록은 `?month=YYYY-MM`(그달과 겹치는 것), `advertiserId`, `contractId`, `platform`,
 * `channelId`, `formatId`, `status` 로 거른다. 모두 비우면 전부다. 게시 예정일이 이른 것이 먼저다.
 */
export const ADMIN_CHANNEL_ADS_PATH = '/api/v1/admin/channel-ads';
