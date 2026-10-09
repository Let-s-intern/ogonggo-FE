'use client';

import { useQuery } from '@tanstack/react-query';
import { useSignedIn } from '@/shared/api/useSignedIn';
import { readConcernDetail } from '../api/concernDetail';

/**
 * 내가 쓴 고민글인지. 서버가 그린 상세에는 `mine` 이 늘 `false` 라(토큰이 서버 요청에 실리지 않는다)
 * 로그인했으면 마운트 뒤 상세를 한 번 더 읽어 채운다(PRD 결정 8). 로그인하지 않았으면 읽지 않는다.
 *
 * 이 요청도 백엔드에서는 조회수 1 이다. 그래서 한 번 읽은 값을 오래 두지 않는다 —
 * - 다시 읽지 않게 한다. 창에 다시 돌아오거나 네트워크가 돌아올 때 읽는 것, 실패했을 때 재시도는 모두
 *   조회수를 올린다(`refetchOnWindowFocus`, `refetchOnReconnect`, `retry`).
 * - 캐시에 남기지 않는다(`gcTime: 0`). 같은 탭에서 다른 계정으로 바꿔 로그인했을 때 앞 사람의 `mine` 이
 *   보이면 안 된다. 키에 로그인 여부를 넣은 것도 같은 이유다.
 * 읽지 못하면(그 사이 지워진 글 등) 내 글이 아닌 것으로 본다. 버튼이 없을 뿐 화면은 그대로다.
 */
export function useConcernMine(concernId: number): boolean {
  const signedIn = useSignedIn();
  const { data } = useQuery({
    queryKey: ['concern-detail-mine', concernId, signedIn],
    queryFn: () => readConcernDetail(concernId),
    select: (detail) => detail?.mine ?? false,
    enabled: signedIn,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return data ?? false;
}
