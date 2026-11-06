import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createImage } from '@ogonggo/api';
import {
  ADMIN_BANNERS_PATH,
  type AdminBannerRequest,
  type AdminBannerResponse,
  type BannerPlacement,
} from '@ogonggo/api/src/banners';
import { adminDelete, adminGet, adminWrite } from '@/shared/api/adminClient';
import { unwrapData } from '@/shared/api/unwrapData';

export type Banner = AdminBannerResponse;
export type BannerInput = AdminBannerRequest;

/**
 * 홈 배너 세팅(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/banners`)로 MSW 목을 부른다.
 * 백엔드 배포 뒤 코드젠으로 바꾼다. 계약은 `.claude/tasks/memos/백엔드-요청-배너-세팅-2026-11-06.md`.
 *
 * 쓰기가 끝나면 그 자리의 목록을 다시 받는다. 순서·켜짐은 서버가 정한 값이 기준이다.
 */
const listKey = (placement: BannerPlacement) => ['admin', 'banners', placement] as const;

/** 자리 하나의 배너 전부(꺼진 것·기간이 지난 것 포함). 순서대로 온다. */
export function useBannerList(placement: BannerPlacement) {
  return useQuery({
    queryKey: listKey(placement),
    queryFn: () => adminGet<Banner[]>(ADMIN_BANNERS_PATH, { placement }),
  });
}

function useInvalidate(placement: BannerPlacement) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: listKey(placement) });
}

/** 등록과 수정. 수정은 `PATCH` 라 보낸 칸만 바뀌지만 폼이 모든 칸을 들고 있어 모두 보낸다(공지와 같다). */
export function useSaveBanner(placement: BannerPlacement, bannerId: number | null) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (input: BannerInput) =>
      bannerId === null
        ? adminWrite<Banner>('POST', ADMIN_BANNERS_PATH, input)
        : adminWrite<Banner>('PATCH', `${ADMIN_BANNERS_PATH}/${bannerId}`, input),
    onSuccess: invalidate,
  });
}

/** 표에서 켜고 끈다. `enabled` 한 칸만 보낸다. */
export function useToggleBanner(placement: BannerPlacement, bannerId: number) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (enabled: boolean) =>
      adminWrite<Banner>('PATCH', `${ADMIN_BANNERS_PATH}/${bannerId}`, { enabled }),
    onSuccess: invalidate,
  });
}

/** 자리 안 순서를 통째로 바꾼다. 그 자리의 id 를 빠짐없이 새 순서대로 보낸다. */
export function useReorderBanners(placement: BannerPlacement) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (bannerIds: number[]) =>
      adminWrite<Banner[]>('PUT', `${ADMIN_BANNERS_PATH}/order`, { placement, bannerIds }),
    onSuccess: invalidate,
  });
}

export function useDeleteBanner(placement: BannerPlacement) {
  const invalidate = useInvalidate(placement);
  return useMutation({
    mutationFn: (bannerId: number) => adminDelete(`${ADMIN_BANNERS_PATH}/${bannerId}`),
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
