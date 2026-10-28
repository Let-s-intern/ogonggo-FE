import { useQuery } from '@tanstack/react-query';
import {
  listAdvertisementInquiries,
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
