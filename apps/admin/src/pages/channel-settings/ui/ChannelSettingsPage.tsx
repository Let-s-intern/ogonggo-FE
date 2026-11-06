import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ActionAlert,
  Button,
  Callout,
  Chip,
  ConfirmDelete,
  DataTable,
  Tabs,
  Toggle,
  type DataTableColumn,
} from '@ogonggo/ui';
import { AD_CHANNEL_PLATFORMS, type AdChannelPlatform } from '@ogonggo/api/src/ad-channels';
import { formatWon } from '@/entities/ad-contract/lib/adContract';
import {
  useAdChannelFormats,
  useAdChannels,
  useDeleteAdChannel,
  useDeleteAdChannelFormat,
  useReorderAdChannelFormats,
  useSaveAdChannel,
  useSaveAdChannelFormat,
  type AdChannel,
  type AdChannelFormat,
} from '@/entities/ad-channel/api/useAdChannels';
import { PLATFORM_COPY, channelLabel } from '@/entities/ad-channel/lib/adChannel';
import { AdChannelName } from '@/entities/ad-channel/ui/AdChannelName';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { formatCount } from '@/shared/lib/format';
import { PageHeader } from '@/widgets/page-header';
import { AdChannelFormModal } from './AdChannelFormModal';
import { ChannelFormatFormModal } from './ChannelFormatFormModal';

type Section = 'channels' | 'formats';

const PLATFORM_TABS = AD_CHANNEL_PLATFORMS.map((value) => ({
  value,
  label: PLATFORM_COPY[value].label,
}));

type Notify = (message: string) => void;

/** 주소의 `platform`. 없거나 모르는 값이면 인스타그램이다. */
function readPlatform(value: string | null): AdChannelPlatform {
  return AD_CHANNEL_PLATFORMS.find((platform) => platform === value) ?? 'INSTAGRAM';
}

/**
 * 채널 등록(`비즈니스 > 광고 > 채널 등록`, 이슈 #573, 2026-11-06 사용자). 채널 광고에서 고르는 우리 SNS·오픈채팅 채널(인스타그램
 * 계정, 카카오톡 오픈채팅방)과 플랫폼별 게재 유형(피드 게시물, 공지 등록 등)을 등록한다. 플랫폼 탭(`?platform=`)과 채널·게재
 * 유형 고르기(`?tab=formats`)는 주소에 남는다. 처음에는 인스타그램만 있던 `인스타 등록` 이었다(옛 주소 `/business/instagram`
 * 은 이리로 넘긴다).
 *
 * 광고가 잡힌 채널·유형은 지울 수 없다. 더 쓰지 않으려면 `사용` 을 끈다 — 이미 잡힌 광고의 채널·유형 이름이 남아야 한다.
 */
export function ChannelSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const platform = readPlatform(searchParams.get('platform'));
  const section: Section = searchParams.get('tab') === 'formats' ? 'formats' : 'channels';
  const copy = PLATFORM_COPY[platform];
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const notify: Notify = (message) => setAlert({ message, nonce: Date.now() });
  const [editingChannel, setEditingChannel] = useState<{ channel: AdChannel | null } | null>(null);
  const [editingFormat, setEditingFormat] = useState<{ format: AdChannelFormat | null } | null>(
    null,
  );
  const channels = useAdChannels();
  const formats = useAdChannelFormats();
  const platformChannels = (channels.data ?? []).filter((item) => item.platform === platform);
  const platformFormats = (formats.data ?? []).filter((item) => item.platform === platform);

  const update = (next: { platform?: AdChannelPlatform; section?: Section }) => {
    const params = new URLSearchParams();
    const nextPlatform = next.platform ?? platform;
    const nextSection = next.section ?? section;
    if (nextPlatform !== 'INSTAGRAM') params.set('platform', nextPlatform);
    if (nextSection === 'formats') params.set('tab', 'formats');
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="채널 등록"
        action={
          section === 'channels' ? (
            <Button size="sm" onClick={() => setEditingChannel({ channel: null })}>
              {copy.channelNoun} 추가
            </Button>
          ) : (
            <Button size="sm" onClick={() => setEditingFormat({ format: null })}>
              게재 유형 추가
            </Button>
          )
        }
      />
      <p className="-mt-3 pb-4 text-sm text-gray-500">
        SNS·오픈채팅 광고를 올리는 우리 채널과 올리는 방식을 플랫폼마다 등록합니다.
      </p>
      <Tabs
        items={PLATFORM_TABS}
        value={platform}
        onValueChange={(next) => update({ platform: next })}
        aria-label="플랫폼"
        className="mb-4"
      />
      <div className="flex gap-2 pb-4" role="group" aria-label="채널과 게재 유형">
        <Chip
          tone={section === 'channels' ? 'blue' : 'gray'}
          aria-pressed={section === 'channels'}
          onClick={() => update({ section: 'channels' })}
        >
          {copy.channelNoun} {formatCount(platformChannels.length)}
        </Chip>
        <Chip
          tone={section === 'formats' ? 'blue' : 'gray'}
          aria-pressed={section === 'formats'}
          onClick={() => update({ section: 'formats' })}
        >
          게재 유형 {formatCount(platformFormats.length)}
        </Chip>
      </div>

      {section === 'channels' ? (
        <ChannelTable
          platform={platform}
          rows={platformChannels}
          query={channels}
          onEdit={(channel) => setEditingChannel({ channel })}
          notify={notify}
        />
      ) : (
        <FormatTable
          platform={platform}
          rows={platformFormats}
          query={formats}
          channels={channels.data ?? []}
          onEdit={(format) => setEditingFormat({ format })}
          notify={notify}
        />
      )}

      {editingChannel ? (
        <AdChannelFormModal
          key={editingChannel.channel?.id ?? `new-${platform}`}
          channel={editingChannel.channel}
          platform={editingChannel.channel?.platform ?? platform}
          onClose={() => setEditingChannel(null)}
          onSaved={notify}
        />
      ) : null}
      {editingFormat ? (
        <ChannelFormatFormModal
          key={editingFormat.format?.id ?? `new-${platform}`}
          format={editingFormat.format}
          platform={editingFormat.format?.platform ?? platform}
          channels={channels.data ?? []}
          onClose={() => setEditingFormat(null)}
          onSaved={notify}
        />
      ) : null}
      {alert ? (
        <ActionAlert message={alert.message} nonce={alert.nonce} onDismiss={() => setAlert(null)} />
      ) : null}
    </>
  );
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label={`${label} 삭제`}
      className="border-red-200 whitespace-nowrap text-error hover:bg-red-50"
      onClick={onClick}
    >
      삭제
    </Button>
  );
}

function ChannelTable({
  platform,
  rows,
  query,
  onEdit,
  notify,
}: {
  platform: AdChannelPlatform;
  rows: AdChannel[];
  query: ReturnType<typeof useAdChannels>;
  onEdit: (channel: AdChannel) => void;
  notify: Notify;
}) {
  const copy = PLATFORM_COPY[platform];
  const [deleting, setDeleting] = useState<AdChannel | null>(null);
  const deleteMutation = useDeleteAdChannel();

  const columns: DataTableColumn<AdChannel>[] = [
    {
      key: 'channel',
      header: copy.channelNoun,
      width: 'min-w-56',
      render: (row) => <AdChannelName channel={row} imageUrl={row.profileImageUrl} />,
    },
    {
      key: 'url',
      header: '주소',
      width: 'w-64 max-w-64',
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm text-blue-600 underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.url}
        </a>
      ),
    },
    {
      key: 'members',
      header: copy.memberLabel,
      width: 'w-24',
      align: 'right',
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {row.memberCount === null ? '-' : `${formatCount(row.memberCount)}명`}
        </span>
      ),
    },
    {
      key: 'memo',
      header: '메모',
      render: (row) => (
        <span className="line-clamp-2 text-sm text-gray-700">{row.memo ?? '-'}</span>
      ),
    },
    {
      key: 'ads',
      header: '채널 광고',
      width: 'w-24',
      align: 'right',
      render: (row) => <span className="text-sm">{row.adCount}건</span>,
    },
    {
      key: 'enabled',
      header: '사용',
      width: 'w-28',
      render: (row) => <ChannelToggle channel={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-20',
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <DeleteButton
            label={channelLabel(row)}
            onClick={() => {
              deleteMutation.reset();
              setDeleting(row);
            }}
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <p className="pb-3 text-sm text-gray-500">
        채널 광고를 올리는 우리 {copy.channelTitle}입니다. 행을 눌러 고칩니다. 광고가 잡힌{' '}
        {copy.channelNoun}은 지울 수 없어 사용을 끕니다.
      </p>
      {query.isError ? <Callout tone="error">채널을 불러오지 못했습니다.</Callout> : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={onEdit}
        isLoading={query.isPending}
        emptyMessage={`등록된 ${copy.channelNoun}이 없습니다. ${copy.channelNoun} 추가로 더합니다.`}
      />
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting ? channelLabel(deleting) : ''}
        description={
          deleting && deleting.adCount > 0
            ? `이 ${copy.channelNoun}에 잡힌 채널 광고 ${deleting.adCount}건이 있어 지울 수 없습니다. 사용을 꺼 주세요.`
            : undefined
        }
        isDeleting={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? (serverErrorMessage(deleteMutation.error) ?? '삭제하지 못했습니다.')
            : undefined
        }
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify(`${channelLabel(deleting)} 을(를) 지웠습니다.`);
                setDeleting(null);
              },
            });
          }
        }}
      />
    </>
  );
}

function ChannelToggle({ channel }: { channel: AdChannel }) {
  const save = useSaveAdChannel(channel.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={channel.enabled}
        disabled={save.isPending}
        label={channel.enabled ? '사용' : '사용 안 함'}
        onChange={(next) => save.mutate({ enabled: next })}
      />
    </span>
  );
}

function FormatTable({
  platform,
  rows,
  query,
  channels,
  onEdit,
  notify,
}: {
  platform: AdChannelPlatform;
  /** 이 플랫폼의 유형. 순서대로다. */
  rows: AdChannelFormat[];
  query: ReturnType<typeof useAdChannelFormats>;
  channels: AdChannel[];
  onEdit: (format: AdChannelFormat) => void;
  notify: Notify;
}) {
  const copy = PLATFORM_COPY[platform];
  const reorder = useReorderAdChannelFormats();
  const [deleting, setDeleting] = useState<AdChannelFormat | null>(null);
  const deleteMutation = useDeleteAdChannelFormat();

  const move = (index: number, delta: -1 | 1) => {
    const ids = rows.map((row) => row.id);
    const [moved] = ids.splice(index, 1);
    if (moved === undefined) {
      return;
    }
    ids.splice(index + delta, 0, moved);
    reorder.mutate({ platform, formatIds: ids });
  };

  const channelNames = (format: AdChannelFormat) =>
    format.channelIds.length === 0
      ? `모든 ${copy.channelNoun}`
      : format.channelIds
          .map((id) => channels.find((channel) => channel.id === id))
          .map((channel) => (channel ? channelLabel(channel) : '지워진 채널'))
          .join(', ');

  const columns: DataTableColumn<AdChannelFormat>[] = [
    {
      key: 'order',
      header: '순서',
      width: 'w-14',
      render: (row) => (
        <span className="text-base font-bold text-gray-900">{rows.indexOf(row) + 1}</span>
      ),
    },
    {
      key: 'name',
      header: '이름',
      width: 'min-w-48',
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">{row.name}</span>
          {row.description ? (
            <span className="line-clamp-2 text-xs text-gray-500">{row.description}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'price',
      header: '기본 단가',
      width: 'w-32',
      align: 'right',
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {row.defaultPrice === null ? '-' : formatWon(row.defaultPrice)}
        </span>
      ),
    },
    {
      key: 'channels',
      header: `올릴 수 있는 ${copy.channelNoun}`,
      width: 'w-56',
      render: (row) => <span className="text-xs text-gray-700">{channelNames(row)}</span>,
    },
    {
      key: 'ads',
      header: '채널 광고',
      width: 'w-24',
      align: 'right',
      render: (row) => <span className="text-sm">{row.adCount}건</span>,
    },
    {
      key: 'enabled',
      header: '사용',
      width: 'w-28',
      render: (row) => <FormatToggle format={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-48',
      render: (row) => {
        const index = rows.indexOf(row);
        return (
          <span
            className="flex gap-1 whitespace-nowrap"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.name} 위로`}
              disabled={reorder.isPending || index === 0}
              onClick={() => move(index, -1)}
            >
              위로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.name} 아래로`}
              disabled={reorder.isPending || index === rows.length - 1}
              onClick={() => move(index, 1)}
            >
              아래로
            </Button>
            <DeleteButton
              label={row.name}
              onClick={() => {
                deleteMutation.reset();
                setDeleting(row);
              }}
            />
          </span>
        );
      },
    },
  ];

  return (
    <>
      <p className="pb-3 text-sm text-gray-500">
        {copy.label}에 올리는 방식입니다. 채널 광고와 광고 계약의 상품에서 이 순서로 보입니다.
        위로·아래로는 바로 저장됩니다. 행을 눌러 고칩니다.
      </p>
      {query.isError ? <Callout tone="error">게재 유형을 불러오지 못했습니다.</Callout> : null}
      {reorder.isError ? (
        <Callout tone="error" className="mb-4">
          순서를 바꾸지 못했습니다. 목록을 새로 불러온 뒤 다시 시도해 주세요.
        </Callout>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={onEdit}
        isLoading={query.isPending}
        emptyMessage="등록된 게재 유형이 없습니다. 게재 유형 추가로 더합니다."
      />
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.name ?? ''}
        description={
          deleting && deleting.adCount > 0
            ? `이 유형으로 잡힌 채널 광고 ${deleting.adCount}건이 있어 지울 수 없습니다. 사용을 꺼 주세요.`
            : '이 유형을 산 계약에서도 빠집니다.'
        }
        isDeleting={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? (serverErrorMessage(deleteMutation.error) ?? '삭제하지 못했습니다.')
            : undefined
        }
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify(`게재 유형 ${deleting.name} 을(를) 지웠습니다.`);
                setDeleting(null);
              },
            });
          }
        }}
      />
    </>
  );
}

function FormatToggle({ format }: { format: AdChannelFormat }) {
  const save = useSaveAdChannelFormat(format.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={format.enabled}
        disabled={save.isPending}
        label={format.enabled ? '사용' : '사용 안 함'}
        onChange={(next) => save.mutate({ enabled: next })}
      />
    </span>
  );
}
