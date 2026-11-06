import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ActionAlert,
  Button,
  Callout,
  ConfirmDelete,
  DataTable,
  Input,
  Select,
  type DataTableColumn,
} from '@ogonggo/ui';
import { INSTAGRAM_AD_STATUSES } from '@ogonggo/api/src/instagram';
import { AdContractNote } from '@/entities/ad-contract/ui/AdContractNote';
import { advertiserFilterOptions } from '@/entities/advertiser/lib/advertiserFilter';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';
import {
  useDeleteInstagramAd,
  useInstagramAccounts,
  useInstagramAds,
  useInstagramFormats,
  type InstagramAd,
} from '@/entities/instagram/api/useInstagram';
import {
  INSTAGRAM_AD_STATUS_BADGES,
  formatInstagramDates,
  instagramAdPeriod,
  instagramHandle,
  kstMonth,
} from '@/entities/instagram/lib/instagram';
import { InstagramAccountName } from '@/entities/instagram/ui/InstagramAccountName';
import { PageHeader } from '@/widgets/page-header';
import { InstagramAdFormModal, InstagramAdStatusSelect } from '@/widgets/instagram-ad-form';

/** 주소의 거르기 칸. `month` 가 없으면 이번 달, `all` 이면 모든 달이다. */
const FILTER_KEYS = ['month', 'account', 'format', 'status', 'advertiser'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

/**
 * 인스타 광고(`비즈니스 > 광고 > 인스타 광고`, 이슈 #573, 2026-11-06 사용자). 광고주 홍보를 우리 인스타그램 계정에 올리는 일정을
 * 잡고, 올린 뒤 게시물 주소와 상태를 적는다.
 *
 * 달은 서버로 거르고(`?month=`), 계정·유형·상태·광고주는 받은 달 안에서 거른다. 거르기는 모두 주소에 남아 캘린더 등에서 이
 * 화면을 걸러 열 수 있다. 상태는 표에서 바로 바꾸고, 나머지 칸은 행을 눌러 여는 모달에서 고친다.
 */
export function InstagramAdsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (key: FilterKey) => searchParams.get(key) ?? '';
  const monthParam = filter('month');
  const month = monthParam === 'all' ? '' : monthParam || kstMonth();
  const [editing, setEditing] = useState<{ ad: InstagramAd | null } | null>(null);
  const [deleting, setDeleting] = useState<InstagramAd | null>(null);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const notify = (message: string) => setAlert({ message, nonce: Date.now() });

  const ads = useInstagramAds({ month: month || undefined });
  const accounts = useInstagramAccounts();
  const formats = useInstagramFormats();
  const deleteMutation = useDeleteInstagramAd();
  const all = ads.data ?? [];
  const rows = all.filter(
    (ad) =>
      (!filter('account') || String(ad.accountId) === filter('account')) &&
      (!filter('format') || String(ad.formatId) === filter('format')) &&
      (!filter('status') || ad.status === filter('status')) &&
      (!filter('advertiser') || String(ad.advertiserId) === filter('advertiser')),
  );
  const statusCount = (status: string) => rows.filter((ad) => ad.status === status).length;
  const filtered = FILTER_KEYS.some((key) => key !== 'month' && filter(key));

  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const columns: DataTableColumn<InstagramAd>[] = [
    {
      key: 'date',
      header: '게시 예정일(KST)',
      width: 'w-40 whitespace-nowrap',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-sm text-gray-900">{formatInstagramDates(row)}</span>
          {row.endDate && row.endDate !== row.postDate ? (
            <span className="text-xs text-gray-500">기간 노출</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'advertiser',
      header: '광고주',
      width: 'w-44',
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <AdvertiserName advertiser={row.advertiser} />
          <AdContractNote contract={row.contract} period={instagramAdPeriod(row)} />
        </span>
      ),
    },
    {
      key: 'account',
      header: '계정',
      width: 'w-48',
      render: (row) => <InstagramAccountName account={row.account} />,
    },
    {
      key: 'format',
      header: '유형',
      width: 'w-32 whitespace-nowrap',
      render: (row) => (
        <span className="text-sm text-gray-900">{row.format?.name ?? '지워진 유형'}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-32',
      render: (row) => <InstagramAdStatusSelect ad={row} notify={notify} />,
    },
    {
      key: 'url',
      header: '게시물',
      width: 'w-24',
      render: (row) =>
        row.postUrl ? (
          <a
            href={row.postUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 underline"
            onClick={(event) => event.stopPropagation()}
          >
            열기
          </a>
        ) : (
          <span className="text-sm text-gray-400">없음</span>
        ),
    },
    {
      key: 'memo',
      header: '소재·문구',
      render: (row) => (
        <span className="line-clamp-2 text-xs text-gray-700">{row.creativeMemo ?? '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-20',
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            aria-label={`${row.advertiser?.name ?? ''} ${row.postDate} 인스타 광고 삭제`}
            className="border-red-200 whitespace-nowrap text-error hover:bg-red-50"
            onClick={() => {
              deleteMutation.reset();
              setDeleting(row);
            }}
          >
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="인스타 광고"
        action={
          <Button size="sm" onClick={() => setEditing({ ad: null })}>
            인스타 광고 추가
          </Button>
        }
      />
      <p className="-mt-3 pb-4 text-sm text-gray-500">
        광고주 홍보를 우리 인스타그램 계정에 올리는 일정입니다. 계정과 게재 유형은 인스타 등록에서
        정합니다.
      </p>

      <div className="flex flex-wrap items-center gap-2 pb-4">
        <Input
          type="month"
          aria-label="달"
          className="w-40"
          value={month}
          onChange={(event) => setFilter('month', event.target.value || 'all')}
        />
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={monthParam === 'all'}
          onClick={() => setFilter('month', monthParam === 'all' ? '' : 'all')}
        >
          {monthParam === 'all' ? '이번 달 보기' : '모든 달 보기'}
        </Button>
        <Select
          aria-label="계정으로 거르기"
          options={[
            { value: '', label: '계정 전체' },
            ...(accounts.data ?? []).map((account) => ({
              value: String(account.id),
              label: instagramHandle(account.handle),
            })),
          ]}
          value={filter('account')}
          onChange={(event) => setFilter('account', event.target.value)}
        />
        <Select
          aria-label="유형으로 거르기"
          options={[
            { value: '', label: '유형 전체' },
            ...(formats.data ?? []).map((format) => ({
              value: String(format.id),
              label: format.name,
            })),
          ]}
          value={filter('format')}
          onChange={(event) => setFilter('format', event.target.value)}
        />
        <Select
          aria-label="상태로 거르기"
          options={[
            { value: '', label: '상태 전체' },
            ...INSTAGRAM_AD_STATUSES.map((value) => ({
              value,
              label: INSTAGRAM_AD_STATUS_BADGES[value].label,
            })),
          ]}
          value={filter('status')}
          onChange={(event) => setFilter('status', event.target.value)}
        />
        <Select
          aria-label="광고주로 거르기"
          options={advertiserFilterOptions(all)}
          value={filter('advertiser')}
          onChange={(event) => setFilter('advertiser', event.target.value)}
        />
        {filtered ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setSearchParams(monthParam ? { month: monthParam } : {}, { replace: true })
            }
          >
            거르기 지우기
          </Button>
        ) : null}
      </div>
      <p className="pb-3 text-sm text-gray-700" aria-live="polite">
        {month ? `${month.replace('-', '년 ')}월` : '모든 달'} {rows.length}건
        <span className="text-gray-500">
          {' '}
          · 예정 {statusCount('SCHEDULED')} · 게시 완료 {statusCount('PUBLISHED')} · 취소{' '}
          {statusCount('CANCELED')}
        </span>
      </p>

      {ads.isError ? (
        <Callout tone="error" className="mb-4">
          인스타 광고를 불러오지 못했습니다.
        </Callout>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setEditing({ ad: row })}
        isLoading={ads.isPending}
        emptyMessage={
          filtered ? '조건에 맞는 인스타 광고가 없습니다.' : '이 달에 잡힌 인스타 광고가 없습니다.'
        }
      />

      {editing ? (
        <InstagramAdFormModal
          key={editing.ad?.id ?? 'new'}
          ad={editing.ad}
          onClose={() => setEditing(null)}
          onSaved={notify}
        />
      ) : null}
      <ConfirmDelete
        open={deleting !== null}
        targetName={
          deleting
            ? `${deleting.advertiser?.name ?? '광고주 없음'} ${formatInstagramDates(deleting)}`
            : ''
        }
        description="게시 일정만 지웁니다. 이미 올린 인스타그램 게시물은 직접 내려야 합니다."
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify('인스타 광고를 지웠습니다.');
                setDeleting(null);
              },
            });
          }
        }}
      />
      {alert ? (
        <ActionAlert message={alert.message} nonce={alert.nonce} onDismiss={() => setAlert(null)} />
      ) : null}
    </>
  );
}
