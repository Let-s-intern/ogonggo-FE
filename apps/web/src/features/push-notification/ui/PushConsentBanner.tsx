'use client';

import { cn } from '@ogonggo/ui';
import { BellIcon } from '@/shared/ui/icons';
import { usePushConsent } from '../model/usePushConsent';

/**
 * 모바일 알림함(`/notifications`) 목록 위에 두는 푸시 동의 안내. 모바일 헤더 윗줄은 360px 에서 자리가 없어 헤더의
 * `PushConsentButton` 대신 여기에 둔다. 켜지면 사라진다. 상태와 켜기는 `usePushConsent` 가 맡는다.
 */
export function PushConsentBanner({ className }: { className?: string }) {
  const { visible, pending, enable } = usePushConsent();

  if (!visible) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-3 rounded-xl bg-blue-00 px-4 py-3.5', className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <BellIcon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">푸시 알림 받기</p>
        <p className="pt-0.5 text-xs text-gray-500">새 댓글과 공지를 바로 알려 드려요.</p>
      </div>
      <button
        type="button"
        onClick={() => void enable()}
        disabled={pending}
        className="h-9 shrink-0 rounded-lg bg-blue-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
      >
        켜기
      </button>
    </div>
  );
}
