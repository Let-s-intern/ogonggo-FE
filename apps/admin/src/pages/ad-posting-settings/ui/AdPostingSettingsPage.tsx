import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
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
import {
  useAdvertisementExposures,
  useDeleteExposure,
  useMoveExposure,
  useToggleExposure,
} from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import {
  AD_POSTING_JOB_FIELD_OPTIONS,
  AD_POSTING_POSITIONS,
  AD_POSTING_POSITION_DESCRIPTIONS,
  isAdPostingPosition,
  jobFieldLabel,
  needsJobField,
  needsRecommendation,
  type AdPostingExposure,
  type AdPostingPosition,
} from '@/entities/advertisement-exposure/lib/adPosting';
import {
  EXPOSURE_STATUS_BADGES,
  exposureStatus,
  formatPeriod,
} from '@/entities/advertisement-exposure/lib/exposure';
import { positionLabel } from '@/entities/advertisement-product/lib/product';
import { useAdvertisementProducts } from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { AdPostingFormModal } from '@/widgets/ad-posting-form';
import { PageHeader } from '@/widgets/page-header';

const POSITION_TABS = AD_POSTING_POSITIONS.map((value) => ({
  value,
  label: positionLabel(value),
}));

const targetLabel = (row: AdPostingExposure) =>
  row.targetTitle ?? (row.targetId != null ? `${row.targetId}번` : '-');

/**
 * 광고 공고 세팅(PRD `prd-business-report.md` 6.8). 자리마다 그 자리의 광고 공고 상품을 찾아, 상품에 거는 광고 공고 노출을
 * 등록·수정·삭제하고, 켜고 끄고, 순서를 바꾼다. 배너 세팅(`pages/banner-settings`)과 같은 모양이다.
 *
 * 자리는 `?position=`, 열린 모달은 `?edit=<노출 id>`·`?edit=new` 다. 새로고침·뒤로 가기가 그대로 따른다.
 *
 * 웹에는 켜져 있고 기간 안이고 대상이 게시 중인 것만 이 순서대로 목록 맨 앞에 나간다(BE 공개 API). 표는 꺼진 것·기간이 끝난
 * 것·내린 공고까지 모두 보인다.
 */
export function AdPostingSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('position');
  const position: AdPostingPosition = isAdPostingPosition(requested) ? requested : 'JOB_LIST';
  const editParam = searchParams.get('edit');
  const [chosenProductId, setChosenProductId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdPostingExposure | null>(null);
  const products = useAdvertisementProducts();
  const productsHere = (products.data ?? []).filter(
    (product) => product.category === 'JOB_POSTING' && String(product.position) === position,
  );
  const product =
    productsHere.find((candidate) => candidate.id === chosenProductId) ?? productsHere[0] ?? null;
  const { data, isPending, isError } = useAdvertisementExposures(product?.id ?? null);
  const move = useMoveExposure();
  const deleteMutation = useDeleteExposure();
  const allRows: AdPostingExposure[] = data ?? [];
  // 리스트 상단 고정은 직무로 거를 수 있다(`?jobField=`). 순서는 거른 뒤에도 자리 전체의 순서다.
  const withJobField = needsJobField(position);
  const jobFieldFilter = withJobField ? (searchParams.get('jobField') ?? '') : '';
  const rows = jobFieldFilter ? allRows.filter((row) => row.jobField === jobFieldFilter) : allRows;

  // 목록을 받기 전이거나 없는 id 면 모달을 열지 않는다.
  const editingRow = allRows.find((row) => String(row.id) === editParam);
  const editing =
    editParam === 'new' ? { exposure: null } : editingRow ? { exposure: editingRow } : null;

  const changePosition = (next: AdPostingPosition) => {
    setChosenProductId(null);
    setSearchParams({ position: next }, { replace: true });
  };
  const openEdit = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('position', position);
    next.set('edit', value);
    // 이 화면에서 열었다는 표시. 닫을 때 기록을 하나 되돌려, 뒤로 가기가 닫힌 같은 화면을 한 번 더 밟지 않게 한다.
    setSearchParams(next, { state: { editOpenedHere: true } });
  };
  const closeEdit = () => {
    if ((location.state as { editOpenedHere?: boolean } | null)?.editOpenedHere) {
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  };

  const columns: DataTableColumn<AdPostingExposure>[] = [
    {
      key: 'order',
      header: '순서',
      width: 'w-16 whitespace-nowrap',
      render: (row) => allRows.indexOf(row) + 1,
    },
    ...(withJobField
      ? [
          {
            key: 'jobField',
            header: '직무',
            width: 'w-32 whitespace-nowrap',
            render: (row: AdPostingExposure) => jobFieldLabel(row.jobField),
          },
        ]
      : []),
    {
      key: 'target',
      header: '대상',
      render: (row) => (
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
            {targetLabel(row)}
            {row.adLabel ? <Badge tone="urgent">광고 표시</Badge> : null}
            {row.targetPublished === false ? <Badge tone="neutral">비공개 공고</Badge> : null}
          </span>
          <span className="text-xs text-gray-500">
            {row.targetType === 'BOOTCAMP' ? '부트캠프' : '채용공고'}
            {row.targetCompanyName ? ` · ${row.targetCompanyName}` : ''}
          </span>
        </span>
      ),
    },
    ...(needsRecommendation(position)
      ? [
          {
            key: 'recommendation',
            header: '추천 문구',
            width: 'w-72',
            render: (row: AdPostingExposure) =>
              row.recommendationTitle ? (
                <span className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {row.recommendationTitle}
                  </span>
                  <span className="line-clamp-2 text-xs whitespace-pre-line text-gray-500">
                    {row.recommendationDescription}
                  </span>
                </span>
              ) : (
                <span className="text-sm text-error">없음</span>
              ),
          },
        ]
      : []),
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
        const index = allRows.indexOf(row);
        return (
          // 행 전체가 수정 모달을 여는 자리라 버튼 클릭은 여기서 멈춘다.
          <span
            className="flex gap-1 whitespace-nowrap"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${targetLabel(row)} 위로`}
              disabled={move.isPending || index === 0}
              onClick={() => move.mutate({ exposureId: row.id, direction: 'UP' })}
            >
              위로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${targetLabel(row)} 아래로`}
              disabled={move.isPending || index === allRows.length - 1}
              onClick={() => move.mutate({ exposureId: row.id, direction: 'DOWN' })}
            >
              아래로
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${targetLabel(row)} 삭제`}
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
          <Button size="sm" disabled={!product} onClick={() => openEdit('new')}>
            새 광고 공고
          </Button>
        }
      />

      <Tabs
        items={POSITION_TABS}
        value={position}
        onValueChange={changePosition}
        aria-label="광고 공고 자리"
        className="mb-4"
      />
      <p className="pb-4 text-sm text-gray-500">
        {AD_POSTING_POSITION_DESCRIPTIONS[position]} 켜져 있고 기간 안이며 공개 중인 공고가 이
        순서대로 나갑니다. 같은 공고는 일반 목록에서 빠집니다.
      </p>

      {products.isError ? (
        <Callout tone="error">광고 상품을 불러오지 못했습니다.</Callout>
      ) : products.isPending ? null : product === null ? (
        <Callout tone="info">
          이 자리의 광고 공고 상품이 없어 광고 공고를 걸 수 없습니다.{' '}
          <Link to="/business/advertisement-products" className="font-semibold underline">
            광고 상품
          </Link>
          에서 이 자리의 광고 공고 상품을 먼저 등록해 주세요.
        </Callout>
      ) : (
        <>
          {withJobField ? (
            <div className="flex items-center gap-2 pb-4">
              <Select
                aria-label="직무"
                options={[{ value: '', label: '직무 전체' }, ...AD_POSTING_JOB_FIELD_OPTIONS]}
                value={jobFieldFilter}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  if (event.target.value) next.set('jobField', event.target.value);
                  else next.delete('jobField');
                  setSearchParams(next, { replace: true });
                }}
              />
              <span className="text-xs text-gray-500">
                같은 직무 안에서는 순서가 앞선 한 건만 웹에 나가요.
              </span>
            </div>
          ) : null}
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
                이 자리에 상품이 여럿입니다. 광고 공고를 걸 상품을 고르세요.
              </span>
            </div>
          ) : null}

          {isError ? <Callout tone="error">광고 공고 목록을 불러오지 못했습니다.</Callout> : null}
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
            onRowClick={(row) => openEdit(String(row.id))}
            isLoading={isPending}
            emptyMessage="이 자리에 등록된 광고 공고가 없습니다. 웹에서는 일반 카드만 보입니다."
          />
        </>
      )}

      {editing && product ? (
        <AdPostingFormModal
          key={`${product.id}-${editing.exposure?.id ?? 'new'}`}
          product={product}
          position={position}
          exposure={editing.exposure}
          taken={allRows}
          onClose={closeEdit}
        />
      ) : null}

      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting ? targetLabel(deleting) : ''}
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

/** 표에서 바로 켜고 끈다. 클릭이 행의 수정 모달까지 가지 않게 멈춘다(배너 세팅과 같다). */
function ExposedToggle({ exposure }: { exposure: AdPostingExposure }) {
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
