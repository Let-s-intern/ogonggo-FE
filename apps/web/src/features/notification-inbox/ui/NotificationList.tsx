'use client';

import type { UserNotificationResponse } from '@ogonggo/api';
import { Button, cn } from '@ogonggo/ui';
import { BellIcon, RefreshIcon } from '@/shared/ui/icons';
import { useNotificationList, useReadNotification } from '../model/useNotifications';
import { type NotificationLayout, NotificationItem } from './NotificationItem';

export interface NotificationListProps {
  layout: NotificationLayout;
  /** 한 줄을 누른 뒤 부른다. 드롭다운 패널은 여기서 닫힌다. */
  onNavigate?: () => void;
}

/**
 * 알림 목록. 데스크톱 드롭다운 패널과 모바일 알림함 화면이 같이 쓴다. 머리(`알림`, `모두 읽음`)는 쓰는 쪽이 그린다.
 *
 * 첫 페이지 20건을 보이고 `더 보기` 로 이어 받는다. 마지막 페이지면 버튼이 없다. 목록 아래에 보관 기간 안내를 둔다.
 * 비었으면 빈 상태, 처음 읽기에 실패하면 오류 문구와 `다시 시도` 다.
 *
 * 마운트될 때마다 다시 읽는다(react-query 기본). 패널은 열 때 이것을 그리므로 열 때마다 목록을 새로 받고, 이미 받은
 * 것이 있으면 그것을 먼저 보인다.
 */
export function NotificationList({ layout, onNavigate }: NotificationListProps) {
  const list = useNotificationList();
  const read = useReadNotification();
  const panel = layout === 'panel';

  const select = (notification: UserNotificationResponse) => {
    read(notification);
    onNavigate?.();
  };

  if (list.isError && !list.data) {
    return (
      <div className="flex flex-col items-center gap-3 border-t border-gray-100 px-5 py-12 text-center">
        <p className="text-sm text-gray-700">알림을 불러오지 못했어요</p>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          disabled={list.isFetching}
          onClick={() => void list.refetch()}
        >
          <RefreshIcon className="h-4 w-4" />
          다시 시도
        </Button>
      </div>
    );
  }

  if (!list.data) {
    return (
      <ul aria-busy="true" aria-label="알림 불러오는 중" className="border-t border-gray-100">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex gap-3 border-b border-gray-100 px-5 py-4">
            <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
            <span className="flex flex-1 flex-col gap-2 pt-1">
              <span className="h-3.5 w-3/4 animate-pulse rounded-xs bg-gray-100" />
              <span className="h-3 w-full animate-pulse rounded-xs bg-gray-100" />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const items = list.data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-3.5 border-t border-gray-100 px-8 text-center',
          panel ? 'py-12' : 'py-24',
        )}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <BellIcon className="h-[30px] w-[30px]" />
        </span>
        <p className="text-base font-semibold text-gray-900">최근 30일 동안 받은 알림이 없어요</p>
        <p className="text-[13px] leading-5 text-gray-500">
          내 고민에 댓글이 달리거나 내 댓글에 답글이 달리면 여기에서 알려 드려요.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="border-t border-gray-100">
        {items.map((notification) => (
          <NotificationItem
            key={`${notification.source}-${notification.sourceId}`}
            notification={notification}
            layout={layout}
            onSelect={select}
          />
        ))}
      </ul>
      <div
        className={cn(
          'flex flex-col items-center px-5',
          panel ? 'gap-1.5 pt-3 pb-3.5' : 'gap-2 pt-3 pb-5',
        )}
      >
        {list.hasNextPage ? (
          <Button
            variant="secondary"
            className={cn(
              'w-full border-gray-200 font-medium text-gray-700',
              panel ? 'h-10 text-[13px]' : 'h-11 text-sm',
            )}
            disabled={list.isFetchingNextPage}
            onClick={() => void list.fetchNextPage()}
          >
            {list.isFetchingNextPage ? '불러오는 중' : '더 보기'}
          </Button>
        ) : null}
        {list.isFetchNextPageError ? (
          <p className="text-xs text-error">다음 알림을 불러오지 못했어요. 다시 눌러 주세요.</p>
        ) : null}
        <p className="text-xs text-gray-500">알림은 30일 동안 보관돼요</p>
      </div>
    </>
  );
}
