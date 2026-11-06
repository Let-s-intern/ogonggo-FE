import { WEB_HOME } from '@/shared/api/webHandoff';
import { instagramHandle } from '../lib/instagram';

/** 프로필 이미지 주소. `/community/...` 처럼 웹 경로면 웹 주소를 붙인다(배너 미리보기와 같다). */
export function instagramImageSrc(url: string): string {
  return url.startsWith('/') ? new URL(url, WEB_HOME).toString() : url;
}

/**
 * 계정 표시. 프로필 이미지(없으면 회색 동그라미)와 `@계정`, 표시 이름. 인스타 등록·인스타 광고·광고 계약 표가 같이 쓴다.
 */
export function InstagramAccountName({
  account,
  imageUrl,
}: {
  account: { handle: string; displayName: string } | null;
  imageUrl?: string | null;
}) {
  if (!account) {
    return <span className="text-sm text-gray-400">지워진 계정</span>;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      {imageUrl === undefined ? null : imageUrl ? (
        <img
          src={instagramImageSrc(imageUrl)}
          alt=""
          className="size-7 shrink-0 rounded-full border border-gray-200 object-cover"
        />
      ) : (
        <span aria-hidden="true" className="block size-7 shrink-0 rounded-full bg-gray-200" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-gray-900">
          {instagramHandle(account.handle)}
        </span>
        <span className="truncate text-xs text-gray-500">{account.displayName}</span>
      </span>
    </span>
  );
}
