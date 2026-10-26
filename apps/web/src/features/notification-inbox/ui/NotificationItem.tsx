'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { UserNotificationResponse } from '@ogonggo/api';
import { Avatar, cn } from '@ogonggo/ui';
import { formatRelativeTime } from '@/shared/lib/relativeTime';
import { Logo } from '@/shared/ui/Logo';
import { notificationTarget } from '../lib/notificationTarget';

/**
 * 한 줄이 놓이는 자리. 시안에서 데스크톱 드롭다운(`panel`)과 모바일 화면(`page`)의 배치가 조금 다르다.
 * `panel` 은 시각이 첫 줄 오른쪽, 미읽음 점이 맨 오른쪽 칸이다. `page` 는 점이 첫 줄 오른쪽이고 시각이 원글 제목과
 * 함께 마지막 줄에 온다.
 */
export type NotificationLayout = 'panel' | 'page';

export interface NotificationItemProps {
  notification: UserNotificationResponse;
  layout: NotificationLayout;
  /** 누른 순간 부른다. 읽음 처리와 패널 닫기가 여기 걸린다. 이동은 이 컴포넌트가 한다. */
  onSelect: (notification: UserNotificationResponse) => void;
}

/** 첫 줄(굵게). 댓글 알림은 누가 무엇을 했는지, 관리자 알림은 제목이다(PRD "알림 한 줄"). */
function headlineOf(notification: UserNotificationResponse): string {
  switch (notification.type) {
    case 'CONCERN_COMMENT':
      return `${notification.actorNickname}님이 내 고민에 댓글을 남겼어요`;
    case 'SIDE_STUDY_COMMENT_REPLY':
      return `${notification.actorNickname}님이 내 댓글에 답글을 남겼어요`;
    default:
      return notification.postTitle;
  }
}

/**
 * 왼쪽 동그라미. 댓글 알림은 남긴 사람의 프로필 사진이고, 없거나 못 불러오면 닉네임 첫 글자다. 관리자 알림은 오공고
 * 로고다. 글자가 바로 옆에 있어 스크린 리더에는 숨긴다.
 */
function NotificationAvatar({ notification }: { notification: UserNotificationResponse }) {
  if (notification.type === 'ADMIN_NOTIFICATION') {
    return (
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white"
      >
        <Logo className="h-[11px] w-[23px]" />
      </span>
    );
  }
  return (
    <Avatar
      aria-hidden="true"
      src={notification.actorProfileImageUrl ?? undefined}
      alt=""
      fallback={Array.from(notification.actorNickname)[0] ?? ''}
      className="shrink-0 bg-blue-100 text-[13px] font-bold text-blue-700"
    />
  );
}

function UnreadDot({ className }: { className?: string }) {
  return (
    <span className={cn('block h-2 w-2 shrink-0 rounded-full bg-blue-500', className)}>
      <span className="sr-only">읽지 않음</span>
    </span>
  );
}

/**
 * 알림 한 줄. 미읽음이면 연한 파랑 바탕과 파란 점, 읽었으면 흰 바탕이다. 미리보기는 두 줄에서 자르고, 댓글 알림은
 * 원글 제목을 회색 한 줄로 더한다. 전체 공지의 `body` 는 쓰지 않는다(PRD 결정 기록).
 *
 * 갈 곳에 따라 요소가 다르다(`notificationTarget`). 오공고 안이면 `Link`, 다른 오리진이면 새 탭 `a`, 갈 곳이 없으면
 * `button` 이다. 누르면 `onSelect` 를 먼저 부르고 결과를 기다리지 않고 이동한다.
 *
 * 이름·제목·사진·미리보기는 알림이 생길 때의 값이다. 원글이 지워졌어도 알림은 남고, 눌러서 간 상세가 없는 글 화면을 보인다.
 */
export function NotificationItem({ notification, layout, onSelect }: NotificationItemProps) {
  const unread = !notification.isRead;
  const isComment = notification.type !== 'ADMIN_NOTIFICATION';
  const target = notificationTarget(notification);
  const time = (
    <time dateTime={notification.createdAt} className="shrink-0 text-xs leading-5 text-gray-500">
      {formatRelativeTime(notification.createdAt)}
    </time>
  );

  const body = (
    <>
      <NotificationAvatar notification={notification} />
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="flex items-start gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 text-sm leading-5 text-gray-900',
              unread ? 'font-semibold' : 'font-medium',
            )}
          >
            {headlineOf(notification)}
          </span>
          {layout === 'panel' ? time : unread ? <UnreadDot className="mt-1.5" /> : null}
        </span>
        <span className="line-clamp-2 text-[13px] leading-[19px] text-gray-600">
          {notification.preview}
        </span>
        {layout === 'panel' ? (
          isComment ? (
            <span className="truncate text-xs leading-[18px] text-gray-500">
              {notification.postTitle}
            </span>
          ) : null
        ) : (
          <span className="flex min-w-0 gap-1.5 text-xs leading-[18px] text-gray-500">
            {isComment ? (
              <>
                <span className="min-w-0 truncate">{notification.postTitle}</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            {time}
          </span>
        )}
      </span>
      {layout === 'panel' ? (
        <span className="flex w-2 shrink-0 pt-1.5">{unread ? <UnreadDot /> : null}</span>
      ) : null}
    </>
  );

  const className = cn(
    'flex w-full gap-3 px-5 text-left transition-colors',
    layout === 'panel' ? 'py-3.5' : 'py-4',
    unread ? 'bg-blue-00 hover:bg-blue-50' : 'bg-white hover:bg-gray-50',
  );
  const select = () => onSelect(notification);

  let row: ReactNode;
  if (target.kind === 'internal') {
    row = (
      <Link href={target.href} onClick={select} className={className}>
        {body}
      </Link>
    );
  } else if (target.kind === 'external') {
    row = (
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={select}
        className={className}
      >
        {body}
      </a>
    );
  } else {
    row = (
      <button type="button" onClick={select} className={className}>
        {body}
      </button>
    );
  }

  return <li className="border-b border-gray-100">{row}</li>;
}
