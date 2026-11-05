import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCompanyContentPriority,
  replaceCompanyContentPriority,
  type ReplaceAdminCompanyContentPriorityRequest,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 기업회원 공고 우선 노출 설정. 켜져 있으면 마감 전 기업회원 공고·부트캠프가 공개 목록 맨 앞에 온다.
 */

export type CompanyPriorityInput = ReplaceAdminCompanyContentPriorityRequest;

const COMPANY_PRIORITY_KEY = ['admin', 'company-content-priority'] as const;

/** 지금 설정. 행이 없으면 서버가 켜짐을 준다. */
export function useCompanyPriority() {
  return useQuery({
    queryKey: COMPANY_PRIORITY_KEY,
    queryFn: () => unwrapData(getCompanyContentPriority()),
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
    mutationFn: (input: CompanyPriorityInput) => unwrapData(replaceCompanyContentPriority(input)),
    onSuccess: (saved) => {
      if (saved) {
        queryClient.setQueryData(COMPANY_PRIORITY_KEY, saved);
      }
      void queryClient.invalidateQueries({ queryKey: COMPANY_PRIORITY_KEY });
    },
  });
}
