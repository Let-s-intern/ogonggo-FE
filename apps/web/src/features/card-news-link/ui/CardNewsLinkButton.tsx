'use client';

import { cn } from '@ogonggo/ui';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { CardNewsIcon } from '@/shared/ui/icons';

/** 카드뉴스 편집 앱(`apps/card-news`). `?jobId=` 를 주면 그 공고를 고른 채로 열린다. */
const CARD_NEWS_ORIGIN = 'https://card.ogonggo.co.kr';

export interface CardNewsLinkButtonProps {
  jobId: number;
  /** `card` 는 목록 카드 썸네일 위 북마크 크기(24px) 아이콘, `detail` 은 상세 CTA 의 북마크 칸과 같은 상자다. */
  variant: 'card' | 'detail';
  className?: string;
}

/**
 * 공고로 카드뉴스를 만들러 가는 버튼. **어드민에게만 보인다.** 역할은 `getMyAccount` 에만
 * 있어(`useMyAccount`) 그것을 읽고, 모르는 동안에는 그리지 않는다.
 *
 * 화면에서 숨기는 것일 뿐 막는 장치는 아니다. 카드뉴스 앱은 자체 비밀번호로 잠겨 있다.
 */
export function CardNewsLinkButton({ jobId, variant, className }: CardNewsLinkButtonProps) {
  const account = useMyAccount();
  if (account.kind !== 'ready' || account.account.role !== 'ADMIN') {
    return null;
  }

  return (
    <a
      href={`${CARD_NEWS_ORIGIN}/?jobId=${jobId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카드뉴스 만들기"
      title="카드뉴스 만들기"
      className={cn(
        variant === 'detail'
          ? 'flex h-11 flex-col items-center justify-center rounded-md border border-gray-300 px-3 text-xs text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50'
          : 'flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-gray-600 shadow-sm transition-opacity hover:opacity-70',
        className,
      )}
    >
      {variant === 'detail' ? (
        <>
          <CardNewsIcon className="h-4 w-4" />
          <span>카드뉴스</span>
        </>
      ) : (
        <CardNewsIcon className="h-4 w-4" />
      )}
    </a>
  );
}
