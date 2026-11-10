'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  enumLabel,
  listMyAdvertisementContracts,
  type PageResponseMyAdvertisementContractSummaryResponse,
  type SuccessResponsePageResponseMyAdvertisementContractSummaryResponse,
} from '@ogonggo/api';
import { Badge, Button, cn } from '@ogonggo/ui';
import { formatDateDots } from '@/shared/lib/localDate';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { StageTrack } from '@/shared/ui/StageTrack';
import {
  formatPaymentAmount,
  MY_AD_CONTRACTS_HREF,
  myAdContractHref,
  PAGE_SIZE,
  STATUS_CARD_CLASSES,
  STATUS_HINTS,
  STATUS_STEPS,
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
            const hint = STATUS_HINTS[item.status];
            return (
              <li
                key={item.id}
                className={cn(
                  'grid gap-4 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_13rem_auto] md:items-center md:gap-6 md:px-6 md:py-5',
                  STATUS_CARD_CLASSES[item.status],
                )}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Badge
                      tone="neutral"
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap"
                    >
                      {enumLabel('AdvertisementContractPromotionTarget', item.promotionTarget)}
                    </Badge>
                    <Link
                      href={myAdContractHref(item.id)}
                      className="truncate text-base font-bold text-gray-900 hover:underline"
                    >
                      {item.recruitmentTitle}
                    </Link>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {[
                      item.companyName,
                      item.categories
                        .map((category) => enumLabel('AdvertisementProductCategory', category))
                        .join(', '),
                    ].join(' · ')}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {[
                      `신청 ${formatDateDots(item.registeredAt)}`,
                      `모집 마감 ${formatDateDots(item.recruitmentDeadline)}`,
                      `협의 금액 ${formatPaymentAmount(item.paymentAmount)}`,
                    ].join(' · ')}
                  </p>
                  <p className={cn('mt-2 text-xs', hint.className)}>{hint.text}</p>
                </div>

                <StageTrack steps={STATUS_STEPS[item.status]} />

                <div className="flex items-center justify-end">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="rounded-md px-4 whitespace-nowrap"
                  >
                    <Link href={myAdContractHref(item.id)}>상세 보기</Link>
                  </Button>
                </div>
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
