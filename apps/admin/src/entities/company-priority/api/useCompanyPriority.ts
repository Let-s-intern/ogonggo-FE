import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminCompanyContentPriorityResponse,
  ReplaceAdminCompanyContentPriorityRequest,
} from '@ogonggo/api/src/mocks/fixtures/company-priority-types';
import { adminGet, adminWrite } from '@/shared/api/adminClient';

/**
 * 기업회원 공고 우선 노출 설정. 켜져 있으면 마감 전 기업회원 공고·부트캠프가 공개 목록 맨 앞에 온다.
 *
 * **배포된 어드민 스펙에 아직 없어** 생성 함수 대신 `adminGet`·`adminWrite` 로 부르고 타입도 손으로 쓴
 * 것(`company-priority-types.ts`)을 쓴다. 백엔드가 배포되면 `api-codegen` 으로 생성 함수
 * `getCompanyContentPriority`·`replaceCompanyContentPriority` 와 `unwrapData` 로 바꾼다(`useRecommendWeights.ts` 모양).
 */

export type CompanyPriority = AdminCompanyContentPriorityResponse;
export type CompanyPriorityInput = ReplaceAdminCompanyContentPriorityRequest;

const COMPANY_PRIORITY_KEY = ['admin', 'company-content-priority'] as const;
const COMPANY_PRIORITY_PATH = '/api/v1/admin/company-content-priority';

/** 지금 설정. 행이 없으면 서버가 켜짐을 준다. */
export function useCompanyPriority() {
  return useQuery({
    queryKey: COMPANY_PRIORITY_KEY,
    queryFn: () => adminGet<CompanyPriority>(COMPANY_PRIORITY_PATH),
  });
}

/**
 * 설정 저장. 바뀐 값은 다음 공개 목록 요청부터 운영에 바로 쓰인다.
 *
 * 응답의 `data` 는 서버에 저장된 값이다. 성공하면 그 값으로 조회 캐시를 맞추고 무효화한다 — 다시
 * 받는 동안 토글이 저장 전 값으로 돌아가 보이지 않게 한다.
 */
export function useSaveCompanyPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompanyPriorityInput) =>
      adminWrite<CompanyPriority>('PUT', COMPANY_PRIORITY_PATH, input),
    onSuccess: (saved) => {
      if (saved) {
        queryClient.setQueryData(COMPANY_PRIORITY_KEY, saved);
      }
      void queryClient.invalidateQueries({ queryKey: COMPANY_PRIORITY_KEY });
    },
  });
}
