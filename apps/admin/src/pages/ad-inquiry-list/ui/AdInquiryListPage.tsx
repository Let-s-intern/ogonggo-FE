import { useSearchParams } from 'react-router';
import { Callout, Pagination } from '@ogonggo/ui';
import {
  type AdInquiryListFilters,
  type AdInquiryView,
  useAdInquiryList,
} from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import { PageHeader } from '@/widgets/page-header';
import { AdInquiryActions } from './AdInquiryActions';
import { AdInquiryCard } from './AdInquiryCard';
import { AdInquiryCsvButton } from './AdInquiryCsvButton';
import { AdInquiryFilters } from './AdInquiryFilters';
import { useListQuery } from '@/shared/lib/useListQuery';

const TITLES: Record<AdInquiryView, string> = { active: '광고 문의', rejected: '반려한 문의' };

/**
 * 광고 문의 목록(PRD `어드민 화면`). 영업이 한 건씩 읽고 연락하는 흐름이라 표가 아니라 한 줄에 카드 하나다.
 *
 * `광고 문의`(반려 제외)와 `반려한 문의` 두 메뉴가 이 화면을 함께 쓴다(LC-3525). 처음에는 목록 위 탭이었는데
 * 어색하다는 말이 있어(2026-10-29, 사용자) `광고` 구역의 `검수 대기`·`반려 보관` 처럼 메뉴로 나눴다.
 */
export function AdInquiryListPage({ view = 'active' }: { view?: AdInquiryView }) {
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
    view,
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
      <PageHeader title={TITLES[view]} action={<AdInquiryCsvButton filters={filters} />} />
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
