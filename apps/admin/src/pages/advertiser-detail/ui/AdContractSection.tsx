import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  ConfirmDelete,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@ogonggo/ui';
import {
  useDeleteAdContract,
  type AdContract,
  type useAdContracts,
} from '@/entities/ad-contract/api/useAdContracts';
import {
  AD_CONTRACT_STATUS_BADGES,
  adContractName,
  adContractStatus,
  formatWon,
  vatLabel,
  vatTotalNote,
} from '@/entities/ad-contract/lib/adContract';
import type { Advertiser } from '@/entities/advertiser/api/useAdvertisers';
import { useAdChannelFormats } from '@/entities/ad-channel/api/useAdChannels';
import { channelProductLabel } from '@/entities/ad-channel/lib/adChannel';
import {
  adContractProductLabel,
  formatContractPeriod,
} from '@/features/ad-contract-picker/lib/adContractProduct';
import { formatCount } from '@/shared/lib/format';
import { AdContractFormModal } from './AdContractFormModal';

/** `2026-10-28` → `2026.10.28`. */
const formatDate = (value: string) => value.replaceAll('-', '.');

/**
 * 광고 계약(이슈 #573, 2026-11-06 사용자). 광고 계약 상세의 배너·광고 공고 위에 둔다. 계약을 더하고 고치고 지우며, 행의
 * `배너 추가`·`광고 공고 추가`·`채널 광고 추가` 는 그 계약이 골라지고 기간(채널 광고는 게시 예정일)이 채워진 모달을 연다.
 */
export function AdContractSection({
  advertiser,
  query,
  onAddBanner,
  onAddAdPosting,
  onAddChannelAd,
  notify,
}: {
  advertiser: Advertiser;
  query: ReturnType<typeof useAdContracts>;
  onAddBanner: (contract: AdContract) => void;
  onAddAdPosting: (contract: AdContract) => void;
  onAddChannelAd: (contract: AdContract) => void;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState<{ contract: AdContract | null } | null>(null);
  const [deleting, setDeleting] = useState<AdContract | null>(null);
  const deleteMutation = useDeleteAdContract();
  const rows = query.data ?? [];
  const channelFormats = useAdChannelFormats();
  const productLabels = (row: AdContract) => [
    ...row.products.map(adContractProductLabel),
    ...row.channelFormatIds.map((id) =>
      channelProductLabel(
        channelFormats.data?.find((format) => format.id === id),
        id,
      ),
    ),
  ];
  const paidAmount = rows.filter((row) => row.paid).reduce((sum, row) => sum + row.amount, 0);
  // 합계는 적힌 금액을 그대로 더한다. 포함·별도가 섞이면 그렇다고 알린다(2026-11-06 사용자).
  const vatNote = vatTotalNote(rows.map((row) => row.vatIncluded));

  const columns: DataTableColumn<AdContract>[] = [
    {
      key: 'name',
      header: '계약',
      width: 'min-w-36',
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">{adContractName(row)}</span>
          {row.memo ? <span className="line-clamp-1 text-xs text-gray-500">{row.memo}</span> : null}
        </span>
      ),
    },
    {
      key: 'period',
      header: '광고 기간(KST)',
      width: 'w-44',
      render: (row) => <span className="text-sm">{formatContractPeriod(row)}</span>,
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-20',
      render: (row) => {
        const badge = AD_CONTRACT_STATUS_BADGES[adContractStatus(row)];
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      key: 'amount',
      header: '금액',
      align: 'right',
      width: 'w-36',
      render: (row) => (
        <span className="flex flex-col items-end">
          <span className="whitespace-nowrap">{formatWon(row.amount)}</span>
          <span className="text-xs whitespace-nowrap text-gray-500">
            ({vatLabel(row.vatIncluded)})
          </span>
        </span>
      ),
    },
    {
      key: 'paid',
      header: '결제',
      width: 'w-28',
      render: (row) =>
        row.paid ? (
          <span className="flex flex-col">
            <Badge tone="success">결제 완료</Badge>
            {row.paidDate ? (
              <span className="pt-0.5 text-xs text-gray-500">{formatDate(row.paidDate)}</span>
            ) : null}
          </span>
        ) : (
          <Badge tone="urgent">미결제</Badge>
        ),
    },
    {
      key: 'products',
      header: '상품',
      width: 'min-w-44',
      render: (row) => (
        <span className="text-xs text-gray-700">
          {productLabels(row).length === 0 ? '정하지 않음' : productLabels(row).join(', ')}
        </span>
      ),
    },
    {
      key: 'linked',
      header: '이어 둔 광고',
      width: 'w-28',
      render: (row) => (
        <span className="flex flex-col text-xs whitespace-nowrap text-gray-700">
          <span>
            배너 {row.bannerCount} · 광고 공고 {row.adPostingCount}
          </span>
          <span>채널 광고 {row.channelAdCount}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-64',
      render: (row) => (
        <span className="grid grid-cols-2 gap-1" onClick={(event) => event.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            className="whitespace-nowrap"
            onClick={() => onAddBanner(row)}
          >
            배너 추가
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="whitespace-nowrap"
            onClick={() => onAddAdPosting(row)}
          >
            광고 공고 추가
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="whitespace-nowrap"
            onClick={() => onAddChannelAd(row)}
          >
            채널 광고 추가
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label={`${adContractName(row)} 계약 삭제`}
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
      <div className="flex items-center justify-between gap-2 pt-8 pb-3">
        <h2 className="text-base font-bold text-gray-900">
          광고 계약 {formatCount(advertiser.contractCount)}건
        </h2>
        <Button size="sm" onClick={() => setEditing({ contract: null })}>
          계약 추가
        </Button>
      </div>
      <p className="pb-3 text-sm text-gray-700" aria-label="계약 금액 합계">
        금액 합계{' '}
        <span className="font-semibold text-gray-900">
          {formatWon(advertiser.contractTotalAmount)}
        </span>
        {vatNote ? <span className="text-xs text-gray-500"> ({vatNote})</span> : null}
        <span className="text-gray-500">
          {' '}
          · 결제 완료 {formatWon(paidAmount)} · 미결제{' '}
          {formatWon(advertiser.contractTotalAmount - paidAmount)} · 진행 중{' '}
          {formatCount(advertiser.activeContractCount)}건
        </span>
      </p>
      {query.isError ? <Callout tone="error">계약을 불러오지 못했습니다.</Callout> : null}
      {!query.isPending && !query.isError && rows.length === 0 ? (
        <EmptyState
          title="이 광고주의 계약이 없습니다"
          description="기간·금액·자리를 적어 두면 배너와 광고 공고를 더할 때 그대로 채워집니다."
          action={
            <Button size="sm" onClick={() => setEditing({ contract: null })}>
              계약 추가
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => setEditing({ contract: row })}
          isLoading={query.isPending}
          emptyMessage="이 광고주의 계약이 없습니다."
        />
      )}

      {editing ? (
        <AdContractFormModal
          key={editing.contract?.id ?? 'new'}
          advertiserId={advertiser.id}
          contract={editing.contract}
          onClose={() => setEditing(null)}
          onSaved={() => notify(editing.contract ? '계약을 고쳤습니다.' : '계약을 더했습니다.')}
        />
      ) : null}
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting ? adContractName(deleting) : ''}
        description={
          deleting
            ? `이어 둔 배너 ${deleting.bannerCount}건, 광고 공고 ${deleting.adPostingCount}건, 채널 광고 ${deleting.channelAdCount}건은 지우지 않고 계약만 끊습니다.`
            : undefined
        }
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => {
                notify('계약을 지웠습니다.');
                setDeleting(null);
              },
            });
          }
        }}
      />
    </>
  );
}
