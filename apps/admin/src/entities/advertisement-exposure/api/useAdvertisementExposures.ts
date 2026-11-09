import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createImage } from '@ogonggo/api';
import {
  createAdvertisementExposure,
  deleteAdvertisementExposure,
  listAdvertisementExposures,
  moveAdvertisementExposure,
  replaceAdvertisementExposure,
  updateAdvertisementExposureExposed,
  type AdminAdvertisementExposureResponse,
  type CreateAdminAdvertisementExposureRequest,
  type MoveAdminAdvertisementExposureRequestDirection,
  type UpdateAdminAdvertisementExposureRequest,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

export type AdvertisementExposure = AdminAdvertisementExposureResponse;

/**
 * 광고 노출(BE LC-3583). 상품(자리) 하나의 노출을 순서대로 받는다. 꺼진 것·기간 밖도 온다.
 *
 * 쓰기가 끝나면 노출 목록 전부를 다시 받는다. 순서·켜짐은 서버가 정한 값이 기준이다. 배너 세팅(상품별)과 계약 상세(계약별)가
 * 같은 노출을 다른 키로 들고 있다.
 */
const LIST_KEY = ['admin', 'advertisement-exposures'] as const;

/** 한 자리의 노출은 많아야 몇 개라 서버 최대(100건) 한 쪽으로 받는다. */
const PAGE_SIZE = 100;

export function useAdvertisementExposures(productId: number | null, contractId?: number) {
  return useQuery({
    queryKey: [...LIST_KEY, productId, contractId ?? null],
    queryFn: async () =>
      (
        await unwrapData(
          listAdvertisementExposures({
            productId: productId as number,
            contractId,
            size: PAGE_SIZE,
          }),
        )
      )?.items ?? [],
    enabled: productId !== null,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: LIST_KEY });
}

/** 등록. 그 자리의 맨 뒤에 붙는다. */
export function useCreateExposure() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateAdminAdvertisementExposureRequest) =>
      unwrapData(createAdvertisementExposure(input)),
    onSuccess: invalidate,
  });
}

/** 수정. `PUT` 전체 교체라 빈 칸은 null 로 저장된다. 켜짐·순서·자리는 바뀌지 않는다. */
export function useReplaceExposure(exposureId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: UpdateAdminAdvertisementExposureRequest) =>
      unwrapData(replaceAdvertisementExposure(exposureId, input)),
    onSuccess: invalidate,
  });
}

export function useToggleExposure(exposureId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (exposed: boolean) =>
      unwrapData(updateAdvertisementExposureExposed(exposureId, { exposed })),
    onSuccess: invalidate,
  });
}

/** 바로 옆과 자리를 바꾼다. 누를 때마다 한 칸이고, 끝나면 목록을 다시 받는다. */
export function useMoveExposure() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      exposureId,
      direction,
    }: {
      exposureId: number;
      direction: MoveAdminAdvertisementExposureRequestDirection;
    }) => unwrapData(moveAdvertisementExposure(exposureId, { direction })),
    onSuccess: invalidate,
  });
}

export function useDeleteExposure() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (exposureId: number) => unwrapData(deleteAdvertisementExposure(exposureId)),
    onSuccess: invalidate,
  });
}

/**
 * 배너 이미지 올리기. 관리자 API 에는 업로드가 없어 알림 이미지와 같은 사용자 API `POST /api/v1/images` 를 쓴다
 * (`entities/notification-batch/api/useNotificationBatches.ts`). 배너용 `usage` 가 없어 관리자 화면이 이미 쓰는
 * `NOTIFICATION` 으로 올린다 — JPEG·PNG 만 된다. 백엔드에 `BANNER` 를 요청해 두었고, 생기면 여기만 바꾼다.
 */
export function useUploadBannerImage() {
  return useMutation({
    mutationFn: (file: File) => unwrapData(createImage({ file }, { usage: 'NOTIFICATION' })),
  });
}
