'use client';

import { useQuery } from '@tanstack/react-query';
import {
  listPublicFeatureFlags,
  type SuccessResponseUserFeatureFlagListResponse,
} from '@ogonggo/api';

/** 서버가 플래그 목록을 서버마다 30초 둔다. 같은 시간만큼 다시 받지 않는다. */
const STALE_MS = 30_000;

/**
 * 기능 플래그가 켜져 있는지. 읽는 동안, 읽지 못했을 때, 목록에 없는 key 는 모두 꺼짐이다. 켜졌다가 사라지는 깜빡임을
 * 만들지 않으려는 것이다(PRD `prd-ad-price-feature-flag.md` 5.7). 읽는 화면이 일찍 부르면 다른 요청과 나란히 받는다.
 *
 * 로그인이 필요 없는 공개 목록(`GET /api/v1/feature-flags`)이다. 생성 함수는 봉투를 감싸 돌려준다고 선언하지만 실제로는
 * 본문인 봉투 그대로다(`useMyAccount.ts` 와 같은 사정).
 */
export function useFeatureFlag(key: string): boolean {
  const { data } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const body =
        (await listPublicFeatureFlags()) as unknown as SuccessResponseUserFeatureFlagListResponse;
      return body.data?.items ?? [];
    },
    staleTime: STALE_MS,
  });
  return data?.find((flag) => flag.key === key)?.enabled === true;
}
