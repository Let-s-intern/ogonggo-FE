import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@ogonggo/api';
import type {
  RejectAdminAdCreativeRequest,
  UploadAdminAdCreativeRequest,
} from '@ogonggo/api/src/mocks/admin/advertisement-details';
import type {
  AdApplication,
  AdApplicationStatus,
  AdApplicationSummary,
  AdminAdPlacementSetting,
  AdPlacementUnit,
  ReorderAdminAdPlacementRequest,
  UpdateAdminAdApplicationStatusRequest,
  UpdateAdminAdPlacementRequest,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';
import { adminGet, adminWrite, type PageResponse } from '@/shared/api/adminClient';

/**
 * 광고 구좌 설정과 광고 신청. **백엔드 API 가 아직 없고 MSW 목에만 있다**
 * (`packages/api/src/mocks/admin/advertisements.ts`, 요청서 `백엔드-요청-광고-시스템.md` 3절).
 * 타입도 목 전용 타입(`advertisement-types.ts`)을 그대로 쓴다. 백엔드가 생기면 생성 함수로 옮긴다.
 */

export type {
  AdApplication,
  AdApplicationItem,
  AdApplicationStatus,
  AdApplicationSummary,
  AdminAdPlacementAssignment,
  AdminAdPlacementSetting,
  AdPlacementUnit,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';

export const AD_PLACEMENT_UNIT_LABELS: Record<AdPlacementUnit, string> = {
  WEEK: '1주',
  POSTING_PERIOD: '공고 기간',
};

/** 진행 단계 순서와 라벨. 시안의 여덟 칸이다(요청서 1절 `AdApplicationStatus`). */
export const AD_APPLICATION_STATUS_LABELS: Record<AdApplicationStatus, string> = {
  RECEIVED: '접수',
  QUOTED: '견적',
  CONTRACTED: '계약',
  PAID: '입금',
  REVIEWING: '검수',
  CONFIRMED: '확정',
  RUNNING: '집행',
  ENDED: '종료',
};

export const AD_CREATIVE_CONFIRM_LABELS = {
  PENDING: '광고주 확인 대기',
  APPROVED: '광고주 확인 완료',
  REVISION_REQUESTED: '수정 요청',
} as const;

const PLACEMENTS_KEY = ['admin', 'advertisement-placements'] as const;
const APPLICATIONS_KEY = ['admin', 'advertisements'] as const;

/** 목이 돌려준 오류 문구(`{ message }`). 읽지 못하면 `fallback`. 409 의 이유(소재 미확인 등)를 그대로 보여 준다. */
export function adErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    try {
      const body = JSON.parse(error.body) as { message?: string };
      if (body.message) {
        return body.message;
      }
    } catch {
      // 본문이 JSON 이 아니면 아래 기본 문구.
    }
  }
  return fallback;
}

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

export interface AdApplicationListFilters {
  page: number;
  /** 빈 문자열이면 전체. */
  status: string;
  keyword: string;
}

/** 광고 신청 목록. 최신 신청순. `status`·`keyword` 는 비면 보내지 않는다(`adminGet`). */
export function useAdApplicationList(filters: AdApplicationListFilters) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, 'list', filters],
    queryFn: () =>
      adminGet<PageResponse<AdApplicationSummary>>('/api/v1/admin/advertisements', {
        page: filters.page,
        status: filters.status,
        keyword: filters.keyword,
      }),
  });
}

export function useAdApplicationDetail(advertisementId: number) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, 'detail', advertisementId],
    queryFn: () => adminGet<AdApplication>(`/api/v1/admin/advertisements/${advertisementId}`),
  });
}

/**
 * 신청 쓰기 넷(상태 변경, 확정, 소재 업로드, 소재 반려)이 함께 쓰는 성공 처리. 신청 목록·상세와 구좌 설정을 다시 받는다 —
 * 확정은 구좌 안 노출 순서에 항목을 더한다.
 */
function useApplicationMutation<V>(
  mutationFn: (variables: V) => Promise<AdApplication | undefined>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: PLACEMENTS_KEY });
    },
  });
}

/**
 * 상태 변경. `rejectionReason` 이 있으면 그 단계에서 반려하고, 없으면 반려를 푼다. 전이를 막지 않는다
 * (memos `결정-광고시스템-admin-신청상태전이-2026-11-03.md`). 확정은 `useConfirmAdApplication` 으로만 한다.
 */
export function useUpdateAdApplicationStatus(advertisementId: number) {
  return useApplicationMutation((body: UpdateAdminAdApplicationStatusRequest) =>
    adminWrite<AdApplication>(
      'PATCH',
      `/api/v1/admin/advertisements/${advertisementId}/status`,
      body,
    ),
  );
}

/** 확정·배치. 신청의 지면을 한 번에 각 구좌 맨 뒤 순서로 넣는다. 조건이 안 맞으면 409 와 그 이유가 온다. */
export function useConfirmAdApplication(advertisementId: number) {
  return useApplicationMutation(() =>
    adminWrite<AdApplication>(
      'POST',
      `/api/v1/admin/advertisements/${advertisementId}/confirm`,
      {},
    ),
  );
}

export function useUploadAdCreative(advertisementId: number) {
  return useApplicationMutation(
    ({ creativeId, ...body }: UploadAdminAdCreativeRequest & { creativeId: number }) =>
      adminWrite<AdApplication>(
        'PUT',
        `/api/v1/admin/advertisements/${advertisementId}/creatives/${creativeId}`,
        body,
      ),
  );
}

export function useRejectAdCreative(advertisementId: number) {
  return useApplicationMutation(
    ({ creativeId, ...body }: RejectAdminAdCreativeRequest & { creativeId: number }) =>
      adminWrite<AdApplication>(
        'POST',
        `/api/v1/admin/advertisements/${advertisementId}/creatives/${creativeId}/reject`,
        body,
      ),
  );
}
