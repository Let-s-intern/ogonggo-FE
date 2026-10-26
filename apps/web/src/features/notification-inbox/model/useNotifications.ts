'use client';

import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import type { UserNotificationPageResponse, UserNotificationResponse } from '@ogonggo/api';
import { subscribeTokens } from '@/shared/api/authTokens';
import { useSignedIn } from '@/shared/api/useSignedIn';
import { PUSH_RECEIVED_EVENT } from '@/shared/lib/pushReceived';
import {
  fetchNotificationPage,
  fetchUnreadCount,
  isSameNotification,
  markAllNotificationsRead,
  markNotificationRead,
  notificationListKey,
  notificationListPrefix,
  unreadCountKey,
} from '../api/notificationInboxApi';

type NotificationPages = InfiniteData<UserNotificationPageResponse, string | undefined>;

/**
 * 로그인·로그아웃이 바뀌면 알림 캐시를 버린다. 계정이 바뀌는 것이라 앞 사람의 배지·목록을 잠깐이라도 그리면 안
 * 된다 — `enabled` 만으로는 캐시에 남은 값이 그대로 보인다(`features/bookmark` 의 `useMyBookmarkIds` 와 같다).
 */
function useForgetOnAccountChange() {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      subscribeTokens(() => {
        queryClient.removeQueries({ queryKey: notificationListPrefix() });
        queryClient.removeQueries({ queryKey: unreadCountKey() });
      }),
    [queryClient],
  );
}

/**
 * 알림 목록(최근 30일). `더 보기` 로 다음 페이지를 이어 붙인다. 순서는 서버가 준 그대로다(최신순, 같은 시각이면
 * 전체 공지 먼저). 로그인했을 때만 부른다.
 */
export function useNotificationList() {
  const signedIn = useSignedIn();
  useForgetOnAccountChange();
  return useInfiniteQuery({
    queryKey: notificationListKey(),
    queryFn: ({ pageParam }) => fetchNotificationPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? (last.nextCursor ?? undefined) : undefined),
    enabled: signedIn,
  });
}

/**
 * 미읽음 개수. 주기적으로 다시 부르지 않는다(PRD 결정 6). 화면 진입·창 포커스(react-query 기본)·포그라운드 푸시
 * 수신(`NotificationBell`)·읽음 처리 뒤에 다시 읽는다. 로그인했을 때만 부르고, 아니면 `undefined` 다.
 */
export function useUnreadCount(): number | undefined {
  const signedIn = useSignedIn();
  useForgetOnAccountChange();
  const query = useQuery({
    queryKey: unreadCountKey(),
    queryFn: fetchUnreadCount,
    enabled: signedIn,
  });
  // 캐시에 남은 값이 아니라 지금 부를 수 있는지를 따른다. 로그아웃 직후가 그 차이다.
  return signedIn ? query.data : undefined;
}

function patchRead(data: NotificationPages | undefined, target: UserNotificationResponse) {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        isSameNotification(item, target) ? { ...item, isRead: true } : item,
      ),
    })),
  };
}

/**
 * 한 건 읽음. 누르는 쪽은 결과를 기다리지 않고 이동한다(PRD "읽음 처리와 이동"). 이미 읽은 알림은 보내지 않는다.
 *
 * 목록의 그 항목과 미읽음 개수를 먼저 바꾼다. 실패하면(30일 경계를 넘긴 404 포함) 두 쿼리를 무효화해 서버 값으로
 * 돌린다 — 사용자에게 오류는 보이지 않는다. 성공하면 개수만 다시 읽어 그 사이 온 알림을 반영한다.
 */
export function useReadNotification() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notification) => {
      // 진행 중인 읽기가 먼저 바꾼 값을 옛 값으로 덮어쓰지 않게 멈춘다.
      await queryClient.cancelQueries({ queryKey: notificationListPrefix() });
      await queryClient.cancelQueries({ queryKey: unreadCountKey() });
      queryClient.setQueryData<NotificationPages>(notificationListKey(), (data) =>
        patchRead(data, notification),
      );
      queryClient.setQueryData<number>(unreadCountKey(), (count) =>
        count === undefined ? count : Math.max(0, count - 1),
      );
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: notificationListPrefix() });
      void queryClient.invalidateQueries({ queryKey: unreadCountKey() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unreadCountKey() }),
  });

  return (notification: UserNotificationResponse) => {
    if (!notification.isRead) {
      mutation.mutate(notification);
    }
  };
}

/**
 * `모두 읽음`. 끝나면 목록과 개수를 다시 읽는다. 요청 이후 생긴 알림은 미읽음으로 남을 수 있고 그대로 둔다.
 */
export function useReadAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationListPrefix() }),
        queryClient.invalidateQueries({ queryKey: unreadCountKey() }),
      ]);
    },
  });
}

/**
 * 앱을 보고 있을 때 푸시가 오면 미읽음 개수와 목록을 다시 읽는다. 푸시 쪽(`features/push-notification`)이
 * `window` 에 `PUSH_RECEIVED_EVENT` 를 낸다. 주기적으로 묻지 않으므로(PRD 결정 6) 배지가 바로 오르는 길은 이것뿐이다.
 */
export function useRefreshOnPushReceived() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: unreadCountKey() });
      void queryClient.invalidateQueries({ queryKey: notificationListPrefix() });
    };
    window.addEventListener(PUSH_RECEIVED_EVENT, refresh);
    return () => window.removeEventListener(PUSH_RECEIVED_EVENT, refresh);
  }, [queryClient]);
}
