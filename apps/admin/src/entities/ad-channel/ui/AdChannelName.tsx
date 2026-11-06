import type { AdChannelPlatform } from '@ogonggo/api/src/ad-channels';
import { WEB_HOME } from '@/shared/api/webHandoff';
import { PLATFORM_COPY, channelLabel } from '../lib/adChannel';

/** 프로필 이미지 주소. `/community/...` 처럼 웹 경로면 웹 주소를 붙인다(배너 미리보기와 같다). */
export function channelImageSrc(url: string): string {
  return url.startsWith('/') ? new URL(url, WEB_HOME).toString() : url;
}

/**
 * 채널 표시. 프로필 이미지(없으면 회색 동그라미)와 첫 줄 `@계정`(오픈채팅은 방 이름), 둘째 줄 표시 이름(오픈채팅은 플랫폼
 * 이름). 채널 등록·채널 광고·광고 계약 표가 같이 쓴다.
 */
export function AdChannelName({
  channel,
  imageUrl,
}: {
  channel: { platform: AdChannelPlatform; handle: string | null; name: string } | null;
  imageUrl?: string | null;
}) {
  if (!channel) {
    return <span className="text-sm text-gray-400">지워진 채널</span>;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      {imageUrl === undefined ? null : imageUrl ? (
        <img
          src={channelImageSrc(imageUrl)}
          alt=""
          className="size-7 shrink-0 rounded-full border border-gray-200 object-cover"
        />
      ) : (
        <span aria-hidden="true" className="block size-7 shrink-0 rounded-full bg-gray-200" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-gray-900">{channelLabel(channel)}</span>
        <span className="truncate text-xs text-gray-500">
          {channel.handle ? channel.name : PLATFORM_COPY[channel.platform].label}
        </span>
      </span>
    </span>
  );
}
