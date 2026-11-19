import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  AdminContractDetailWithTargets,
  AdminContractReportSummary,
  AdminContractProductReport,
  AdminContractProductWithReport,
} from '@ogonggo/api/src/mocks/admin/advertisementReports';
import type {
  AdminAdvertisementContractDetailResponse,
  AdminAdvertisementContractProductResponse,
} from '@ogonggo/api/src/admin';
import { HttpError } from '@ogonggo/api';
import { getAccessToken } from '@/shared/api/accessToken';
import { adminGet } from '@/shared/api/adminClient';

/**
 * 계약 상품별 성과 리포트(PRD `prd-business-report.md` 6.4·6.7, API 계약 3절). BE(Push 3) 배포 전이라 목 타입을 쓴다.
 * 코드젠 뒤 생성 함수로 옮긴다.
 */
export type ContractProductReport = AdminContractProductReport;
export type ContractReportSummary = AdminContractReportSummary;
export type ReportableContractProduct = AdminContractProductWithReport;

const reportPath = (contractId: number, contractProductId: number) =>
  `/api/v1/admin/advertisement-contracts/${contractId}/products/${contractProductId}/report`;

/** 코드젠 전 생성 타입에는 리포트 칸이 없다. 없으면 기간이 있는 상품만 열 수 있다고 본다. */
export function reportProductsOf(
  contract: AdminAdvertisementContractDetailResponse,
): ReportableContractProduct[] {
  return (
    (contract as Partial<AdminContractDetailWithTargets>).products?.map(
      (
        product: AdminAdvertisementContractProductResponse & Partial<ReportableContractProduct>,
      ) => ({
        ...product,
        reportAvailable: product.reportAvailable ?? Boolean(product.startDate && product.endDate),
        reportUnavailableReason: product.reportUnavailableReason ?? null,
      }),
    ) ?? []
  );
}

export interface ReportRange {
  /** `YYYY-MM-DD`. 비우면 상품 기간 전체(진행 중이면 오늘까지)다. */
  from: string;
  to: string;
}

export function useContractReport(
  contractId: number,
  contractProductId: number | null,
  range: ReportRange,
) {
  return useQuery({
    queryKey: ['admin', 'advertisement-contracts', 'report', contractId, contractProductId, range],
    queryFn: () =>
      adminGet<ContractProductReport>(reportPath(contractId, contractProductId as number), {
        from: range.from,
        to: range.to,
      }),
    enabled: contractProductId !== null,
    // 기간을 바꾸는 동안 앞 숫자를 그대로 두어 카드가 접혔다 펴지지 않게 한다.
    placeholderData: keepPreviousData,
  });
}

/** 계약 전체 합계(API 계약 6.2). 리포트를 열 수 있는 상품만, 각 상품 기간 전체를 합친다. */
export function useContractReportSummary(contractId: number) {
  return useQuery({
    queryKey: ['admin', 'advertisement-contracts', 'report-summary', contractId],
    queryFn: () =>
      adminGet<ContractReportSummary>(
        `/api/v1/admin/advertisement-contracts/${contractId}/report-summary`,
      ),
  });
}

/**
 * `report.csv` 를 받아 파일로 저장한다. 본문이 JSON 봉투가 아니라 `httpClient` 대신 `fetch` 로 받고, 토큰은 같은 곳에서
 * 읽는다.
 */
export async function downloadReportCsv(
  contractId: number,
  contractProductId: number,
  range: ReportRange,
  fileName: string,
) {
  const query = new URLSearchParams();
  if (range.from) query.set('from', range.from);
  if (range.to) query.set('to', range.to);
  const search = query.toString();
  const url = `${reportPath(contractId, contractProductId)}.csv${search ? `?${search}` : ''}`;
  const token = getAccessToken();
  const response = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new HttpError(
      `GET ${url} failed: ${response.status}`,
      response.status,
      await response.text().catch(() => ''),
    );
  }
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
