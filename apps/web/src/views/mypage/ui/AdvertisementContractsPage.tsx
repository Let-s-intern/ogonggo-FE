'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  type MyAdvertisementContractSummaryResponse,
  type PageInfo,
  type SuccessResponsePageResponseMyAdvertisementContractSummaryResponse,
  listMyAdvertisementContracts,
} from '@ogonggo/api';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';

const PAGE_SIZE = 10;

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; contracts: MyAdvertisementContractSummaryResponse[]; pageInfo: PageInfo }
  | { kind: 'error' };

function formatDate(value: string | null): string {
  if (!value) return '미정';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
}

function pageHref(page: number): string {
  return page <= 1 ? '/mypage/company/advertisement-contracts' : `?page=${page}`;
}

/** 승인된 계약에 연결된 광고 성과 리포트 목록. 회사 마이페이지의 계약 진입점으로도 동작한다. */
export function AdvertisementContractsPage({ page }: { page: number }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    (
      listMyAdvertisementContracts({
        page,
        size: PAGE_SIZE,
        status: ['APPROVED'],
      }) as unknown as Promise<SuccessResponsePageResponseMyAdvertisementContractSummaryResponse>
    )
      .then((response) => {
        if (!active) return;
        setState({
          kind: 'ready',
          contracts: response.data?.items ?? [],
          pageInfo: response.data?.pageInfo ?? {
            pageNum: page,
            pageSize: PAGE_SIZE,
            totalElements: 0,
            totalPages: 0,
          },
        });
      })
      .catch(() => {
        if (active) setState({ kind: 'error' });
      });

    return () => {
      active = false;
    };
  }, [page]);

  const contracts = state.kind === 'ready' ? state.contracts : [];
  const pageInfo =
    state.kind === 'ready'
      ? state.pageInfo
      : { pageNum: page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 };

  return (
    <section className="flex flex-col gap-5 md:gap-6">
      <header className="hidden md:block">
        <h1 className="text-3xl font-bold text-gray-950">광고 리포트</h1>
        <p className="pt-2 text-sm text-gray-500">승인된 광고 계약의 성과를 확인할 수 있습니다.</p>
      </header>

      {state.kind === 'loading' ? (
        <p className="rounded-md border border-gray-200 px-4 py-16 text-center text-sm text-gray-500">
          광고 계약을 불러오는 중입니다.
        </p>
      ) : state.kind === 'error' ? (
        <p
          role="alert"
          className="rounded-md border border-gray-200 px-4 py-16 text-center text-sm text-error"
        >
          광고 계약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : contracts.length === 0 ? (
        <p className="rounded-md border border-gray-200 px-4 py-16 text-center text-sm text-gray-500">
          승인된 광고 계약이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {contracts.map((contract) => (
            <li key={contract.id}>
              <Link
                href={`/mypage/company/advertisement-contracts/${contract.id}`}
                className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/30 md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-950">
                      {contract.recruitmentTitle}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {contract.companyName} ·{' '}
                      {contract.source === 'COMPANY_POSTING' ? '기업 공고 등록 광고' : '광고 신청'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    승인
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                  <span>신청일 {formatDate(contract.registeredAt)}</span>
                  <span>모집 마감 {formatDate(contract.recruitmentDeadline)}</span>
                  <span>광고 항목 {contract.categories.length}개</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {state.kind === 'ready' && state.contracts.length > 0 ? (
        <NumberedPagination pageInfo={pageInfo} buildHref={pageHref} />
      ) : null}
    </section>
  );
}
