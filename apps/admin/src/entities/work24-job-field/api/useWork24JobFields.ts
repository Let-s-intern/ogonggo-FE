import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getWork24JobFields,
  replaceWork24JobField,
  type AdminWork24JobFieldResponse,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

export type Work24JobField = AdminWork24JobFieldResponse;

const WORK24_JOB_FIELDS_KEY = ['admin', 'work24-job-fields'] as const;

/**
 * 고용24 채용정보 수집 직군. 모든 직군이 직군 순서대로 오고, 직군마다 수집 여부(`enabled`)가 있다.
 * 바꾼 적이 없는 직군은 서버가 정한 기본 다섯 직군만 켜짐이다.
 */
export function useWork24JobFields() {
  return useQuery({
    queryKey: WORK24_JOB_FIELDS_KEY,
    queryFn: () => unwrapData(getWork24JobFields()),
  });
}

/**
 * 직군 하나의 수집을 켜거나 끈다. 같은 요청을 반복해도 결과가 같고, 바뀐 값은 다음 수집 회차부터 쓰인다.
 * 끄면 그 직군의 공고를 더 받지 않을 뿐 이미 등록한 공고는 그대로다.
 *
 * 성공하면 목록을 다시 받는다.
 */
export function useReplaceWork24JobField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobField,
      enabled,
    }: {
      jobField: Work24JobField['jobField'];
      enabled: boolean;
    }) => unwrapData(replaceWork24JobField(jobField, { enabled })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORK24_JOB_FIELDS_KEY });
    },
  });
}
