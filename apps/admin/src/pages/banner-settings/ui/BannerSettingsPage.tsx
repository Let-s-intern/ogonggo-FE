import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Badge,
  Button,
  Callout,
  ConfirmDelete,
  DataTable,
  Select,
  Tabs,
  Toggle,
  cn,
  type DataTableColumn,
} from '@ogonggo/ui';
import {
  BANNER_PLACEMENTS,
  type BannerPlacement,
  isSideBannerPlacement,
} from '@ogonggo/api/src/banners';
import {
  useBannerList,
  useDeleteBanner,
  useReorderBanners,
  useToggleBanner,
  type Banner,
} from '@/entities/banner/api/useBanners';
import { AdContractNote } from '@/entities/ad-contract/ui/AdContractNote';
import { AdvertiserName } from '@/entities/advertiser/ui/AdvertiserName';
import { advertiserFilterOptions } from '@/entities/advertiser/lib/advertiserFilter';
import {
  BANNER_STATUS_BADGES,
  PC_IMAGE_SPECS,
  PLACEMENT_DESCRIPTIONS,
  PLACEMENT_LABELS,
  bannerImageSrc,
  bannerStatus,
  formatPeriod,
} from '@/entities/banner/lib/banner';
import { PageHeader } from '@/widgets/page-header';
import { BannerFormModal } from '@/widgets/banner-form';

const PLACEMENT_TABS = BANNER_PLACEMENTS.map((value) => ({
  value,
  label: PLACEMENT_LABELS[value],
}));

/** 열린 모달. `banner` 가 `null` 이면 새 배너다. */
type Editing = { banner: Banner | null } | null;

/**
 * 홈 배너 세팅(이슈 #573). 자리(홈 상단·홈 하단)마다 배너를 등록·수정·삭제하고, 켜고 끄고, 순서를 바꾼다.
 *
 * 홈에는 켜져 있고 기간 안인 배너만 이 순서대로 나가고, 여럿이면 차례로 넘긴다(웹 `widgets/home-banner`). 표는
 * 꺼진 것·기간이 끝난 것까지 모두 보이고 `상태` 칸이 지금 홈에 보이는지 말한다.
 *
 * 순서는 위로·아래로를 누를 때마다 바로 저장한다. 오공고 PICK 처럼 모아서 저장하지 않는 것은 배너가 자리마다 몇 개뿐이라
 * 저장 버튼을 잊을 위험이 더 크기 때문이다.
 */
export function BannerSettingsPage() {
  // 캘린더에서 오공고 자체 홍보 배너를 누르면 `?placement=` 로 그 자리 탭을 연다. 처음 한 번만 읽는다.
  const [searchParams] = useSearchParams();
  const [placement, setPlacement] = useState<BannerPlacement>(() => {
    const requested = searchParams.get('placement');
    return BANNER_PLACEMENTS.find((value) => value === requested) ?? 'HOME_TOP';
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  /** 표만 거르는 광고주. 빈 값이면 전체, `none` 이면 광고주 없는 배너다. 순서 버튼은 거르지 않은 순서로 움직인다. */
  const [advertiserFilter, setAdvertiserFilter] = useState('');
  const { data, isPending, isError } = useBannerList(placement);
  const reorder = useReorderBanners(placement);
  const deleteMutation = useDeleteBanner();
  const rows = data ?? [];
  const shownRows = rows.filter(
    (row) =>
      advertiserFilter === '' ||
      (advertiserFilter === 'none'
        ? row.advertiser === null
        : String(row.advertiser?.id) === advertiserFilter),
  );

  const move = (index: number, delta: -1 | 1) => {
    const ids = rows.map((row) => row.id);
    const target = index + delta;
    const [moved] = ids.splice(index, 1);
    if (moved === undefined) {
      return;
    }
    ids.splice(target, 0, moved);
    reorder.mutate(ids);
  };

  const columns: DataTableColumn<Banner>[] = [
    {
      key: 'order',
      header: '순서',
      width: 'w-16 whitespace-nowrap',
      render: (row) => rows.indexOf(row) + 1,
    },
    {
      key: 'image',
      header: '이미지',
      width: 'w-56',
      render: (row) => (
        <img
          src={bannerImageSrc(row.pcImageUrl)}
          alt=""
          className={cn(
            'rounded border border-gray-200 object-cover',
            PC_IMAGE_SPECS[placement].aspectClassName,
            isSideBannerPlacement(placement) ? 'w-20' : 'w-52',
          )}
        />
      ),
    },
    {
      key: 'name',
      header: '이름',
      render: (row) => (
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-medium text-gray-900">
            {row.name}
            {row.showAdLabel ? <Badge tone="urgent">광고 표시</Badge> : null}
          </span>
          <span className="max-w-72 truncate text-xs text-gray-500" title={row.linkUrl}>
            {row.linkUrl}
            {row.openInNewTab || /^https?:\/\//.test(row.linkUrl) ? ' (새 탭)' : ''}
          </span>
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
          <AdContractNote contract={row.contract} period={row} />
        </span>
      ),
    },
    {
      key: 'period',
      header: '노출 기간(KST)',
      width: 'w-64',
      render: (row) => <span className="text-sm">{formatPeriod(row)}</span>,
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      render: (row) => {
        const badge = BANNER_STATUS_BADGES[bannerStatus(row)];
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      key: 'enabled',
      header: '켜기',
      width: 'w-24',
      render: (row) => <EnabledToggle placement={placement} banner={row} />,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-52',
      render: (row) => {
        const index = rows.indexOf(row);
        return (
          // 행 전체가 수정 모달을 여는 자리라 버튼 클릭은 여기서 멈춘다.
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
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.name} 삭제`}
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
        title="배너 세팅"
        action={
          <Button size="sm" onClick={() => setEditing({ banner: null })}>
            새 배너
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
        aria-label="배너 자리"
        className="mb-4"
      />
      <p className="pb-4 text-sm text-gray-500">
        {PLACEMENT_DESCRIPTIONS[placement]} 켜져 있고 기간 안인 배너가 이 순서대로 5초마다
        넘어갑니다. 없으면 자리 자체가 보이지 않습니다.
      </p>

      <div className="flex items-center gap-2 pb-4">
        <Select
          aria-label="광고주로 거르기"
          options={advertiserFilterOptions(rows, '광고주 없음(자체 홍보)')}
          value={advertiserFilter}
          onChange={(event) => setAdvertiserFilter(event.target.value)}
        />
        {advertiserFilter ? (
          <span className="text-xs text-gray-500">
            거른 상태에서도 순서 번호와 위로·아래로는 자리 전체 기준입니다.
          </span>
        ) : null}
      </div>

      {isError ? <Callout tone="error">배너 목록을 불러오지 못했습니다.</Callout> : null}
      {reorder.isError ? (
        <Callout tone="error" className="mb-4">
          순서를 바꾸지 못했습니다. 목록을 새로 불러온 뒤 다시 시도해 주세요.
        </Callout>
      ) : null}

      <DataTable
        columns={columns}
        rows={shownRows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setEditing({ banner: row })}
        isLoading={isPending}
        emptyMessage="이 자리에 등록된 배너가 없습니다. 홈에서는 자리가 보이지 않습니다."
      />

      {editing ? (
        <BannerFormModal
          key={`${placement}-${editing.banner?.id ?? 'new'}`}
          open
          placement={placement}
          banner={editing.banner}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.name ?? ''}
        description="홈에서도 즉시 사라집니다."
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

/** 표에서 바로 켜고 끈다. 클릭이 행의 수정 모달까지 가지 않게 멈춘다(공지 목록의 `VisibilityToggle` 과 같다). */
function EnabledToggle({ placement, banner }: { placement: BannerPlacement; banner: Banner }) {
  const toggle = useToggleBanner(placement, banner.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={banner.enabled}
        disabled={toggle.isPending}
        label={banner.enabled ? '켜짐' : '꺼짐'}
        onChange={(next) => toggle.mutate(next)}
      />
    </span>
  );
}
