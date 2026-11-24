import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listFeatureFlags,
  updateFeatureFlag,
  type AdminFeatureFlagResponse,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

export type FeatureFlag = AdminFeatureFlagResponse;

const FEATURE_FLAGS_KEY = ['admin', 'feature-flags'] as const;

/** 기능 플래그 전체. key 순으로 오고, 설명·마지막 변경 일시·변경자(회원 식별자)가 함께 있다. */
export function useFeatureFlags() {
  return useQuery({
    queryKey: FEATURE_FLAGS_KEY,
    queryFn: async () => (await unwrapData(listFeatureFlags()))?.items ?? [],
  });
}

/**
 * 플래그 하나를 켜거나 끈다. 성공하면 `data` 는 null 이라 목록을 다시 받아 바뀐 값을 읽는다. 다시 받는 동안에도 요청이
 * 끝나지 않은 것으로 두어(`onSuccess` 가 약속을 돌려준다) 화면의 스위치가 옛 값으로 깜빡이지 않는다.
 * 사용자 화면에는 최대 30초 뒤에 반영된다(사용자 API 가 목록을 서버마다 30초 둔다).
 */
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      unwrapData(updateFeatureFlag(key, { enabled })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FEATURE_FLAGS_KEY }),
  });
}
