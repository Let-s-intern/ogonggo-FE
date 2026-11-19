import { http, HttpResponse, type HttpHandler } from 'msw';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import { myContractSeed, toMyContractSummary } from './fixtures/my-advertisement-contracts';
import {
  buildActiveAds,
  buildReportSummary,
  buildReport,
  clipPeriod,
  reportCsvRows,
  reportPlanOf,
  toReportCsv,
} from './fixtures/my-advertisement-report';

/**
 * 비즈니스 회원의 내 광고 계약 목(`GET /api/v1/users/me/advertisement-contracts`, 상세). 생성 핸들러는 값이
 * 무작위라 목록과 상세가 서로 맞지 않고 상품 기간도 비어 있어, 리포트 화면을 볼 수 없다. 시드는
 * `./fixtures/my-advertisement-contracts.ts` 다.
 *
 * 상세의 `products[]` 에는 리포트 계약(`광고-리포트-API-계약-2026-11-19.md` 3절)이 더하는 `reportAvailable`·
 * `reportUnavailableReason` 이 이미 들어 있다. 리포트 응답에만 쓰는 `productId` 는 상세에서 뺀다.
 *
 * 상품별 리포트(`.../products/{contractProductId}/report`, `report.csv`)도 여기서 받는다. 숫자는
 * `./fixtures/my-advertisement-report.ts` 가 만든다. 대시보드의 진행 중 광고 요약
 * (`GET /api/v1/users/me/advertisement-reports/active`, 계약 4절)도 같은 숫자로 준다.
 */

const BASE = '*/api/v1/users/me/advertisement-contracts';

const contracts = myContractSeed();

const errorResponse = (status: number, code: string, message: string) =>
  HttpResponse.json<ErrorResponse>({ status, code, message }, { status });

export const findMyContract = (id: unknown) => contracts.find((c) => c.id === Number(id));

export const myContractNotFound = () =>
  errorResponse(404, 'NOT_FOUND', '광고 신청을 찾을 수 없습니다.');

/** 계약·상품을 찾고 기간을 자른다. 못 찾거나 못 여는 상품이면 오류 응답을 준다. */
function resolveReport(params: Record<string, unknown>, request: Request) {
  const contract = findMyContract(params.contractId);
  const product = contract?.products.find(
    (p) => p.contractProductId === Number(params.contractProductId),
  );
  if (!product) return { error: myContractNotFound() };
  const found = reportPlanOf(product);
  if (!found) {
    return {
      error: errorResponse(409, 'REPORT_NOT_AVAILABLE', '리포트를 볼 수 없는 상품입니다.'),
    };
  }
  const search = new URL(request.url).searchParams;
  const period = clipPeriod(found.startDate, found.endDate, search.get('from'), search.get('to'));
  if (!period) {
    return { error: errorResponse(400, 'INVALID_PERIOD', '조회 기간이 상품 기간 밖입니다.') };
  }
  return { product, period };
}

export const myAdvertisementContractHandlers: HttpHandler[] = [
  http.get(BASE, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const statuses = params.getAll('status');
    const pageNum = Math.max(1, Number(params.get('page') ?? 1) || 1);
    const size = Math.min(100, Math.max(1, Number(params.get('size') ?? 10) || 10));
    const all = contracts
      .filter((c) => statuses.length === 0 || statuses.includes(c.status))
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
    return HttpResponse.json({
      status: 200,
      message: '요청이 성공했습니다.',
      data: {
        items: all.slice((pageNum - 1) * size, pageNum * size).map(toMyContractSummary),
        pageInfo: {
          pageNum,
          pageSize: size,
          totalElements: all.length,
          totalPages: Math.ceil(all.length / size),
        },
      },
    });
  }),
  http.get(`${BASE}/:contractId`, ({ params }) => {
    const contract = findMyContract(params.contractId);
    if (!contract) return myContractNotFound();
    return HttpResponse.json({
      status: 200,
      message: '요청이 성공했습니다.',
      data: {
        ...contract,
        products: contract.products.map(({ productId: _productId, ...product }) => product),
      },
    });
  }),
  http.get(`${BASE}/:contractId/report-summary`, ({ params }) => {
    const contract = findMyContract(params.contractId);
    if (!contract) return myContractNotFound();
    return HttpResponse.json({
      status: 200,
      message: '요청이 성공했습니다.',
      data: buildReportSummary(contract.products),
    });
  }),
  http.get(`${BASE}/:contractId/products/:contractProductId/report`, ({ params, request }) => {
    const resolved = resolveReport(params, request);
    if ('error' in resolved) return resolved.error;
    const { product, period } = resolved;
    return HttpResponse.json({
      status: 200,
      message: '요청이 성공했습니다.',
      data: buildReport(product, period.from, period.to),
    });
  }),
  http.get(`${BASE}/:contractId/products/:contractProductId/report.csv`, ({ params, request }) => {
    const resolved = resolveReport(params, request);
    if ('error' in resolved) return resolved.error;
    const { product, period } = resolved;
    return new HttpResponse(toReportCsv(reportCsvRows(product, period.from, period.to)), {
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': `attachment; filename="report-${product.contractProductId}-${period.from}_${period.to}.csv"`,
      },
    });
  }),
  http.get('*/api/v1/users/me/advertisement-reports/active', () =>
    HttpResponse.json({
      status: 200,
      message: '요청이 성공했습니다.',
      data: buildActiveAds(contracts),
    }),
  ),
];
