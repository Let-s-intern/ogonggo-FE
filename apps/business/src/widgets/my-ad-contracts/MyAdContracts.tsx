'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  enumLabel,
  listMyAdvertisementContracts,
  type PageResponseMyAdvertisementContractSummaryResponse,
  type SuccessResponsePageResponseMyAdvertisementContractSummaryResponse,
} from '@ogonggo/api';
import { Badge, Button } from '@ogonggo/ui';
import { formatDateDots } from '@/shared/lib/localDate';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import {
  formatPaymentAmount,
  MY_AD_CONTRACTS_HREF,
  myAdContractHref,
  PAGE_SIZE,
  statusBadge,
} from './model';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; page: PageResponseMyAdvertisementContractSummaryResponse }
  | { kind: 'error' };

/**
 * 내 광고 신청 목록(`GET /api/v1/users/me/advertisement-contracts`, BE LC-3590). 로그인하고 광고 신청 폼으로 낸
 * 신청만 최근 것부터 나온다. 로그인 없이 낸 신청과 비즈니스 공고 등록으로 생긴 계약은 BE 가 넣지 않는다.
 *
 * 토큰이 브라우저 저장소에만 있어 브라우저에서 읽는다(`widgets/company-posts` 와 같다).
 */
export function MyAdContracts({ page }: { page: number }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    (
      listMyAdvertisementContracts({
        page,
        size: PAGE_SIZE,
      }) as unknown as Promise<SuccessResponsePageResponseMyAdvertisementContractSummaryResponse>
    )
      .then((response) => {
        if (active && response.data) setState({ kind: 'ready', page: response.data });
        else if (active) setState({ kind: 'error' });
      })
      .catch(() => {
        if (active) setState({ kind: 'error' });
      });
    return () => {
      active = false;
    };
  }, [page]);

  const items = state.kind === 'ready' ? state.page.items : [];
  const pageInfo =
    state.kind === 'ready'
      ? state.page.pageInfo
      : { pageNum: page, pageSize: 0, totalElements: 0, totalPages: 0 };

  return (
    <section className="flex flex-col gap-5 md:gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-gray-950">광고 신청 내역</h1>
          <p className="pt-2 text-sm text-gray-500">
            광고 신청 폼으로 낸 신청의 진행 상태를 확인할 수 있어요.
          </p>
        </div>
        <Button asChild className="w-full gap-1 whitespace-nowrap md:w-auto">
          <Link href="/apply/ad">
            <span aria-hidden="true" className="icon-[lucide--plus] block h-5 w-5" />
            광고 신청하기
          </Link>
        </Button>
      </header>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const badge = statusBadge(item.status);
            return (
              <li key={item.id}>
                <Link
                  href={myAdContractHref(item.id)}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 px-5 py-4 transition-colors hover:border-gray-300 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      <span className="text-sm text-gray-500">
                        {enumLabel('AdvertisementContractPromotionTarget', item.promotionTarget)}
                      </span>
                    </div>
                    <p className="mt-2 truncate font-semibold text-gray-950">
                      {item.recruitmentTitle}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.companyName} · 모집 마감 {formatDateDots(item.recruitmentDeadline)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.categories
                        .map((category) => enumLabel('AdvertisementProductCategory', category))
                        .join(', ')}
                    </p>
                  </div>
                  <dl className="flex shrink-0 gap-6 text-sm md:flex-col md:gap-1 md:text-right">
                    <div>
                      <dt className="inline text-gray-500">협의 금액 </dt>
                      <dd className="inline font-medium text-gray-900">
                        {formatPaymentAmount(item.paymentAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">신청일 </dt>
                      <dd className="inline text-gray-900">{formatDateDots(item.registeredAt)}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-md border border-gray-200 px-4 py-16 text-center text-sm text-gray-500">
          {state.kind === 'loading'
            ? '불러오는 중입니다.'
            : state.kind === 'error'
              ? '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
              : '광고 신청 내역이 없습니다.'}
        </p>
      )}

      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(next) =>
          next > 1 ? `${MY_AD_CONTRACTS_HREF}?page=${next}` : MY_AD_CONTRACTS_HREF
        }
      />
    </section>
  );
}
