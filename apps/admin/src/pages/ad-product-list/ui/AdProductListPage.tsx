import { useState } from 'react';
import { Button, Callout, ConfirmDelete, DataTable, type DataTableColumn } from '@ogonggo/ui';
import { enumLabel } from '@ogonggo/api/src/admin';
import {
  useAdvertisementProducts,
  useDeleteAdvertisementProduct,
  type AdvertisementProduct,
} from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { formatProductPrice } from '@/entities/advertisement-product/lib/product';
import { formatKst } from '@/entities/advertisement-exposure/lib/exposure';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { PageHeader } from '@/widgets/page-header';
import { ProductFormModal } from './ProductFormModal';

/** 열린 모달. `product` 가 `null` 이면 새 상품이다. */
type Editing = { product: AdvertisementProduct | null } | null;

/**
 * 광고 상품(BE LC-3583). 오공고가 파는 광고를 등록·수정·삭제한다. 배너 상품은 노출 자리 하나에 하나씩 두고, 배너 세팅이 자리의
 * 상품에 배너를 건다. 계약 상세에서는 판매한 상품을 계약에 붙인다.
 *
 * 지운 상품은 목록에서 사라지지만 이미 맺은 계약과 노출은 계속 가리킨다(BE). 그 자리의 배너는 더 고칠 수 없다.
 */
export function AdProductListPage() {
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<AdvertisementProduct | null>(null);
  const { data, isPending, isError } = useAdvertisementProducts();
  const deleteMutation = useDeleteAdvertisementProduct();

  const columns: DataTableColumn<AdvertisementProduct>[] = [
    {
      key: 'category',
      header: '카테고리',
      width: 'w-36',
      render: (row) => enumLabel('AdvertisementProductCategory', row.category),
    },
    {
      key: 'position',
      header: '노출 자리',
      width: 'w-44',
      render: (row) =>
        row.position ? (
          enumLabel('AdvertisementProductPosition', row.position)
        ) : (
          <span className="text-gray-500">자리 없음</span>
        ),
    },
    {
      key: 'name',
      header: '이름',
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'price',
      header: '소개 가격',
      width: 'w-32',
      render: (row) => formatProductPrice(row.price),
    },
    {
      key: 'registeredAt',
      header: '등록일',
      width: 'w-40',
      render: (row) => <span className="text-sm">{formatKst(row.registeredAt)}</span>,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-24',
      render: (row) => (
        // 행 전체가 수정 모달을 여는 자리라 버튼 클릭은 여기서 멈춘다.
        <span onClick={(event) => event.stopPropagation()}>
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
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="광고 상품"
        action={
          <Button size="sm" onClick={() => setEditing({ product: null })}>
            새 상품
          </Button>
        }
      />

      {isError ? <Callout tone="error">광고 상품을 불러오지 못했습니다.</Callout> : null}

      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(row) => row.id}
        onRowClick={(row) => setEditing({ product: row })}
        isLoading={isPending}
        emptyMessage="등록된 광고 상품이 없습니다."
      />

      {editing ? (
        <ProductFormModal
          key={editing.product?.id ?? 'new'}
          product={editing.product}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.name ?? ''}
        description="이미 맺은 계약과 걸린 배너는 이 상품을 계속 가리키지만, 새로 붙이거나 그 배너를 고칠 수는 없습니다."
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
