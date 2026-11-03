'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, EmptyState, Tabs } from '@ogonggo/ui';
import {
  type AdApplicationTab,
  MY_AD_COUPONS_QUERY_KEY,
  adApplyHref,
  fetchMyAdApplications,
  fetchMyAdCoupons,
  myAdApplicationsKey,
} from '@/entities/advertisement';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { type MyAdsQuery, buildMyAdsHref } from '../lib/query';
import { MyAdCard } from './MyAdCard';

const TAB_LABELS: Record<AdApplicationTab, string> = {
  ALL: '전체',
  ACTIVE: '진행 중',
  ENDED: '종료',
};

/**
 * 마이페이지 > 광고 > 광고 목록(시안 B-02). 탭 `전체` · `진행 중` · `종료` 와 건수, 무료 쿠폰 배너, 카드, 빈 상태.
 * 탭과 쪽은 주소에 둔다(`?tab=&page=`).
 */
export function MyAds({ query }: { query: MyAdsQuery }) {
  const router = useRouter();
  const { data, isPending, isError } = useQuery({
    queryKey: myAdApplicationsKey(query.tab, query.page),
    queryFn: () => fetchMyAdApplications(query.tab, query.page),
  });
  const coupons = useQuery({ queryKey: MY_AD_COUPONS_QUERY_KEY, queryFn: fetchMyAdCoupons });
  const coupon = coupons.data?.find((each) => !each.usedAt);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950 md:text-3xl">광고</h2>
          <p className="pt-2 text-sm text-gray-500">신청부터 성과까지 한 곳에서 확인해요.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/schedule">신청 가능 일정 보기</Link>
          </Button>
          <Button asChild className="gap-1">
            <Link href={adApplyHref({})}>
              <span aria-hidden="true" className="icon-[lucide--plus] block h-5 w-5" />
              광고 신청하기
            </Link>
          </Button>
        </div>
      </header>

      {coupon ? (
        <div className="flex flex-col gap-3 rounded-md border border-blue-200 bg-blue-00 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {coupon.name} 1장 · 리스트 상단 고정 또는 비슷한 공고 상단 노출 {coupon.weeks}주
            </p>
            <p className="pt-1 text-xs text-gray-600">
              {coupon.expiresAt.slice(0, 10).replaceAll('-', '.')}까지 사용 가능 · 소재 검수 → 확정
              → 자동 게재, 금액 0원
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={adApplyHref({})}>쿠폰으로 신청하기</Link>
          </Button>
        </div>
      ) : null}

      <Tabs
        aria-label="광고 상태"
        items={(['ALL', 'ACTIVE', 'ENDED'] as const).map((tab) => ({
          value: tab,
          label: data ? `${TAB_LABELS[tab]} ${data.counts[tab]}` : TAB_LABELS[tab],
        }))}
        value={query.tab}
        onValueChange={(tab) => router.push(buildMyAdsHref({ tab, page: 1 }))}
      />

      {isError ? (
        <p role="alert" className="text-sm text-error">
          광고 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : isPending ? (
        <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>
      ) : data.items.length === 0 ? (
        <EmptyState
          title={query.tab === 'ENDED' ? '종료된 광고가 없어요' : '아직 신청한 광고가 없어요'}
          description="게시 중인 공고를 지면 광고로 더 많은 취준생에게 보여줄 수 있어요."
          action={
            <Button asChild>
              <Link href={adApplyHref({})}>광고 신청하기</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((ad) => (
              <MyAdCard key={ad.id} ad={ad} />
            ))}
          </ul>
          {data.pageInfo.totalPages > 1 ? (
            <NumberedPagination
              pageInfo={data.pageInfo}
              buildHref={(page) => buildMyAdsHref({ tab: query.tab, page })}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
