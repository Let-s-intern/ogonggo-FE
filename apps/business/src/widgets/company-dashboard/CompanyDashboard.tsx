'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import {
  listMyAdvertisementContracts,
  type MyAdvertisementContractSummaryResponse,
  type MyAdvertisementContractSummaryResponseStatus,
  type SuccessResponsePageResponseMyAdvertisementContractSummaryResponse,
} from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { StageTrack } from '@/shared/ui/StageTrack';
import {
  companyPostStage,
  CompanyPostStageTrack,
  fetchCompanyPosts,
  type CompanyPostRow,
  type CompanyPostStage,
} from '@/widgets/company-posts';
import {
  MY_AD_CONTRACTS_HREF,
  myAdContractHref,
  STATUS_STEPS,
} from '@/widgets/my-ad-contracts/model';

/** 공고 건수를 세려고 한 번에 받는 수. 기업 한 곳의 공고는 이보다 적다. 넘으면 앞의 것만 센다. */
const POST_FETCH_SIZE = 100;
/** 최근 목록에 보이는 수. */
const RECENT_SIZE = 3;

const AD_STATUSES: readonly MyAdvertisementContractSummaryResponseStatus[] = [
  'REQUESTED',
  'NEGOTIATING',
  'APPROVED',
  'REJECTED',
];

type Load<T> = { kind: 'loading' } | { kind: 'ready'; value: T } | { kind: 'error' };

interface PostSummary {
  counts: Record<CompanyPostStage, number>;
  recent: (CompanyPostRow & { stage: CompanyPostStage })[];
}

interface AdSummary {
  counts: Record<MyAdvertisementContractSummaryResponseStatus, number>;
  recent: MyAdvertisementContractSummaryResponse[];
}

type AdPage = SuccessResponsePageResponseMyAdvertisementContractSummaryResponse;

/** 채용공고·부트캠프를 모두 받아 단계별로 센다. 최근 것은 두 종류를 섞어 앞에서부터 고른다. */
async function loadPosts(): Promise<PostSummary> {
  const [jobs, bootcamps] = await Promise.all([
    fetchCompanyPosts({ tab: 'jobs', page: 1 }, POST_FETCH_SIZE),
    fetchCompanyPosts({ tab: 'bootcamps', page: 1 }, POST_FETCH_SIZE),
  ]);
  const rows = [...jobs.rows, ...bootcamps.rows].map((row) => ({
    ...row,
    stage: companyPostStage(row),
  }));
  const counts: Record<CompanyPostStage, number> = {
    REVIEWING: 0,
    REJECTED: 0,
    PUBLISHED: 0,
    ENDED: 0,
  };
  for (const row of rows) counts[row.stage] += 1;
  // 응답에 등록일이 없어 각 목록의 순서(최근 것부터)를 믿고 번갈아 고른다.
  const recent = [rows.filter((r) => r.kind === 'job'), rows.filter((r) => r.kind === 'bootcamp')]
    .flatMap((list) => list.slice(0, RECENT_SIZE))
    .slice(0, RECENT_SIZE);
  return { counts, recent };
}

/** 상태마다 한 건씩 불러 전체 건수만 읽고, 최근 신청은 따로 받는다(`GET /api/v1/users/me/advertisement-contracts`). */
async function loadAds(): Promise<AdSummary> {
  const list = (params: Parameters<typeof listMyAdvertisementContracts>[0]) =>
    listMyAdvertisementContracts(params) as unknown as Promise<AdPage>;
  const [recent, ...byStatus] = await Promise.all([
    list({ page: 1, size: RECENT_SIZE }),
    ...AD_STATUSES.map((status) => list({ page: 1, size: 1, status: [status] })),
  ]);
  const counts = Object.fromEntries(
    AD_STATUSES.map((status, i) => [status, byStatus[i]?.data?.pageInfo.totalElements ?? 0]),
  ) as AdSummary['counts'];
  return { counts, recent: recent?.data?.items ?? [] };
}

/** 화면에 들어올 때 한 번 읽는다. `load` 는 모듈 함수라 바뀌지 않는다. */
function useLoad<T>(load: () => Promise<T>): Load<T> {
  const [state, setState] = useState<Load<T>>({ kind: 'loading' });
  useEffect(() => {
    if (!isSignedIn()) return;
    let active = true;
    load()
      .then((value) => active && setState({ kind: 'ready', value }))
      .catch(() => active && setState({ kind: 'error' }));
    return () => {
      active = false;
    };
  }, [load]);
  return state;
}

function Panel({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-gray-200 p-5 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-950">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900"
        >
          {linkLabel}
          <span aria-hidden="true" className="icon-[lucide--chevron-right] block size-4" />
        </Link>
      </header>
      {children}
    </section>
  );
}

/** 단계별 건수 한 줄. `alert` 칸은 0보다 크면 빨갛게 보인다(반려). */
function Counts({
  items,
  state,
}: {
  items: { label: string; value: number | undefined; alert?: boolean; strong?: boolean }[];
  state: Load<unknown>['kind'];
}) {
  return (
    <dl className="mt-5 grid grid-cols-4 divide-x divide-gray-100 rounded-lg bg-gray-50 py-4">
      {items.map((item) => {
        const alert = item.alert && (item.value ?? 0) > 0;
        return (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <dt className={cn('text-xs', alert ? 'font-semibold text-error' : 'text-gray-500')}>
              {item.label}
            </dt>
            <dd
              className={cn(
                'text-2xl font-bold',
                alert ? 'text-error' : item.strong ? 'text-blue-500' : 'text-gray-900',
              )}
            >
              {state === 'ready' ? item.value : '-'}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-gray-500">{children}</p>;
}

const QUICK_ACTIONS = [
  {
    href: '/mypage/company/posts/jobs/new',
    label: '채용공고 등록',
    hint: '인턴 · 신입 · 경력 채용',
    icon: 'icon-[lucide--briefcase]',
  },
  {
    href: '/mypage/company/posts/bootcamps/new',
    label: '부트캠프 등록',
    hint: '교육 · 부트캠프 모집',
    icon: 'icon-[lucide--graduation-cap]',
  },
  {
    href: '/apply/ad',
    label: '광고 신청',
    hint: '오늘의 공고 · SNS · 카카오톡',
    icon: 'icon-[lucide--megaphone]',
  },
] as const;

/**
 * 기업 회원 대시보드(`/mypage/company`). 로그인하면 여기로 온다(2026-11-10 사용자). 공고 현황(단계별 건수와
 * 최근 공고), 광고 신청 현황(상태별 건수와 최근 신청), 바로가기를 한 화면에 둔다.
 *
 * 공고 목록 API 는 단계로 거를 수 없어(`page`·`size` 뿐) 앞의 100건을 받아 단계를 직접 센다. 광고 신청은 상태로
 * 거를 수 있어 상태마다 한 건씩 불러 전체 건수만 읽는다.
 *
 * 처음 온 기업(공고·신청이 모두 0건)에게는 바로가기를 맨 위에 크게 둔다.
 */
export function CompanyDashboard() {
  const account = useMyAccount();
  const posts = useLoad(loadPosts);
  const ads = useLoad(loadAds);

  const organizationName =
    account.kind === 'ready' ? account.account.companyProfile?.organizationName : undefined;
  const postCounts = posts.kind === 'ready' ? posts.value.counts : undefined;
  const adCounts = ads.kind === 'ready' ? ads.value.counts : undefined;
  const isNew =
    posts.kind === 'ready' &&
    ads.kind === 'ready' &&
    posts.value.recent.length === 0 &&
    ads.value.recent.length === 0;

  const quickActions = (
    <section aria-label="바로가기" className="grid gap-3 sm:grid-cols-3">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-5 py-4 transition-colors',
            isNew
              ? 'border-blue-200 bg-blue-00 hover:border-blue-400'
              : 'border-gray-200 hover:border-gray-300',
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <span aria-hidden="true" className={cn('block size-5', action.icon)} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-gray-900">{action.label}</span>
            <span className="block truncate text-xs text-gray-500">{action.hint}</span>
          </span>
        </Link>
      ))}
    </section>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">
          {organizationName ? `${organizationName} 대시보드` : '대시보드'}
        </h1>
        <p className="pt-2 text-sm text-gray-500">
          {isNew
            ? '첫 공고를 등록하거나 광고를 신청해 보세요.'
            : '공고와 광고 신청의 진행 상황을 한눈에 확인하세요.'}
        </p>
      </header>

      {isNew ? quickActions : null}

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel title="공고 현황" href="/mypage/company/posts/jobs" linkLabel="등록 내역">
          <Counts
            state={posts.kind}
            items={[
              { label: '검수 중', value: postCounts?.REVIEWING },
              { label: '반려', value: postCounts?.REJECTED, alert: true },
              { label: '게시 중', value: postCounts?.PUBLISHED, strong: true },
              { label: '종료', value: postCounts?.ENDED },
            ]}
          />
          {posts.kind === 'error' ? (
            <Empty>공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</Empty>
          ) : posts.kind === 'ready' && posts.value.recent.length === 0 ? (
            <Empty>아직 등록한 공고가 없어요.</Empty>
          ) : posts.kind === 'ready' ? (
            <ul className="mt-4 divide-y divide-gray-100">
              {posts.value.recent.map((row) => (
                <li
                  key={row.key}
                  className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">
                      {row.kind === 'job' ? '채용공고' : '부트캠프'}
                    </p>
                    <p className="truncate font-semibold text-gray-900">{row.title}</p>
                  </div>
                  <CompanyPostStageTrack stage={row.stage} />
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>

        <Panel title="광고 신청 현황" href={MY_AD_CONTRACTS_HREF} linkLabel="신청 내역">
          <Counts
            state={ads.kind}
            items={[
              { label: '신청', value: adCounts?.REQUESTED },
              { label: '협의 중', value: adCounts?.NEGOTIATING },
              { label: '승인', value: adCounts?.APPROVED, strong: true },
              { label: '반려', value: adCounts?.REJECTED, alert: true },
            ]}
          />
          {ads.kind === 'error' ? (
            <Empty>광고 신청을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</Empty>
          ) : ads.kind === 'ready' && ads.value.recent.length === 0 ? (
            <Empty>아직 광고 신청이 없어요.</Empty>
          ) : ads.kind === 'ready' ? (
            <ul className="mt-4 divide-y divide-gray-100">
              {ads.value.recent.map((item) => (
                <li key={item.id}>
                  <Link
                    href={myAdContractHref(item.id)}
                    className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs text-gray-500">{item.companyName}</p>
                      <p className="truncate font-semibold text-gray-900 hover:underline">
                        {item.recruitmentTitle}
                      </p>
                    </div>
                    <StageTrack steps={STATUS_STEPS[item.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      </div>

      {isNew ? null : quickActions}
    </div>
  );
}
