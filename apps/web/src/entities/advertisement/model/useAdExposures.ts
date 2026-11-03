'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdExposures } from '../api/adExposureApi';
import type { AdExposure, AdPlacementKey } from './types';

/**
 * 클라이언트 화면(지원일정 대시보드 등)용 노출 광고 조회. 서버 컴포넌트는 `fetchAdExposures` 를 바로 부른다.
 * 받기 전과 실패는 빈 목록이다 — 자리가 접힌 채로 있다가 광고가 오면 나타난다.
 */
export function useAdExposures(placementKey: AdPlacementKey, jobField?: string): AdExposure[] {
  const { data } = useQuery({
    queryKey: ['ad-exposures', placementKey, jobField ?? null],
    queryFn: () => fetchAdExposures(placementKey, jobField),
    staleTime: 5 * 60 * 1000,
  });
  return data ?? [];
}
