import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  DataTable,
  Input,
  Select,
  type DataTableColumn,
} from '@ogonggo/ui';
import {
  enumLabel,
  enumOptions,
  type AdminAdvertisementContractDetailResponse,
  type AdminAdvertisementContractProductResponse,
  type ChangeAdminAdvertisementContractStatusRequestStatus,
} from '@ogonggo/api/src/admin';
import {
  useAddContractProduct,
  useChangeContractStatus,
  useChangePaymentAmount,
  useContract,
  useContractExposures,
  useRemoveContractProduct,
} from '@/entities/advertisement-contract/api/useAdvertisementContracts';
import {
  CONTRACT_STATUS_TONE,
  formatPaymentAmount,
} from '@/entities/advertisement-contract/lib/contract';
import type { AdvertisementExposure } from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import { businessNumberOf } from '@/entities/member/model/companySignupInfo';
import {
  type BannerPosition,
  EXPOSURE_STATUS_BADGES,
  exposureStatus,
  formatKst,
  formatPeriod,
} from '@/entities/advertisement-exposure/lib/exposure';
import {
  type AdvertisementProduct,
  useAdvertisementProducts,
} from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { productLabel } from '@/entities/advertisement-product/lib/product';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { BannerFormModal } from '@/widgets/banner-form';
import { PageHeader } from '@/widgets/page-header';

type BannerProduct = AdvertisementProduct & { position: BannerPosition };

/** 배너 자리가 있는 상품만 노출을 걸 수 있다. 인스타·카카오·광고 공고 상품은 자리가 없다. */
const isBannerProduct = (product: AdvertisementProduct): product is BannerProduct =>
  product.category === 'BANNER' && product.position != null;

/** 승인된 계약은 `광고 계약`, 나머지는 `유료 광고 신청` 목록으로 돌아간다. 상태를 모르면(불러오는 중·실패) 광고 신청이다. */
const backTo = (status?: string) =>
  status === 'APPROVED'
    ? { to: '/business/advertisement-contracts', label: '광고 계약' }
    : { to: '/business/advertisement-applications', label: '유료 광고 신청' };

/**
 * 광고 계약 상세(PRD 4절). 신청 원문을 보고, 상태·협의 금액을 정하고, 판매한 상품을 붙이고, 이 계약에 걸린 노출을 본다.
 *
 * 비즈니스 공고 계약(`COMPANY_POSTING`)은 상태가 공고 검수를 따라가 여기서 바꿀 수 없다(BE 409). 상태 변경 대신 공고로 가는
 * 링크를 둔다.
 */
export function AdContractDetailPage() {
  const contractId = Number(useParams().contractId);
  const { data: contract, isPending, isError } = useContract(contractId);

  if (isError) {
    return (
      <>
        <PageHeader title="광고 계약" backTo={backTo()} />
        <Callout tone="error">계약을 불러오지 못했습니다. 없는 계약일 수 있습니다.</Callout>
      </>
    );
  }
  if (isPending || !contract) {
    return (
      <>
        <PageHeader title="광고 계약" backTo={backTo()} />
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${contract.companyName} · ${contract.recruitmentTitle}`}
        backTo={backTo(contract.status)}
      />
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ApplicationCard contract={contract} />
          <div className="flex flex-col gap-6">
            <StatusCard contract={contract} />
            <PaymentAmountCard key={contract.paymentAmount ?? 'none'} contract={contract} />
          </div>
        </div>
        <ProductsCard contract={contract} />
        <ExposuresCard contract={contract} />
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="break-words whitespace-pre-wrap text-gray-900">{children ?? '-'}</dd>
    </div>
  );
}

/** 공고·부트캠프 상세 주소. 비즈니스 공고 계약만 대상 id 가 있다. */
function targetHref(contract: AdminAdvertisementContractDetailResponse): string | null {
  if (contract.targetId == null) return null;
  return contract.promotionTarget === 'BOOTCAMP'
    ? `/business/bootcamps/${contract.targetId}`
    : `/content/jobs/${contract.targetId}`;
}

/** 신청 원문. 비즈니스 공고 계약은 신청서가 없어 담당자·세금계산서 등이 비어 있다. */
function ApplicationCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const href = targetHref(contract);
  return (
    <Card>
      <CardTitle>신청 내용</CardTitle>
      <dl className="mt-2 divide-y divide-gray-100">
        <Row label="경로">{enumLabel('AdvertisementContractSource', contract.source)}</Row>
        <Row label="홍보 대상">
          {enumLabel('AdvertisementContractPromotionTarget', contract.promotionTarget)}
        </Row>
        <Row label="회사명">
          {contract.userId != null ? (
            <Link
              to={`/members/companies/${contract.userId}`}
              className="text-blue-500 hover:underline"
            >
              {contract.companyName}
            </Link>
          ) : (
            contract.companyName
          )}
        </Row>
        <Row label="공고명">
          {href ? (
            <Link to={href} className="text-blue-500 hover:underline">
              {contract.recruitmentTitle}
            </Link>
          ) : (
            contract.recruitmentTitle
          )}
        </Row>
        <Row label="공고 URL">
          {contract.recruitmentUrl ? (
            <a
              href={contract.recruitmentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              {contract.recruitmentUrl}
            </a>
          ) : null}
        </Row>
        <Row label="마감일">{contract.recruitmentDeadline}</Row>
        <Row label="목적">
          {contract.purpose ? enumLabel('AdvertisementContractPurpose', contract.purpose) : null}
        </Row>
        <Row label="희망 카테고리">
          {contract.categories
            .map((category) => enumLabel('AdvertisementProductCategory', category))
            .join(', ')}
        </Row>
        <Row label="예정 예산">
          {contract.budgetAmount != null
            ? `${contract.budgetAmount.toLocaleString('ko-KR')}원`
            : null}
        </Row>
        {/* 신청서에서 칸이 따로 없는 문항의 답. 이 값이 생기기 전 신청은 없어서 아래 일정 요청에 그대로 있다. */}
        {contract.formAnswers?.map((answer) => (
          <Row key={answer.key} label={answer.label}>
            {answer.value}
          </Row>
        ))}
        <Row label="일정 요청">{contract.scheduleRequest}</Row>
        <Row label="요청 사항">{contract.advertisementRequest}</Row>
        <Row label="담당자">
          {[contract.managerName, contract.email, contract.phoneNumber]
            .filter(Boolean)
            .join(' · ') || null}
        </Row>
        <Row label="사업자 번호">{businessNumberOf(contract)}</Row>
        <Row label="세금계산서">
          {contract.invoiceMethod
            ? enumLabel('AdvertisementContractInvoiceMethod', contract.invoiceMethod)
            : null}
        </Row>
        <Row label="소재 방식">
          {contract.creativeMethod
            ? enumLabel('AdvertisementContractCreativeMethod', contract.creativeMethod)
            : null}
        </Row>
        <Row label="신청일">{formatKst(contract.registeredAt)}</Row>
      </dl>
    </Card>
  );
}

function StatusCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const change = useChangeContractStatus(contract.id);
  const [status, setStatus] = useState<ChangeAdminAdvertisementContractStatusRequestStatus>(
    contract.status,
  );
  const href = targetHref(contract);
  const followsReview = contract.source === 'COMPANY_POSTING';

  return (
    <Card>
      <CardTitle>상태</CardTitle>
      <div className="mt-3 flex flex-col gap-3">
        <Badge tone={CONTRACT_STATUS_TONE[contract.status]} className="self-start">
          {enumLabel('AdvertisementContractStatus', contract.status)}
        </Badge>
        {followsReview ? (
          <p className="text-sm text-gray-500">
            비즈니스 공고 계약은 공고 검수 결과를 따라갑니다. 상태를 바꾸려면{' '}
            {href ? (
              <Link to={href} className="text-blue-500 hover:underline">
                공고 상세
              </Link>
            ) : (
              '공고 상세'
            )}
            에서 검수하세요.
          </p>
        ) : (
          <div className="flex gap-2">
            <Select
              aria-label="바꿀 상태"
              options={enumOptions('AdvertisementContractStatus')}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ChangeAdminAdvertisementContractStatusRequestStatus)
              }
            />
            <Button
              size="sm"
              disabled={change.isPending || status === contract.status}
              onClick={() => change.mutate(status)}
            >
              {change.isPending ? '바꾸는 중' : '바꾸기'}
            </Button>
          </div>
        )}
        {change.isError ? (
          <Callout tone="error">
            {advertisementErrorMessage(change.error, '상태를 바꾸지 못했습니다.')}
          </Callout>
        ) : null}
      </div>
    </Card>
  );
}

/** 협의 금액. 비우고 저장하거나 `지우기` 를 누르면 금액 없음(`null`)이고, 0 은 0원이다. */
function PaymentAmountCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const change = useChangePaymentAmount(contract.id);
  const [draft, setDraft] = useState(
    contract.paymentAmount == null ? '' : String(contract.paymentAmount),
  );
  const invalid = draft !== '' && !/^\d+$/.test(draft);

  return (
    <Card>
      <CardTitle>협의 금액</CardTitle>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm text-gray-900">{formatPaymentAmount(contract.paymentAmount)}</p>
        <div className="flex gap-2">
          <Input
            aria-label="협의 금액(원)"
            inputMode="numeric"
            placeholder="금액(원)"
            value={draft}
            onChange={(event) => setDraft(event.target.value.trim())}
            className="h-9 min-w-0 flex-1 text-sm"
          />
          <Button
            size="sm"
            className="shrink-0 whitespace-nowrap"
            disabled={change.isPending || invalid}
            onClick={() => change.mutate(draft === '' ? null : Number(draft))}
          >
            저장
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 whitespace-nowrap"
            disabled={change.isPending || contract.paymentAmount == null}
            onClick={() => change.mutate(null)}
          >
            지우기
          </Button>
        </div>
        {invalid ? <p className="text-xs text-error">0 이상의 숫자로 입력해 주세요.</p> : null}
        {change.isError ? (
          <Callout tone="error">
            {advertisementErrorMessage(change.error, '금액을 저장하지 못했습니다.')}
          </Callout>
        ) : null}
      </div>
    </Card>
  );
}

/**
 * 판매한 상품(계약 상품). 같은 상품을 여러 번 붙일 수 있다. 지운 상품도 계약에는 남아 `삭제된 상품` 으로 보인다.
 *
 * 배너 상품 줄에는 `배너 등록` 이 있다. 그 상품의 자리에, 이 계약을 연결 계약으로 미리 채운 등록 모달을 연다(배너 세팅과 같은
 * 모달). 저장하면 아래 `걸린 노출` 에 바로 보인다.
 */
function ProductsCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const products = useAdvertisementProducts();
  const add = useAddContractProduct(contract.id);
  const remove = useRemoveContractProduct(contract.id);
  const [productId, setProductId] = useState('');
  const [bannerProduct, setBannerProduct] = useState<BannerProduct | null>(null);

  const bannerProductOf = (row: AdminAdvertisementContractProductResponse) => {
    if (row.productDeleted) return null;
    const product = products.data?.find((candidate) => candidate.id === row.productId);
    return product && isBannerProduct(product) ? product : null;
  };

  const columns: DataTableColumn<AdminAdvertisementContractProductResponse>[] = [
    {
      key: 'name',
      header: '상품',
      render: (row) => (
        <span className="flex items-center gap-2">
          {row.productName}
          {row.productDeleted ? <Badge tone="neutral">삭제된 상품</Badge> : null}
        </span>
      ),
    },
    {
      key: 'category',
      header: '카테고리',
      width: 'w-36',
      render: (row) => enumLabel('AdvertisementProductCategory', row.category),
    },
    {
      key: 'addedAt',
      header: '넣은 날',
      width: 'w-40',
      render: (row) => <span className="text-sm">{formatKst(row.addedAt)}</span>,
    },
    {
      key: 'actions',
      header: '관리',
      width: 'w-44',
      render: (row) => {
        const banner = bannerProductOf(row);
        return (
          <span className="flex items-center gap-1.5">
            {banner ? (
              <Button
                size="sm"
                aria-label={`${row.productName} 배너 등록`}
                onClick={() => setBannerProduct(banner)}
              >
                배너 등록
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.productName} 빼기`}
              disabled={remove.isPending}
              onClick={() => remove.mutate(row.contractProductId)}
            >
              빼기
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <Card>
      <CardTitle>계약 상품</CardTitle>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="넣을 상품"
            options={[
              { value: '', label: '넣을 상품 고르기' },
              ...(products.data ?? []).map((product) => ({
                value: String(product.id),
                label: productLabel(product),
              })),
            ]}
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          />
          <Button
            size="sm"
            disabled={!productId || add.isPending}
            onClick={() => add.mutate(Number(productId), { onSuccess: () => setProductId('') })}
          >
            넣기
          </Button>
        </div>
        {add.isError || remove.isError ? (
          <Callout tone="error">
            {advertisementErrorMessage(add.error ?? remove.error, '계약 상품을 바꾸지 못했습니다.')}
          </Callout>
        ) : null}
        <DataTable
          columns={columns}
          rows={contract.products}
          rowKey={(row) => row.contractProductId}
          emptyMessage="넣은 상품이 없습니다. 판매한 상품을 넣으세요."
        />
      </div>
      {bannerProduct ? (
        <BannerFormModal
          key={bannerProduct.id}
          open
          product={bannerProduct}
          exposure={null}
          initialContract={{ id: contract.id, companyName: contract.companyName }}
          onClose={() => setBannerProduct(null)}
        />
      ) : null}
    </Card>
  );
}

/** 이 계약에 걸린 노출. 계약 상품의 자리마다 불러 모은다. 노출은 계약 상품의 `배너 등록` 이나 배너 세팅에서 건다. */
function ExposuresCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const exposures = useContractExposures(
    contract.id,
    contract.products.map((product) => product.productId),
  );
  const productName = (productId: number) =>
    contract.products.find((product) => product.productId === productId)?.productName ??
    `상품 #${productId}`;

  const columns: DataTableColumn<AdvertisementExposure>[] = [
    {
      key: 'product',
      header: '상품',
      width: 'w-56',
      render: (row) => productName(row.productId),
    },
    { key: 'name', header: '이름', render: (row) => row.name ?? '-' },
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
  ];

  return (
    <Card>
      <CardTitle>걸린 노출</CardTitle>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm text-gray-500">
          배너는 위 계약 상품의 `배너 등록` 으로 바로 겁니다. 순서·켜기·수정은{' '}
          <Link to="/business/banners" className="text-blue-500 hover:underline">
            배너 세팅
          </Link>
          에서 합니다. 계약에 넣은 상품의 자리만 여기서 보입니다.
        </p>
        {exposures.isError ? <Callout tone="error">노출을 불러오지 못했습니다.</Callout> : null}
        <DataTable
          columns={columns}
          rows={exposures.data}
          rowKey={(row) => row.id}
          isLoading={contract.products.length > 0 && exposures.isPending}
          emptyMessage="이 계약에 걸린 노출이 없습니다."
        />
      </div>
    </Card>
  );
}
