import { Callout, Pagination } from '@ogonggo/ui';
import {
  type AdInquiryListFilters,
  useAdInquiryList,
} from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import { PageHeader } from '@/widgets/page-header';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 광고 문의 목록(PRD `어드민 화면`). 영업이 한 건씩 읽고 연락하는 흐름이라 표가 아니라 한 줄에 카드 하나다.
 */
export function AdInquiryListPage() {
  const { get, page, setPage } = useListQuery();

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
                <li key={inquiry.id} className="rounded-lg border border-gray-200 bg-white p-5">
                  {inquiry.companyName}
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
