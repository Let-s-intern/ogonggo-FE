import { useSearchParams } from 'react-router';
import { Callout, Pagination } from '@ogonggo/ui';
import {
  type AdInquiryListFilters,
  useAdInquiryList,
} from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import { PageHeader } from '@/widgets/page-header';
import { AdInquiryActions } from './AdInquiryActions';
import { AdInquiryCard } from './AdInquiryCard';
import { AdInquiryFilters } from './AdInquiryFilters';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 광고 문의 목록(PRD `어드민 화면`). 영업이 한 건씩 읽고 연락하는 흐름이라 표가 아니라 한 줄에 카드 하나다.
 */
export function AdInquiryListPage() {
  const { get, page, setPage } = useListQuery();
  const [, setSearchParams] = useSearchParams();

  /**
   * 필터 여러 개를 한 번에 바꾼다(`오늘` 은 시작·끝 둘이다). 바꾸면 1페이지로 돌아간다.
   *
   * 지금 주소(`window.location.search`)에서 출발한다. 렌더 때의 쿼리에서 출발하면 두 필터를 연달아 바꿀 때 두
   * 번째가 첫 번째를 모르는 쿼리를 써서 앞의 변경이 사라진다. react-router 의 `setSearchParams` 갱신 함수도
   * 렌더 때의 쿼리를 넘겨 주어 막지 못한다. 주소는 이동하는 즉시 바뀐다.
   */
  const changeFilters = (changes: Partial<Record<string, string>>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const filters: AdInquiryListFilters = {
    page,
    inquiryType: get('inquiryType'),
    campaignCode: get('campaignCode'),
    status: get('status'),
    memberType: get('memberType'),
    inflowChannel: get('inflowChannel'),
    companyNameSource: get('companyNameSource'),
    createdFrom: get('createdFrom'),
    createdTo: get('createdTo'),
  };

  const { data, isPending, isError } = useAdInquiryList(filters);
  const items = data?.items ?? [];

  return (
    <>
      <PageHeader title="광고 문의" />
      <AdInquiryFilters
        filters={filters}
        total={data?.pageInfo.totalElements}
        onChange={changeFilters}
      />

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          {isPending ? (
            <p className="py-10 text-center text-sm text-gray-400">불러오는 중</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">조건에 맞는 문의가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((inquiry) => (
                <li key={inquiry.id}>
                  <AdInquiryCard
                    inquiry={inquiry}
                    actions={<AdInquiryActions inquiry={inquiry} />}
                  />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </>
  );
}
