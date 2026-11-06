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
import {
  AD_CHANNEL_PLATFORMS,
  CHANNEL_AD_STATUSES,
  type AdChannelPlatform,
} from '@ogonggo/api/src/ad-channels';
import { AdContractNote } from '@/entities/ad-contract/ui/AdContractNote';
import { advertiserFilterOptions } from '@/entities/advertiser/lib/advertiserFilter';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';
import {
  useAdChannelFormats,
  useAdChannels,
  useChannelAds,
  useDeleteChannelAd,
  type ChannelAd,
} from '@/entities/ad-channel/api/useAdChannels';
import {
  CHANNEL_AD_STATUS_BADGES,
  PLATFORM_COPY,
  channelAdPeriod,
  channelLabel,
  formatChannelAdDates,
  kstMonth,
} from '@/entities/ad-channel/lib/adChannel';
import { AdChannelName } from '@/entities/ad-channel/ui/AdChannelName';
import { ChannelAdFormModal, ChannelAdStatusSelect } from '@/widgets/channel-ad-form';
import { PageHeader } from '@/widgets/page-header';

/** 주소의 거르기 칸. `month` 가 없으면 이번 달, `all` 이면 모든 달이다. */
const FILTER_KEYS = ['month', 'platform', 'channel', 'format', 'status', 'advertiser'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

/**
 * 채널 광고(`비즈니스 > 광고 > 채널 광고`, 이슈 #573, 2026-11-06 사용자). 광고주 홍보를 우리 SNS·오픈채팅 채널(인스타그램 계정,
 * 카카오톡 오픈채팅방)에 올리는 일정을 잡고, 올린 뒤 게시 확인 주소와 상태를 적는다. 처음에는 인스타그램만 있던 `인스타 광고`
 * 였다(옛 주소 `/business/instagram-ads` 는 이리로 넘긴다).
 *
 * 달은 서버로 거르고(`?month=`), 플랫폼·채널·유형·상태·광고주는 받은 달 안에서 거른다. 거르기는 모두 주소에 남아 캘린더 등에서
 * 이 화면을 걸러 열 수 있다. 상태는 표에서 바로 바꾸고, 나머지 칸은 행을 눌러 여는 모달에서 고친다.
 */
export function ChannelAdsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (key: FilterKey) => searchParams.get(key) ?? '';
  const monthParam = filter('month');
  const month = monthParam === 'all' ? '' : monthParam || kstMonth();
  const [editing, setEditing] = useState<{ ad: ChannelAd | null } | null>(null);
  const [deleting, setDeleting] = useState<ChannelAd | null>(null);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const notify = (message: string) => setAlert({ message, nonce: Date.now() });

  const ads = useChannelAds({ month: month || undefined });
  const channels = useAdChannels();
  const formats = useAdChannelFormats();
  const deleteMutation = useDeleteChannelAd();
  const platform = AD_CHANNEL_PLATFORMS.find((value) => value === filter('platform')) ?? null;
  const inPlatform = (item: { platform: AdChannelPlatform }) =>
    platform === null || item.platform === platform;
  const all = ads.data ?? [];
  const rows = all.filter(
    (ad) =>
      inPlatform(ad) &&
      (!filter('channel') || String(ad.channelId) === filter('channel')) &&
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
    // 플랫폼을 바꾸면 다른 플랫폼의 채널·유형 거르기는 맞지 않아 지운다.
    if (key === 'platform') {
      next.delete('channel');
      next.delete('format');
    }
    setSearchParams(next, { replace: true });
  };

  const columns: DataTableColumn<ChannelAd>[] = [
    {
      key: 'date',
      header: '게시 예정일(KST)',
      width: 'w-40 whitespace-nowrap',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-sm text-gray-900">{formatChannelAdDates(row)}</span>
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
          <AdContractNote contract={row.contract} period={channelAdPeriod(row)} />
        </span>
      ),
    },
    {
      key: 'platform',
      header: '플랫폼',
      width: 'w-24 whitespace-nowrap',
      render: (row) => (
        <span className="text-sm text-gray-700">{PLATFORM_COPY[row.platform].short}</span>
      ),
    },
    {
      key: 'channel',
      header: '채널',
      width: 'w-52',
      render: (row) => <AdChannelName channel={row.channel} />,
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
      render: (row) => <ChannelAdStatusSelect ad={row} notify={notify} />,
    },
    {
      key: 'url',
      header: '게시 확인',
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
            aria-label={`${row.advertiser?.name ?? ''} ${row.postDate} 채널 광고 삭제`}
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
        title="채널 광고"
        action={
          <Button size="sm" onClick={() => setEditing({ ad: null })}>
            채널 광고 추가
          </Button>
        }
      />
      <p className="-mt-3 pb-4 text-sm text-gray-500">
        광고주 홍보를 우리 SNS·오픈채팅 채널(인스타그램 계정, 카카오톡 오픈채팅방)에 올리는
        일정입니다. 채널과 게재 유형은 채널 등록에서 정합니다.
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
          aria-label="플랫폼으로 거르기"
          options={[
            { value: '', label: '플랫폼 전체' },
            ...AD_CHANNEL_PLATFORMS.map((value) => ({
              value,
              label: PLATFORM_COPY[value].label,
            })),
          ]}
          value={platform ?? ''}
          onChange={(event) => setFilter('platform', event.target.value)}
        />
        <Select
          aria-label="채널로 거르기"
          options={[
            { value: '', label: '채널 전체' },
            ...(channels.data ?? []).filter(inPlatform).map((channel) => ({
              value: String(channel.id),
              label: platform
                ? channelLabel(channel)
                : `${PLATFORM_COPY[channel.platform].short} · ${channelLabel(channel)}`,
            })),
          ]}
          value={filter('channel')}
          onChange={(event) => setFilter('channel', event.target.value)}
        />
        <Select
          aria-label="유형으로 거르기"
          options={[
            { value: '', label: '유형 전체' },
            ...(formats.data ?? []).filter(inPlatform).map((format) => ({
              value: String(format.id),
              label: platform
                ? format.name
                : `${PLATFORM_COPY[format.platform].short} · ${format.name}`,
            })),
          ]}
          value={filter('format')}
          onChange={(event) => setFilter('format', event.target.value)}
        />
        <Select
          aria-label="상태로 거르기"
          options={[
            { value: '', label: '상태 전체' },
            ...CHANNEL_AD_STATUSES.map((value) => ({
              value,
              label: CHANNEL_AD_STATUS_BADGES[value].label,
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
          채널 광고를 불러오지 못했습니다.
        </Callout>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setEditing({ ad: row })}
        isLoading={ads.isPending}
        emptyMessage={
          filtered ? '조건에 맞는 채널 광고가 없습니다.' : '이 달에 잡힌 채널 광고가 없습니다.'
        }
      />

      {editing ? (
        <ChannelAdFormModal
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
            ? `${deleting.advertiser?.name ?? '광고주 없음'} ${formatChannelAdDates(deleting)}`
            : ''
        }
        description={
          deleting
            ? `게시 일정만 지웁니다. 이미 올린 ${PLATFORM_COPY[deleting.platform].label} 글은 직접 내려야 합니다.`
            : undefined
        }
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify('채널 광고를 지웠습니다.');
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
