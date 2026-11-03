import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminAdPlacementSetting,
  AdPlacementUnit,
  ReorderAdminAdPlacementRequest,
  UpdateAdminAdPlacementRequest,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';
import { adminGet, adminWrite } from '@/shared/api/adminClient';

/**
 * 광고 구좌 설정과 광고 신청. **백엔드 API 가 아직 없고 MSW 목에만 있다**
 * (`packages/api/src/mocks/admin/advertisements.ts`, 요청서 `백엔드-요청-광고-시스템.md` 3절).
 * 타입도 목 전용 타입(`advertisement-types.ts`)을 그대로 쓴다. 백엔드가 생기면 생성 함수로 옮긴다.
 */

export type {
  AdminAdPlacementAssignment,
  AdminAdPlacementSetting,
  AdPlacementUnit,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';

export const AD_PLACEMENT_UNIT_LABELS: Record<AdPlacementUnit, string> = {
  WEEK: '1주',
  POSTING_PERIOD: '공고 기간',
};

const PLACEMENTS_KEY = ['admin', 'advertisement-placements'] as const;

/** 구좌 설정 목록. 구좌마다 확정·집행 중인 광고가 노출 순서대로 붙어 온다. 쪽을 나누지 않는다(구좌는 열두 개). */
export function useAdPlacementSettings() {
  return useQuery({
    queryKey: PLACEMENTS_KEY,
    queryFn: () => adminGet<AdminAdPlacementSetting[]>('/api/v1/admin/advertisement-placements'),
  });
}

/** 구좌 설정 수정. `PATCH` 라 보낸 칸만 바뀐다. */
export function useUpdateAdPlacement(placementKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateAdminAdPlacementRequest) =>
      adminWrite<AdminAdPlacementSetting>(
        'PATCH',
        `/api/v1/admin/advertisement-placements/${placementKey}`,
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLACEMENTS_KEY });
    },
  });
}

/**
 * 구좌 안 노출 순서 변경. 지금 배치된 항목 id 전부를 원하는 순서로 보낸다(빠지거나 겹치면 400).
 * 순서는 구좌 하나에 하나다(요청서 5절 1).
 */
export function useReorderAdPlacement(placementKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReorderAdminAdPlacementRequest) =>
      adminWrite<AdminAdPlacementSetting>(
        'PUT',
        `/api/v1/admin/advertisement-placements/${placementKey}/order`,
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLACEMENTS_KEY });
    },
  });
}
