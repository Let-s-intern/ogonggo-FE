import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdvertisementInquiryTodayCount,
  listAdvertisementInquiries,
  updateAdvertisementInquiryMemo,
  updateAdvertisementInquiryStatus,
  type AdminAdvertisementInquiryResponse,
  type ChangeAdvertisementInquiryStatusRequestStatus,
  type ListAdvertisementInquiriesParams,
} from '@ogonggo/api/src/admin';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 광고 문의(`비즈니스 > 광고 문의`). 웹 `/biz` 신청서와 기존 출시 알림 랜딩으로 들어온 문의다.
 * 목록은 서버가 최신순으로 준다. 필터는 모두 AND 이고 빈 값은 조건이 없는 것이다.
 */

/** 화면 필터. 값은 URL 쿼리 그대로라 모두 문자열이고, 빈 문자열은 전체다. */
export interface AdInquiryListFilters {
  page: number;
  inquiryType: string;
  campaignCode: string;
  status: string;
  memberType: string;
  inflowChannel: string;
  companyNameSource: string;
  /** 접수일 시작·끝(`YYYY-MM-DD`, 한국 시간, 양끝 포함). */
  createdFrom: string;
  createdTo: string;
}

const LIST_KEY = ['admin', 'advertisement-inquiries'] as const;

function toAdInquiryParams(filters: AdInquiryListFilters): ListAdvertisementInquiriesParams {
  // 값은 화면 선택지에서 오므로 스펙의 enum 과 같다.
  return omitEmpty({ ...filters }) as ListAdvertisementInquiriesParams;
}

export function useAdInquiryList(filters: AdInquiryListFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, 'list', filters],
    queryFn: () => unwrapData(listAdvertisementInquiries(toAdInquiryParams(filters))),
  });
}

const TODAY_COUNT_KEY = [...LIST_KEY, 'today-count'] as const;

/**
 * 오늘(한국 시간 0시부터) 들어온 문의 수. 사이드바 메뉴 숫자다.
 *
 * 1분마다, 그리고 어드민 탭으로 돌아올 때 다시 센다(PRD `메뉴 숫자`). 처리 상태와 무관한 건수라 상태를
 * 바꿔도 줄지 않는다. 목록 화면을 열지 않아도 사이드바가 늘 보이므로 레이아웃이 부른다.
 */
export function useAdInquiryTodayCount() {
  return useQuery({
    queryKey: TODAY_COUNT_KEY,
    queryFn: () => unwrapData(getAdvertisementInquiryTodayCount()),
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * 한국 시간 오늘(`YYYY-MM-DD`). 서버의 `오늘` 과 접수일 필터가 한국 시간이라, 브라우저 시간대와 상관없이
 * 서울 기준으로 만든다. `en-CA` 는 날짜를 `YYYY-MM-DD` 로 쓰는 로케일이다.
 */
export function todayInSeoul(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** 기간이 오늘로 걸린 목록 주소. 메뉴 숫자와 목록의 `오늘` 버튼이 같은 조건을 쓴다. */
export function todayAdInquiriesHref(): string {
  const today = todayInSeoul();
  return `/business/ad-inquiries?createdFrom=${today}&createdTo=${today}`;
}

/**
 * 처리 상태 변경. 낙관적으로 바꾸지 않고 성공한 뒤 목록·건수를 다시 읽는다 — 상태 필터가 걸린 목록에서는 카드가
 * 빠져야 하고, 그 판단은 서버 결과로 한다. 오늘 건수는 상태와 무관해 바뀌지 않는다.
 */
export function useChangeAdInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inquiryId,
      status,
    }: {
      inquiryId: number;
      status: ChangeAdvertisementInquiryStatusRequestStatus;
    }) => unwrapData(updateAdvertisementInquiryStatus(inquiryId, { status })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

/** 메모 저장. 통째로 바꾸며 비우면 지운다(서버 규칙). 성공한 뒤 목록을 다시 읽는다. */
export function useSaveAdInquiryMemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inquiryId, memo }: { inquiryId: number; memo: string }) =>
      unwrapData(updateAdvertisementInquiryMemo(inquiryId, { memo })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

/** 서버가 한 페이지에 주는 최대 건수(`size` 최대 100). */
const EXPORT_PAGE_SIZE = 100;

/**
 * 현재 필터의 문의 전부(CSV 용). 페이지가 아니라 조건 전체라 100건씩 끝 페이지까지 읽는다.
 * 읽는 동안 새 문의가 들어오면 최신순이라 한 건이 두 페이지에 걸칠 수 있어 ID 로 한 번 거른다.
 */
export async function fetchAllAdInquiries(
  filters: AdInquiryListFilters,
): Promise<AdminAdvertisementInquiryResponse[]> {
  const rows = new Map<number, AdminAdvertisementInquiryResponse>();
  for (let page = 1; ; page += 1) {
    const data = await unwrapData(
      listAdvertisementInquiries({
        ...toAdInquiryParams({ ...filters, page }),
        size: EXPORT_PAGE_SIZE,
      }),
    );
    for (const item of data?.items ?? []) rows.set(item.id, item);
    if (!data || page >= data.pageInfo.totalPages) break;
  }
  return [...rows.values()];
}
