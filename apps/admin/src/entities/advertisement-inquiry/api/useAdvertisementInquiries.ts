import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdvertisementInquiryTodayCount,
  listAdvertisementInquiries,
  updateAdvertisementInquiryMemo,
  updateAdvertisementInquiryStatus,
  type AdminAdvertisementInquiryResponse,
  type ChangeAdvertisementInquiryStatusRequestStatus,
  type ListAdvertisementInquiriesParams,
  type ListAdvertisementInquiriesStatusItem,
} from '@ogonggo/api/src/admin';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 광고 문의(`비즈니스 > 광고 문의`). 웹 `/biz` 신청서와 기존 출시 알림 랜딩으로 들어온 문의다.
 * 목록은 서버가 최신순으로 준다. 필터는 모두 AND 이고 빈 값은 조건이 없는 것이다.
 */

/**
 * 목록 위 탭(PRD `어드민 화면`, LC-3525). `active` 는 반려하지 않은 문의(기본), `rejected` 는 반려한 문의다.
 * 탭은 처리 상태 조건만 정하고 나머지 필터와 함께 쓴다. URL 에는 `?tab=rejected` 로만 남는다.
 */
export type AdInquiryTab = 'active' | 'rejected';

/** `active` 탭이 보는 상태. 반려(`REJECTED`)를 뺀 셋이고, 메뉴 숫자(`today-count`)도 같은 조건이다. */
export const ACTIVE_AD_INQUIRY_STATUSES: readonly ListAdvertisementInquiriesStatusItem[] = [
  'RECEIVED',
  'CONTACTED',
  'EXECUTED',
];

/** 화면 필터. 탭 밖의 값은 URL 쿼리 그대로라 모두 문자열이고, 빈 문자열은 전체다. */
export interface AdInquiryListFilters {
  page: number;
  tab: AdInquiryTab;
  inquiryType: string;
  campaignCode: string;
  /** `active` 탭 안에서 고른 상태 하나. 비면 탭의 세 상태 전부다. `rejected` 탭에서는 쓰지 않는다. */
  status: string;
  memberType: string;
  inflowChannel: string;
  companyNameSource: string;
  /** 접수일 시작·끝(`YYYY-MM-DD`, 한국 시간, 양끝 포함). */
  createdFrom: string;
  createdTo: string;
}

const LIST_KEY = ['admin', 'advertisement-inquiries'] as const;

/**
 * 탭과 상태 필터를 서버의 `status` 배열로 바꾼다. `active` 탭에서 고른 상태가 탭의 셋이 아니면(옛 북마크의
 * `?status=REJECTED` 등) 무시하고 탭 전체를 본다 — 반려 탭이 따로 있는데 기본 탭에 반려가 섞이면 안 된다.
 */
function statusesOf(filters: AdInquiryListFilters): ListAdvertisementInquiriesStatusItem[] {
  if (filters.tab === 'rejected') return ['REJECTED'];
  const chosen = ACTIVE_AD_INQUIRY_STATUSES.find((status) => status === filters.status);
  return chosen ? [chosen] : [...ACTIVE_AD_INQUIRY_STATUSES];
}

function toAdInquiryParams(filters: AdInquiryListFilters): ListAdvertisementInquiriesParams {
  const { tab: _tab, status: _status, ...rest } = filters;
  // 값은 화면 선택지에서 오므로 스펙의 enum 과 같다.
  return {
    ...(omitEmpty(rest) as Omit<ListAdvertisementInquiriesParams, 'status'>),
    status: statusesOf(filters),
  };
}

export function useAdInquiryList(filters: AdInquiryListFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, 'list', filters],
    queryFn: () => unwrapData(listAdvertisementInquiries(toAdInquiryParams(filters))),
  });
}

/**
 * 탭 이름 옆 건수. 그 탭의 상태 전부와 지금의 다른 필터(유형·캠페인·기간 등)로 센다 — 탭 안의 상태 필터는
 * 넣지 않는다. 지금 탭은 목록 응답의 건수와 같아도 다른 탭은 따로 물어야 해서 두 탭 모두 크기 1 로 묻는다.
 */
export function useAdInquiryTabCount(filters: AdInquiryListFilters, tab: AdInquiryTab) {
  const counted: AdInquiryListFilters = { ...filters, page: 1, tab, status: '' };
  return useQuery({
    queryKey: [...LIST_KEY, 'tab-count', counted],
    queryFn: () =>
      unwrapData(listAdvertisementInquiries({ ...toAdInquiryParams(counted), size: 1 })),
    select: (data) => data?.pageInfo.totalElements,
  });
}

/** 목록 키 아래에 둔다. 목록을 무효화하는 변경(상태·메모)이 이 숫자도 함께 다시 읽게 한다. */
const TODAY_COUNT_KEY = [...LIST_KEY, 'today-count'] as const;

/**
 * 오늘(한국 시간 0시부터) 들어온 문의 중 반려하지 않은 수(LC-3525). 사이드바 메뉴 숫자다.
 *
 * 1분마다, 그리고 어드민 탭으로 돌아올 때 다시 센다(PRD `메뉴 숫자`). 반려로 바꾸면 줄고 반려를 풀면 늘어나므로
 * 상태 변경이 끝나면 바로 다시 읽는다(`useChangeAdInquiryStatus`). 목록 화면을 열지 않아도 사이드바가 늘
 * 보이므로 레이아웃이 부른다.
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
 * 처리 상태 변경. 낙관적으로 바꾸지 않고 성공한 뒤 목록·탭 건수·오늘 건수(메뉴 숫자)를 다시 읽는다 — 셋 다
 * `LIST_KEY` 아래에 있다. 반려하면 카드가 `광고 문의` 탭에서 빠져 `반려한 문의` 탭으로 가고 메뉴 숫자가 준다.
 * 그 판단은 서버 결과로 한다.
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
