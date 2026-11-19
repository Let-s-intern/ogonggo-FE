import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdvertisementContractReportResponse, SuccessResponse } from '../advertisementReport';
import type {
  MyAdvertisementContractSummaryResponse,
  SuccessResponsePageResponseMyAdvertisementContractSummaryResponse,
} from '../generated/user/models';

const APPROVED_CONTRACTS: MyAdvertisementContractSummaryResponse[] = [
  {
    id: 1,
    source: 'APPLICATION_FORM',
    status: 'APPROVED',
    promotionTarget: 'JOB',
    companyName: '새싹컴퍼니',
    recruitmentTitle: '2027 상반기 신입 백엔드 개발자',
    recruitmentDeadline: '2026-12-15',
    categories: ['BANNER'],
    paymentAmount: 400000,
    registeredAt: '2026-11-02T10:12:00',
  },
  {
    id: 2,
    source: 'COMPANY_POSTING',
    status: 'APPROVED',
    promotionTarget: 'BOOTCAMP',
    companyName: '코드캠프',
    recruitmentTitle: '프론트엔드 부트캠프 12기',
    recruitmentDeadline: null,
    categories: [],
    paymentAmount: 650000,
    registeredAt: '2026-11-05T09:40:00',
  },
];

const listApprovedAdvertisementContractsHandler = http.get(
  '*/api/v1/users/me/advertisement-contracts',
  ({ request }) => {
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
    const size = Math.min(100, Math.max(1, Number(params.get('size') ?? 10) || 10));
    const start = (page - 1) * size;
    const body: SuccessResponsePageResponseMyAdvertisementContractSummaryResponse = {
      status: 200,
      message: '요청이 성공했습니다.',
      data: {
        items: APPROVED_CONTRACTS.slice(start, start + size),
        pageInfo: {
          pageNum: page,
          pageSize: size,
          totalElements: APPROVED_CONTRACTS.length,
          totalPages: Math.ceil(APPROVED_CONTRACTS.length / size),
        },
      },
    };
    return HttpResponse.json(body, { status: 200 });
  },
);

const getAdvertisementContractReportHandler = http.get(
  '*/api/v1/advertisement-contracts/:contractId/report',
  ({ params, request }) => {
    const contractId = Number(params.contractId);
    if (!APPROVED_CONTRACTS.some((contract) => contract.id === contractId)) {
      return HttpResponse.json(
        {
          status: 404,
          code: 'ADVERTISEMENT_CONTRACT_NOT_FOUND',
          message: '광고 계약을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    const query = new URL(request.url).searchParams;
    const report: AdvertisementContractReportResponse = {
      contractId,
      from: query.get('from') ?? '2026-11-01',
      to: query.get('to') ?? '2026-11-19',
      generatedAt: new Date().toISOString(),
      summary: {
        impressions: { total: 1240, uniqueUsers: 890, perUser: 1.39 },
        clicks: { total: 86, uniqueUsers: 63, perUser: 1.37 },
      },
      daily: [
        {
          date: '2026-11-18',
          category: 'BANNER',
          position: 'JOB_HOME_TOP_BANNER',
          impressions: { total: 410, uniqueUsers: 338, perUser: 1.21 },
          clicks: { total: 31, uniqueUsers: 27, perUser: 1.15 },
        },
        {
          date: '2026-11-19',
          category: 'BANNER',
          position: 'JOB_HOME_TOP_BANNER',
          impressions: { total: 460, uniqueUsers: 359, perUser: 1.28 },
          clicks: { total: 29, uniqueUsers: 23, perUser: 1.26 },
        },
      ],
      positions: [
        {
          category: 'BANNER',
          position: 'JOB_HOME_TOP_BANNER',
          clicks: { total: 86, uniqueUsers: 63, perUser: 1.37 },
        },
      ],
      jobRoleDistribution: [
        { key: 'BACKEND', label: '백엔드', uniqueClickers: 32 },
        { key: 'FRONTEND', label: '프론트엔드', uniqueClickers: 19 },
        { key: 'UNSPECIFIED', label: '희망 직무 미설정', uniqueClickers: 12 },
      ],
    };
    const body: SuccessResponse<AdvertisementContractReportResponse> = {
      status: 200,
      message: '요청이 성공했습니다.',
      data: report,
    };
    return HttpResponse.json(body, { status: 200 });
  },
);

export const advertisementReportHandlers: HttpHandler[] = [
  listApprovedAdvertisementContractsHandler,
  getAdvertisementContractReportHandler,
];
