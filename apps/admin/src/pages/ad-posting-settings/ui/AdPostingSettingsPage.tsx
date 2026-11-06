import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  ConfirmDelete,
  DataTable,
  Select,
  Tabs,
  Toggle,
  type DataTableColumn,
} from '@ogonggo/ui';
import { AD_POSTING_PLACEMENTS, type AdPostingPlacement } from '@ogonggo/api/src/ad-postings';
import {
  useAdPostingList,
  useDeleteAdPosting,
  useReorderAdPostings,
  useUpdateAdPosting,
  type AdPosting,
} from '@/entities/ad-posting/api/useAdPostings';
import {
  AD_PLACEMENT_DESCRIPTIONS,
  AD_PLACEMENT_LABELS,
  AD_POSTING_STATUS_BADGES,
  adPostingStatus,
} from '@/entities/ad-posting/lib/adPosting';
import { advertiserFilterOptions } from '@/entities/advertiser/lib/advertiserFilter';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';
import { formatPeriod } from '@/entities/banner/lib/banner';
import { PageHeader } from '@/widgets/page-header';
import { AdPostingFormModal } from '@/widgets/ad-posting-form';

const PLACEMENT_TABS = AD_POSTING_PLACEMENTS.map((value) => ({
  value,
  label: AD_PLACEMENT_LABELS[value],
}));

/** 열린 모달. `adPosting` 이 `null` 이면 새 광고다. */
type Editing = { adPosting: AdPosting | null } | null;

/**
 * 광고 공고 세팅(이슈 #573). 자리마다 광고할 채용공고·부트캠프를 고르고, 칸 순서·기간·켜기·광고주를 정한다.
 *
 * 순서가 곧 칸이다 — 1번은 그 목록의 첫 칸, 2번은 둘째 칸이고 일반 공고는 광고 뒤에 이어진다. 표는 꺼진 것·기간이 끝난
 * 것까지 모두 보이고 `칸` 번호는 지금 나가는 광고만 셌을 때의 자리를 함께 적는다. 꺼진 광고는 칸을 차지하지 않는다.
 *
 * 화면 짜임은 배너 세팅(`pages/banner-settings`)과 같다. 순서는 위로·아래로를 누를 때마다 바로 저장한다.
 */
export function AdPostingSettingsPage() {
  const [placement, setPlacement] = useState<AdPostingPlacement>('JOB_LIST');
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<AdPosting | null>(null);
  const [advertiserFilter, setAdvertiserFilter] = useState('');
  const { data, isPending, isError } = useAdPostingList(placement);
  const reorder = useReorderAdPostings(placement);
  const deleteMutation = useDeleteAdPosting();
  const rows = data ?? [];
  const shownRows = rows.filter(
    (row) => advertiserFilter === '' || String(row.advertiser?.id) === advertiserFilter,
  );
  /** 지금 나가는 광고만 센 칸 번호. 꺼졌거나 기간 밖이면 없다. */
  const liveRows = rows.filter((row) => adPostingStatus(row) === 'LIVE');

  const move = (index: number, delta: -1 | 1) => {
    const ids = rows.map((row) => row.id);
    const [moved] = ids.splice(index, 1);
    if (moved === undefined) {
      return;
    }
    ids.splice(index + delta, 0, moved);
    reorder.mutate(ids);
  };

  const columns: DataTableColumn<AdPosting>[] = [
    {
      key: 'order',
      header: '순서',
      width: 'w-20 whitespace-nowrap',
      render: (row) => {
        const slot = liveRows.indexOf(row);
        return (
          <span className="flex flex-col">
            <span className="text-base font-bold text-gray-900">{rows.indexOf(row) + 1}</span>
            <span className="text-xs text-gray-500">
              {slot === -1 ? '칸 없음' : `${slot + 1}번째 칸`}
            </span>
          </span>
        );
      },
    },
    {
      key: 'target',
      header: '대상',
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">{row.targetTitle || '지워진 대상'}</span>
          <span className="text-xs text-gray-500">
            {row.targetCompanyName} · {row.targetId}번
          </span>
        </span>
      ),
    },
    {
      key: 'advertiser',
      header: '광고주',
      width: 'w-44',
      render: (row) => <AdvertiserName advertiser={row.advertiser} />,
    },
    {
      key: 'period',
      header: '노출 기간(KST)',
      width: 'w-56',
      render: (row) => <span className="text-sm">{formatPeriod(row)}</span>,
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-32',
      render: (row) => {
        const badge = AD_POSTING_STATUS_BADGES[adPostingStatus(row)];
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      key: 'enabled',
      header: '켜기',
      width: 'w-24',
      render: (row) => <EnabledToggle placement={placement} adPosting={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-52',
      render: (row) => {
        const index = rows.indexOf(row);
        const name = row.targetTitle || `${row.targetId}번`;
        return (
          // 행 전체가 수정 모달을 여는 자리라 버튼 클릭은 여기서 멈춘다.
          <span
            className="flex gap-1 whitespace-nowrap"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${name} 위로`}
              disabled={reorder.isPending || index === 0}
              onClick={() => move(index, -1)}
            >
              위로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${name} 아래로`}
              disabled={reorder.isPending || index === rows.length - 1}
              onClick={() => move(index, 1)}
            >
              아래로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${name} 삭제`}
              className="border-red-200 text-error hover:bg-red-50"
              onClick={() => {
                deleteMutation.reset();
                setDeleting(row);
              }}
            >
              삭제
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="광고 공고 세팅"
        action={
          <Button size="sm" onClick={() => setEditing({ adPosting: null })}>
            광고 공고 추가
          </Button>
        }
      />

      <Tabs
        items={PLACEMENT_TABS}
        value={placement}
        onValueChange={(next) => {
          setPlacement(next);
          setAdvertiserFilter('');
        }}
        aria-label="광고 공고 자리"
        className="mb-4"
      />
      <p className="pb-4 text-sm text-gray-500">
        {AD_PLACEMENT_DESCRIPTIONS[placement]} 켜져 있고 기간 안인 광고가 이 순서대로 첫 칸부터
        들어가고, 일반 공고가 그 뒤에 이어집니다. 일반 목록에 같은 공고가 있으면 일반 쪽에서
        빠집니다.
      </p>

      <div className="pb-4">
        <Select
          aria-label="광고주로 거르기"
          options={advertiserFilterOptions(rows)}
          value={advertiserFilter}
          onChange={(event) => setAdvertiserFilter(event.target.value)}
        />
      </div>

      {isError ? <Callout tone="error">광고 공고 목록을 불러오지 못했습니다.</Callout> : null}
      {reorder.isError ? (
        <Callout tone="error" className="mb-4">
          순서를 바꾸지 못했습니다. 목록을 새로 불러온 뒤 다시 시도해 주세요.
        </Callout>
      ) : null}

      <DataTable
        columns={columns}
        rows={shownRows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setEditing({ adPosting: row })}
        isLoading={isPending}
        emptyMessage="이 자리에 등록된 광고 공고가 없습니다. 웹에는 일반 공고만 나옵니다."
      />

      {editing ? (
        <AdPostingFormModal
          key={`${placement}-${editing.adPosting?.id ?? 'new'}`}
          placement={placement}
          adPosting={editing.adPosting}
          takenTargetIds={new Set(rows.map((row) => row.targetId))}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.targetTitle || `${deleting?.targetId ?? ''}번`}
        description="웹에서도 즉시 사라지고, 뒤의 광고가 한 칸씩 앞으로 옵니다."
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </>
  );
}

/** 표에서 바로 켜고 끈다. 클릭이 행의 수정 모달까지 가지 않게 멈춘다. */
function EnabledToggle({
  placement,
  adPosting,
}: {
  placement: AdPostingPlacement;
  adPosting: AdPosting;
}) {
  const toggle = useUpdateAdPosting(placement, adPosting.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={adPosting.enabled}
        disabled={toggle.isPending}
        label={adPosting.enabled ? '켜짐' : '꺼짐'}
        onChange={(next) => toggle.mutate({ enabled: next })}
      />
    </span>
  );
}
