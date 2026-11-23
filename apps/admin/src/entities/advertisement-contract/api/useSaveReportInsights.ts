import { useQueryClient } from '@tanstack/react-query';
import { adminWrite } from '@/shared/api/adminClient';

export interface ReportInsightInput {
  title: string;
  body: string;
}

/**
 * 계약 상품 리포트의 인사이트를 통째로 바꾼다(BE LC-3657). `published` 가 참이면 기업 회원의 리포트에 보내고, 거짓이면
 * 운영자만 보는 임시 저장이다(이미 보낸 것도 숨겨진다). 성공하면 리포트를 다시 불러온다.
 */
export function useSaveReportInsights(contractId: number, contractProductId: number) {
  const queryClient = useQueryClient();
  return async (insights: ReportInsightInput[], published: boolean) => {
    await adminWrite(
      'PUT',
      `/api/v1/admin/advertisement-contracts/${contractId}/products/${contractProductId}/report-insights`,
      { insights, published },
    );
    await queryClient.invalidateQueries({
      queryKey: ['admin', 'advertisement-contracts', 'report', contractId, contractProductId],
    });
  };
}
