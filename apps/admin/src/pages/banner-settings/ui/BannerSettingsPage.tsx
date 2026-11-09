import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
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
import { enumLabel } from '@ogonggo/api/src/admin';
import {
  useAdvertisementExposures,
  useDeleteExposure,
  useMoveExposure,
  useToggleExposure,
  type AdvertisementExposure,
} from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import {
  BANNER_POSITIONS,
  EXPOSURE_STATUS_BADGES,
  POSITION_DESCRIPTIONS,
  bannerImageSrc,
  exposureStatus,
  formatPeriod,
  imageSpec,
  isSidePosition,
  type BannerPosition,
} from '@/entities/advertisement-exposure/lib/exposure';
import {
  useAdvertisementProducts,
  type AdvertisementProduct,
} from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { PageHeader } from '@/widgets/page-header';
import { BannerFormModal } from '@/widgets/banner-form';

const POSITION_TABS = BANNER_POSITIONS.map((value) => ({
  value,
  label: enumLabel('AdvertisementProductPosition', value),
}));

type BannerProduct = AdvertisementProduct & { position: BannerPosition };

/** 열린 모달. `exposure` 가 `null` 이면 새 배너다. */
type Editing = { exposure: AdvertisementExposure | null } | null;

/**
 * 배너 세팅(BE LC-3583 광고 노출). 자리마다 그 자리의 광고 상품을 찾아, 상품에 거는 배너 노출을 등록·수정·삭제하고, 켜고 끄고,
 * 순서를 바꾼다.
 *
 * 웹에는 켜져 있고 기간 안인 배너만 이 순서대로 나가고, 여럿이면 차례로 넘긴다(웹 `widgets/home-banner`). 표는 꺼진 것·기간이
 * 끝난 것까지 모두 보이고 `상태` 칸이 지금 웹에 보이는지 말한다.
 *
 * 같은 자리에 상품이 여럿이면 상품을 고른다. 자리에 상품이 없으면 노출을 걸 곳이 없어 상품 등록으로 안내한다. 순서는 위로·아래로를
 * 누를 때마다 한 칸씩 바로 저장한다(BE `POST /move`). 끌어서 바꾸는 순서 저장은 BE 에 없다.
 */
export function BannerSettingsPage() {
  // `?position=` 으로 그 자리 탭을 연다. 처음 한 번만 읽는다.
  const [searchParams] = useSearchParams();
  const [position, setPosition] = useState<BannerPosition>(() => {
    const requested = searchParams.get('position');
    return BANNER_POSITIONS.find((value) => value === requested) ?? 'JOB_HOME_TOP_BANNER';
  });
  const [chosenProductId, setChosenProductId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<AdvertisementExposure | null>(null);
  const products = useAdvertisementProducts();
  const productsHere = (products.data ?? []).filter(
    (product): product is BannerProduct => product.position === position,
  );
  const product =
    productsHere.find((candidate) => candidate.id === chosenProductId) ?? productsHere[0] ?? null;
  const { data, isPending, isError } = useAdvertisementExposures(product?.id ?? null);
  const move = useMoveExposure();
  const deleteMutation = useDeleteExposure();
  const rows = data ?? [];

  const columns: DataTableColumn<AdvertisementExposure>[] = [
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
      render: (row) =>
        row.imageUrl ? (
          <img
            src={bannerImageSrc(row.imageUrl)}
            alt=""
            className={cn(
              'rounded border border-gray-200 object-cover',
              imageSpec(position).aspectClassName,
              isSidePosition(position) ? 'w-20' : 'w-52',
            )}
          />
        ) : null,
    },
    {
      key: 'name',
      header: '이름',
      render: (row) => (
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-medium text-gray-900">
            {row.name}
            {row.adLabel ? <Badge tone="urgent">광고 표시</Badge> : null}
          </span>
          <span className="max-w-72 truncate text-xs text-gray-500" title={row.linkUrl ?? ''}>
            {row.linkUrl}
            {/^https?:\/\//.test(row.linkUrl ?? '') ? ' (새 탭)' : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'contract',
      header: '연결 계약',
      width: 'w-40',
      render: (row) =>
        row.contractId ? (
          <span className="text-sm text-gray-900">
            {row.advertiserCompanyName ?? `계약 #${row.contractId}`}
          </span>
        ) : (
          <span className="text-sm text-gray-500">자체 홍보</span>
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
        const badge = EXPOSURE_STATUS_BADGES[exposureStatus(row)];
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      key: 'exposed',
      header: '켜기',
      width: 'w-24',
      render: (row) => <ExposedToggle exposure={row} />,
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
              aria-label={`${row.name ?? ''} 위로`}
              disabled={move.isPending || index === 0}
              onClick={() => move.mutate({ exposureId: row.id, direction: 'UP' })}
            >
              위로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.name ?? ''} 아래로`}
              disabled={move.isPending || index === rows.length - 1}
              onClick={() => move.mutate({ exposureId: row.id, direction: 'DOWN' })}
            >
              아래로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.name ?? ''} 삭제`}
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
          <Button size="sm" disabled={!product} onClick={() => setEditing({ exposure: null })}>
            새 배너
          </Button>
        }
      />

      <Tabs
        items={POSITION_TABS}
        value={position}
        onValueChange={(next) => {
          setPosition(next);
          setChosenProductId(null);
        }}
        aria-label="배너 자리"
        className="mb-4"
      />
      <p className="pb-4 text-sm text-gray-500">
        {POSITION_DESCRIPTIONS[position]} 켜져 있고 기간 안인 배너가 이 순서대로 5초마다 넘어갑니다.
        없으면 자리 자체가 보이지 않습니다.
      </p>

      {products.isError ? (
        <Callout tone="error">광고 상품을 불러오지 못했습니다.</Callout>
      ) : products.isPending ? null : product === null ? (
        <Callout tone="info">
          이 자리의 광고 상품이 없어 배너를 걸 수 없습니다.{' '}
          <Link to="/business/advertisement-products" className="font-semibold underline">
            광고 상품
          </Link>
          에서 이 자리의 배너 상품을 먼저 등록해 주세요.
        </Callout>
      ) : (
        <>
          {productsHere.length > 1 ? (
            <div className="flex items-center gap-2 pb-4">
              <Select
                aria-label="광고 상품"
                options={productsHere.map((candidate) => ({
                  value: String(candidate.id),
                  label: candidate.name,
                }))}
                value={String(product.id)}
                onChange={(event) => setChosenProductId(Number(event.target.value))}
              />
              <span className="text-xs text-gray-500">
                이 자리에 상품이 여럿입니다. 배너를 걸 상품을 고르세요.
              </span>
            </div>
          ) : null}

          {isError ? <Callout tone="error">배너 목록을 불러오지 못했습니다.</Callout> : null}
          {move.isError ? (
            <Callout tone="error" className="mb-4">
              {advertisementErrorMessage(
                move.error,
                '순서를 바꾸지 못했습니다. 목록을 새로 불러온 뒤 다시 시도해 주세요.',
              )}
            </Callout>
          ) : null}

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onRowClick={(row) => setEditing({ exposure: row })}
            isLoading={isPending}
            emptyMessage="이 자리에 등록된 배너가 없습니다. 웹에서는 자리가 보이지 않습니다."
          />
        </>
      )}

      {editing && product ? (
        <BannerFormModal
          key={`${product.id}-${editing.exposure?.id ?? 'new'}`}
          open
          product={product}
          exposure={editing.exposure}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.name ?? ''}
        description="웹에서도 즉시 사라집니다."
        isDeleting={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? advertisementErrorMessage(deleteMutation.error, '삭제하지 못했습니다.')
            : undefined
        }
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
function ExposedToggle({ exposure }: { exposure: AdvertisementExposure }) {
  const toggle = useToggleExposure(exposure.id);
  return (
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={exposure.exposed}
        disabled={toggle.isPending}
        label={exposure.exposed ? '켜짐' : '꺼짐'}
        onChange={(next) => toggle.mutate(next)}
      />
    </span>
  );
}
