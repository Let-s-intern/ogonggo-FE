import { httpClient } from '@ogonggo/api';

/**
 * 광고 신청 `POST /api/v1/advertisement-contracts`(ogonggo-BE user API, `AdvertisementContractController`).
 *
 * `packages/api` 의 생성 코드에 이 API 가 아직 없다. 생성 코드를 만든 스펙이 이 API 의 배포보다 앞이다. 다시
 * 생성하면 `createAdvertisementContract` 와 `CreateAdvertisementContractRequest` 가 생기므로 이 파일을 지우고 그것을
 * 쓴다. 그때까지 생성 함수와 같은 `httpClient` 로 보낸다 — `/api` 리라이트, 토큰, 401 재발급이 똑같이 걸린다.
 *
 * 요청 칸은 `CreateAdvertisementContractRequest`(`.../advertisementcontract/presentation/request/
 * AdvertisementContractRequests.kt`) 그대로다. 비회원도 보낼 수 있고, 로그인했으면 토큰이 붙어 회원 신청이 된다.
 */
export interface CreateAdvertisementContractRequest {
  promotionTarget: 'JOB' | 'BOOTCAMP';
  companyName: string;
  recruitmentTitle: string;
  recruitmentUrl: string;
  /** `yyyy-MM-dd` */
  recruitmentDeadline: string;
  purpose: 'FAST_APPLICANTS' | 'FIT_APPLICANTS' | 'BRAND_AWARENESS';
  categories: ('JOB_POSTING' | 'BANNER')[];
  scheduleRequest: string | null;
  advertisementRequest: string | null;
  managerName: string;
  email: string;
  phoneNumber: string;
  invoiceMethod: 'TAX_INVOICE' | 'NEGOTIATE';
  creativeMethod: 'REQUEST_PRODUCTION' | 'PROVIDE_DIRECTLY';
}

/** 201 본문. 봉투는 다른 API 와 같은 `SuccessResponse` 다. */
export interface CreateAdvertisementContractBody {
  status: number;
  message: string;
  data: { id: number };
}

export function createAdvertisementContract(
  request: CreateAdvertisementContractRequest,
): Promise<CreateAdvertisementContractBody> {
  return httpClient<CreateAdvertisementContractBody>('/api/v1/advertisement-contracts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
