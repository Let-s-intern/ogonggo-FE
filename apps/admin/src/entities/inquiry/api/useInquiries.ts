import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  InquiryDetail,
  InquiryStatus,
  InquirySummary,
} from '@ogonggo/api/src/mocks/fixtures/admin-inquiry';
import { adminGet, adminWrite, type PageResponse } from '@/shared/api/adminClient';

export interface InquiryListFilters {
  page: number;
  keyword: string;
  status: string;
  category: string;
}

export function useInquiryList(filters: InquiryListFilters) {
  return useQuery({
    queryKey: ['admin', 'inquiries', filters],
    queryFn: () =>
      adminGet<PageResponse<InquirySummary>>('/api/v1/admin/inquiries', { ...filters }),
  });
}

export function useInquiryDetail(inquiryId: number) {
  return useQuery({
    queryKey: ['admin', 'inquiries', inquiryId],
    queryFn: () => adminGet<InquiryDetail>(`/api/v1/admin/inquiries/${inquiryId}`),
    enabled: Number.isInteger(inquiryId),
  });
}

/**
 * 답변 저장.
 *
 * 성공하면 문의 관련 캐시를 전부 무효화한다. 목록의 처리 상태와 대시보드의 미답변 수가 같은
 * 저장에 함께 바뀌기 때문이다 — 상세만 갱신하면 목록으로 돌아갔을 때 예전 상태가 보인다.
 */
export function useAnswerInquiry(inquiryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { answer: string; status?: InquiryStatus }) =>
      adminWrite<InquiryDetail>('PATCH', `/api/v1/admin/inquiries/${inquiryId}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'inquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}
