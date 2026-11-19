import { useState, type ComponentProps, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { HttpError } from '@ogonggo/api';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  DataTable,
  Input,
  Select,
  cn,
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
  useChangeContractStatus,
  useChangePaymentAmount,
  useContract,
  useContractExposures,
  useIssueBusinessAccount,
  useRemoveContractProduct,
} from '@/entities/advertisement-contract/api/useAdvertisementContracts';
import {
  CONTRACT_STATUS_TONE,
  formatPaymentAmount,
} from '@/entities/advertisement-contract/lib/contract';
import { reportProductsOf } from '@/entities/advertisement-contract/api/useContractReport';
import type { AdvertisementExposure } from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import { useAdvertisementExposures } from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import {
  AD_POSTING_FIXED_TARGET,
  isAdPostingPosition,
  type AdPostingExposure,
  type AdPostingPosition,
} from '@/entities/advertisement-exposure/lib/adPosting';
import {
  quickTargetsOf,
  useAddContractTarget,
} from '@/entities/advertisement-contract/api/useContractTargets';
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
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { AdPostingFormModal } from '@/widgets/ad-posting-form';
import { BannerFormModal } from '@/widgets/banner-form';
import type { ContentTarget } from '@/widgets/content-target-picker';
import { PageHeader } from '@/widgets/page-header';
import { ProductReportModal, reportCellLabel, unavailableMessage } from './ProductReportModal';
import { ContractReportSummaryCard } from './ContractReportSummaryCard';
import { AdTargetsField } from './AdTargetsField';
import { isReportEnabled } from '@/shared/config/reports';
import { formatDateRange } from '../lib/reportFormat';
import { ProductAddForm } from './ProductAddForm';
import { ProductEndDateModal } from './ProductEndDateModal';

type BannerProduct = AdvertisementProduct & { position: BannerPosition };

/** 계약 상품 행에서 연 배너 모달. `exposure` 가 `null` 이면 새로 건다. */
interface BannerEdit {
  product: BannerProduct;
  row: AdminAdvertisementContractProductResponse;
  exposure: AdvertisementExposure | null;
}

/** 게시 종료일을 바꿀 계약 상품. 기간이 있는 상품만 바꾼다. */
type DatedProduct = AdminAdvertisementContractProductResponse & {
  startDate: string;
  endDate: string;
};

const isDated = (row: AdminAdvertisementContractProductResponse): row is DatedProduct =>
  Boolean(row.startDate && row.endDate);

/** 계약 상품 행에서 연 광고 공고 모달. `exposure` 가 `null` 이면 새로 건다. */
interface PostingEdit {
  product: AdvertisementProduct;
  position: AdPostingPosition | null;
  row: AdminAdvertisementContractProductResponse;
  exposure: AdPostingExposure | null;
}

/**
 * 계약 상품 행의 관리 버튼. 배너·광고 공고가 같은 규칙이다 — 등록은 채움, 수정은 파란 외곽선, 빼기는 회색 외곽선. 모두 같은
 * 높이·한 줄이고, 클릭 뒤 포커스 테두리는 남기지 않고 키보드 포커스에만 보인다. 노출이 여럿이면 `· 3` 처럼 개수를 붙인다.
 */
function RowActionButton({
  kind,
  label,
  count,
  ...props
}: {
  kind: 'register' | 'edit' | 'remove';
  label: string;
  count?: number;
} & Omit<ComponentProps<typeof Button>, 'children'>) {
  return (
    <Button
      size="sm"
      variant={kind === 'register' ? 'primary' : 'secondary'}
      className={cn(
        'h-8 shrink-0 px-2.5 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
        kind === 'edit' && 'border-blue-300 text-blue-600 hover:bg-blue-50',
        kind === 'remove' && 'text-gray-600',
      )}
      {...props}
    >
      {label}
      {count ? <span className="pl-1 text-xs font-medium opacity-80">· {count}</span> : null}
    </Button>
  );
}

/** `YYYY-MM-DD` 다음 날. 광고 공고 노출 끝은 상품 종료일 다음 날 00:00(KST)이다. */
function nextDay(date: string): string {
  const time = Date.parse(`${date}T00:00:00Z`) + 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

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
  // 펼친 상품 리포트. 주소에 남겨 새로고침·공유해도 같은 리포트가 열린다.
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const productParam = Number(searchParams.get('product'));
  const selectedProductId =
    Number.isInteger(productParam) && productParam > 0 ? productParam : null;
  const openReport = (id: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('product', String(id));
    // 이 화면에서 열었다는 표시. 닫을 때 기록을 하나 되돌려, 뒤로 가기가 닫힌 같은 화면을 한 번 더 밟지 않게 한다.
    setSearchParams(next, { state: { reportOpenedHere: true } });
  };
  const closeReport = () => {
    if ((location.state as { reportOpenedHere?: boolean } | null)?.reportOpenedHere) {
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('product');
    setSearchParams(next, { replace: true });
  };

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
      {/*
       * 위계(2026-11-19 사용자): 계약 정보(광고할 공고 포함) → 계약 전체 성과 → 상품 목록(누르면 그 상품 리포트) → 걸린 노출 → 신청
       * 메모. 카드 사이는 같은 간격, 카드 제목은 같은 크기다.
       */}
      <div className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ContractInfoCard contract={contract} />
          <div className="flex flex-col gap-6">
            <StatusCard contract={contract} />
            <PaymentAmountCard key={contract.paymentAmount ?? 'none'} contract={contract} />
            {contract.source === 'APPLICATION_FORM' ? (
              <BusinessAccountCard contract={contract} />
            ) : null}
          </div>
        </div>
        {/* 리포트 API(LC-3647) 배포 전에는 리포트 화면을 그리지 않는다(`shared/config/reports.ts`). */}
        {isReportEnabled ? <ContractReportSummaryCard contractId={contract.id} /> : null}
        <ProductsCard contract={contract} onOpenReport={isReportEnabled ? openReport : undefined} />
        <ExposuresCard contract={contract} />
        <RequestMemoCard contract={contract} />
      </div>
      {isReportEnabled && selectedProductId !== null ? (
        <ProductReportModal
          contract={contract}
          contractProductId={selectedProductId}
          onClose={closeReport}
        />
      ) : null}
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first-of-type:mt-3">
      <h3 className="text-xs font-semibold text-gray-500">{title}</h3>
      <dl className="mt-1 divide-y divide-gray-100 border-t border-gray-100">{children}</dl>
    </section>
  );
}

/**
 * biz 신청서가 홍보 목표를 순위대로 보내는 답의 key(apps/business ad-application `toRequest`). 있으면 `purpose`(1순위 enum)
 * 대신 이 답을 홍보 목표 칸에 보이고, 답 목록에서는 뺀다.
 */
const PURPOSE_PRIORITY_KEY = 'purposePriority';

/** 계약 정보: 무엇을 누가 광고하는지와 담당자·정산. 비즈니스 공고 계약은 신청서가 없어 담당자·세금계산서 등이 비어 있다. */
function ContractInfoCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const href = targetHref(contract);
  return (
    <Card>
      <CardTitle>계약 정보</CardTitle>
      <Section title="공고">
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
        {isReportEnabled ? (
          <Row label="광고할 공고">
            <AdTargetsField contract={contract} />
          </Row>
        ) : null}
      </Section>
      <Section title="담당자·정산">
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
      </Section>
    </Card>
  );
}

/** 신청 메모: 신청서의 광고 요청(홍보 목표, 예산, 문항 답, 일정·요청 사항). 운영자가 상품을 고를 때 참고한다. */
function RequestMemoCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const purposeAnswer = contract.formAnswers?.find((a) => a.key === PURPOSE_PRIORITY_KEY);
  const answers = contract.formAnswers?.filter((a) => a.key !== PURPOSE_PRIORITY_KEY) ?? [];
  return (
    <Card>
      <CardTitle>신청 메모</CardTitle>
      <Section title="광고 요청">
        <Row label="홍보 목표">
          {purposeAnswer ? (
            <ol className="flex flex-col gap-1">
              {purposeAnswer.value.split('\n').map((line) => {
                // `1순위 폭넓은 노출 확보` 를 순위와 문구로 나눠, 문구가 길면 문구끼리 줄을 맞춘다.
                const [rank, ...rest] = line.split(' ');
                return (
                  <li key={line} className="flex items-start gap-2">
                    <span className="shrink-0 font-semibold whitespace-nowrap text-blue-600">
                      {rank}
                    </span>
                    <span className="min-w-0 break-keep">{rest.join(' ')}</span>
                  </li>
                );
              })}
            </ol>
          ) : contract.purpose ? (
            enumLabel('AdvertisementContractPurpose', contract.purpose)
          ) : null}
        </Row>
        <Row label="예정 예산">
          {contract.budgetAmount != null
            ? `${contract.budgetAmount.toLocaleString('ko-KR')}원`
            : null}
        </Row>
        {/* 신청서에서 칸이 따로 없는 문항의 답. 이 값이 생기기 전 신청은 없어서 아래 일정 요청에 그대로 있다. */}
        {answers.map((answer) => (
          <Row key={answer.key} label={answer.label}>
            {answer.value}
          </Row>
        ))}
        <Row label="희망 카테고리">
          {contract.categories
            .map((category) => enumLabel('AdvertisementProductCategory', category))
            .join(', ') || null}
        </Row>
        <Row label="일정 요청">{contract.scheduleRequest}</Row>
        <Row label="요청 사항">{contract.advertisementRequest}</Row>
      </Section>
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
 * 비즈니스 계정 발급(BE LC-3600). 비회원 신청이면 신청 이메일을 로그인 이메일로 계정을 만들고 같은 이메일의 비회원 신청을 모두
 * 붙인다. 고객은 그 계정으로 biz 에 로그인해 신청 내역을 본다. 회원이 붙은 신청(`userId`)은 발급할 일이 없어 회원 링크만 둔다.
 *
 * 새로 만든 계정의 임시 비밀번호는 응답에만 있고 다시 볼 수 없다. 발급 직후 이 카드에서만 보이고, 화면을 떠나면 사라진다.
 * 메일로도 가므로 놓쳐도 고객은 메일이나 biz 의 비밀번호 찾기로 받는다.
 */
function BusinessAccountCard({ contract }: { contract: AdminAdvertisementContractDetailResponse }) {
  const issue = useIssueBusinessAccount(contract.id);
  const result = issue.data;

  return (
    <Card>
      <CardTitle>비즈니스 계정</CardTitle>
      <div className="mt-3 flex flex-col gap-3 text-sm">
        {result ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-gray-900">
              {result.created
                ? '계정을 새로 만들고 임시 비밀번호를 메일로 보냈습니다.'
                : '이미 있는 비즈니스 계정에 연결했습니다. 비밀번호와 메일은 바꾸지 않았습니다.'}
            </p>
            <dl className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-gray-500">로그인 이메일</dt>
                <dd className="break-all text-gray-900">{result.loginEmail}</dd>
              </div>
              {result.temporaryPassword ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-gray-500">임시 비밀번호</dt>
                  <dd className="font-mono break-all text-gray-900 select-all">
                    {result.temporaryPassword}
                  </dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-gray-500">연결한 신청</dt>
                <dd className="text-gray-900">{result.linkedContractCount}건</dd>
              </div>
            </dl>
            {result.temporaryPassword ? (
              <p className="pt-1 text-xs text-gray-500">
                임시 비밀번호는 지금만 보입니다. 화면을 떠나면 다시 볼 수 없습니다.
              </p>
            ) : null}
          </div>
        ) : contract.userId != null ? (
          <p className="text-gray-500">
            회원이 붙은 신청입니다.{' '}
            <Link
              to={`/members/companies/${contract.userId}`}
              className="text-blue-500 hover:underline"
            >
              회원 정보
            </Link>
          </p>
        ) : (
          <>
            <p className="text-gray-500">
              비회원 신청입니다. 신청 이메일({contract.email ?? '-'})로 계정을 만들고, 같은 이메일로
              낸 비회원 신청을 모두 이 계정에 붙입니다. 이미 그 이메일의 비즈니스 계정이 있으면
              연결만 합니다.
            </p>
            <Button
              size="sm"
              className="self-start"
              disabled={issue.isPending}
              onClick={() => issue.mutate()}
            >
              {issue.isPending ? '발급하는 중' : '계정 발급'}
            </Button>
          </>
        )}
        {issue.isError ? (
          <Callout tone="error">
            {advertisementErrorMessage(issue.error, '계정을 발급하지 못했습니다.')}
          </Callout>
        ) : null}
      </div>
    </Card>
  );
}

/**
 * 판매한 상품(계약 상품). 상품은 게시 시작일·종료일과 함께 넣는다(BE LC-3599, 하루 단위, 종료일 포함). 같은 상품을 여러 번
 * 붙일 수 있다. 지운 상품도 계약에는 남아 `삭제된 상품` 으로 보인다. 기간을 넣기 전에 붙인 상품은 기간이 `-` 다.
 *
 * 게시 기간은 데이터 집계 기간(리포트가 보는 기간)이고, 노출 기간은 광고가 실제로 보이는 기간이다(계약 12절). 둘은 연동하지
 * 않는다. 기간이 있는 상품은 `변경` 으로 게시 종료일만 바꾸고, 그때 끝이 같은 노출을 함께 옮길 수 있다.
 *
 * 배너·광고 공고 상품 줄에는 같은 규칙의 버튼이 있다 — 이 계약의 노출이 없으면 `배너 등록`·`공고 등록`(이 계약을 연결 계약으로
 * 미리 채운 등록 모달), 있으면 `배너 수정`·`공고 수정`(여럿이면 개수, 모달 안에서 고르기). 세팅 화면과 같은 모달이고, 저장하면
 * 아래 `걸린 노출` 과 세팅 목록에 바로 보인다.
 */
function ProductsCard({
  contract,
  onOpenReport,
}: {
  contract: AdminAdvertisementContractDetailResponse;
  /** 리포트 모달(`?product=`)을 연다. 리포트가 꺼져 있으면 없고, 행은 정보만 보인다. */
  onOpenReport?: (contractProductId: number) => void;
}) {
  const products = useAdvertisementProducts();
  const reportProducts = reportProductsOf(contract);
  // 리포트가 없는 상품을 누르면 모달 대신 표 아래 한 줄로 이유를 보인다.
  const [noticeId, setNoticeId] = useState<number | null>(null);
  const notice = reportProducts.find((item) => item.contractProductId === noticeId);
  const openRow = (id: number) => {
    const item = reportProducts.find((candidate) => candidate.contractProductId === id);
    if (item?.reportAvailable) {
      setNoticeId(null);
      onOpenReport?.(id);
    } else {
      setNoticeId(id);
    }
  };
  const remove = useRemoveContractProduct(contract.id);
  const [bannerEdit, setBannerEdit] = useState<BannerEdit | null>(null);
  const [postingEdit, setPostingEdit] = useState<PostingEdit | null>(null);
  const [endDateEdit, setEndDateEdit] = useState<DatedProduct | null>(null);
  const contractExposures = useContractExposures(
    contract.id,
    contract.products.map((product) => product.productId),
  );
  // 열린 광고 공고 모달의 자리 전체 노출. 같은 자리에 같은 공고를 두 번 고르지 못하게 막는다.
  const postingSiblings = useAdvertisementExposures(postingEdit?.product.id ?? null);
  const addTarget = useAddContractTarget(contract.id);

  /**
   * 광고 공고 상품은 카테고리(`JOB_POSTING`)로 가른다(2026-11-19 사용자). 자리가 없는 상품(`비즈니스 공고 등록`)도 노출을 걸 수
   * 있게 두되, 모달이 자리가 없어 웹 목록에 나오지 않는다고 알린다.
   */
  const postingProductOf = (row: AdminAdvertisementContractProductResponse) => {
    if (row.productDeleted || row.category !== 'JOB_POSTING') return null;
    const product = products.data?.find((candidate) => candidate.id === row.productId);
    if (!product) return null;
    const position = String(product.position ?? '');
    return { product, position: isAdPostingPosition(position) ? position : null };
  };

  /** 이 계약 상품에 걸린 노출. 같은 상품을 기간을 나눠 두 번 붙였으면 기간이 겹치는 것만. */
  const exposuresOf = (row: AdminAdvertisementContractProductResponse): AdPostingExposure[] =>
    contractExposures.data.filter(
      (exposure) =>
        exposure.productId === row.productId &&
        (!row.startDate ||
          !row.endDate ||
          ((!exposure.startAt || exposure.startAt.slice(0, 10) <= row.endDate) &&
            (!exposure.endAt || exposure.endAt.slice(0, 10) >= row.startDate))),
    );

  /** 새 광고 공고 모달의 기본 대상: 계약의 광고할 공고 중 그 자리에 걸 수 있는 첫 번째(공고 등록 계약이면 자동 대상). */
  const defaultTarget = (position: AdPostingPosition | null): ContentTarget | null => {
    const fixed = position ? AD_POSTING_FIXED_TARGET[position] : undefined;
    return quickTargetsOf(contract).find((target) => !fixed || target.targetType === fixed) ?? null;
  };

  const bannerProductOf = (row: AdminAdvertisementContractProductResponse) => {
    if (row.productDeleted) return null;
    const product = products.data?.find((candidate) => candidate.id === row.productId);
    return product && isBannerProduct(product) ? product : null;
  };

  const reportColumn: DataTableColumn<AdminAdvertisementContractProductResponse> = {
    key: 'report',
    header: '리포트',
    width: 'w-28',
    render: (row) => {
      const item = reportProducts.find(
        (candidate) => candidate.contractProductId === row.contractProductId,
      );
      if (!item) return null;
      return (
        <span
          className={cn(
            'text-sm whitespace-nowrap',
            item.reportAvailable ? 'text-blue-600' : 'text-gray-400',
          )}
        >
          {reportCellLabel(item)}
        </span>
      );
    },
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
      key: 'period',
      header: '게시 기간',
      width: 'w-56',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          {formatDateRange(row.startDate, row.endDate)}
          {isDated(row) ? (
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              aria-label={`${row.productName} 게시 종료일 변경`}
              onClick={(event) => {
                // 행 전체가 리포트를 여는 자리라 여기서 멈춘다.
                event.stopPropagation();
                setEndDateEdit(row);
              }}
            >
              변경
            </button>
          ) : null}
        </span>
      ),
    },
    {
      key: 'addedAt',
      header: '넣은 날',
      width: 'w-36',
      render: (row) => <span className="text-sm">{formatKst(row.addedAt)}</span>,
    },
    ...(onOpenReport ? [reportColumn] : []),
    {
      key: 'actions',
      header: '관리',
      // 버튼 둘이 한 줄에 들어가는 고정 폭. 좁은 화면에서도 줄바꿈하지 않는다.
      width: 'w-60 min-w-60',
      render: (row) => {
        const banner = bannerProductOf(row);
        const bannerExposures = banner ? exposuresOf(row) : [];
        const posting = postingProductOf(row);
        const postingExposures = posting ? exposuresOf(row) : [];
        return (
          // 행 전체가 리포트를 여는 자리라 버튼 클릭은 여기서 멈춘다.
          <span
            className="flex flex-nowrap items-center gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            {banner ? (
              <RowActionButton
                kind={bannerExposures.length > 0 ? 'edit' : 'register'}
                label={bannerExposures.length > 0 ? '배너 수정' : '배너 등록'}
                count={bannerExposures.length > 1 ? bannerExposures.length : undefined}
                aria-label={`${row.productName} ${bannerExposures.length > 0 ? '배너 수정' : '배너 등록'}`}
                onClick={() =>
                  setBannerEdit({ product: banner, row, exposure: bannerExposures[0] ?? null })
                }
              />
            ) : null}
            {posting ? (
              <RowActionButton
                kind={postingExposures.length > 0 ? 'edit' : 'register'}
                label={postingExposures.length > 0 ? '공고 수정' : '공고 등록'}
                count={postingExposures.length > 1 ? postingExposures.length : undefined}
                aria-label={`${row.productName} ${postingExposures.length > 0 ? '공고 수정' : '공고 등록'}`}
                onClick={() =>
                  setPostingEdit({
                    ...posting,
                    row,
                    exposure: postingExposures[0] ?? null,
                  })
                }
              />
            ) : null}
            <RowActionButton
              kind="remove"
              label="빼기"
              aria-label={`${row.productName} 빼기`}
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(row.contractProductId, {
                  onSuccess: () => {
                    if (noticeId === row.contractProductId) setNoticeId(null);
                  },
                })
              }
            />
          </span>
        );
      },
    },
  ];

  return (
    <Card>
      <CardTitle>계약 상품</CardTitle>
      <div className="mt-3 flex flex-col gap-3">
        <ProductAddForm contract={contract} />
        {remove.isError ? (
          <Callout tone="error">
            {advertisementErrorMessage(remove.error, '계약 상품을 빼지 못했습니다.')}
          </Callout>
        ) : null}
        <DataTable
          columns={columns}
          rows={contract.products}
          rowKey={(row) => row.contractProductId}
          onRowClick={onOpenReport ? (row) => openRow(row.contractProductId) : undefined}
          emptyMessage="넣은 상품이 없습니다. 판매한 상품을 넣으세요."
        />
        {!onOpenReport ? null : notice ? (
          <p className="text-sm text-gray-600">
            {notice.productName}: {unavailableMessage(notice)}
          </p>
        ) : contract.products.length > 0 ? (
          <p className="text-xs text-gray-500">상품을 누르면 그 상품의 성과 리포트가 열려요.</p>
        ) : null}
      </div>
      {bannerEdit ? (
        <BannerFormModal
          key={`${bannerEdit.row.contractProductId}-${bannerEdit.exposure?.id ?? 'new'}`}
          open
          product={bannerEdit.product}
          exposure={bannerEdit.exposure}
          initialContract={{ id: contract.id, companyName: contract.companyName }}
          siblings={exposuresOf(bannerEdit.row)}
          onSwitch={(exposure) => setBannerEdit({ ...bannerEdit, exposure })}
          onClose={() => setBannerEdit(null)}
        />
      ) : null}
      {postingEdit ? (
        <AdPostingFormModal
          key={`${postingEdit.row.contractProductId}-${postingEdit.exposure?.id ?? 'new'}`}
          product={postingEdit.product}
          position={postingEdit.position}
          exposure={postingEdit.exposure}
          taken={postingSiblings.data ?? []}
          initialContract={{ id: contract.id, companyName: contract.companyName }}
          initialTarget={defaultTarget(postingEdit.position)}
          quickTargets={quickTargetsOf(contract)}
          initialPeriod={
            postingEdit.row.startDate && postingEdit.row.endDate
              ? {
                  startAt: `${postingEdit.row.startDate}T00:00`,
                  endAt: `${nextDay(postingEdit.row.endDate)}T00:00`,
                }
              : undefined
          }
          onRegisterTarget={
            isReportEnabled
              ? async (target) => {
                  try {
                    await addTarget.mutateAsync({
                      targetType: target.targetType,
                      targetId: target.targetId,
                    });
                  } catch (failure) {
                    // 이미 광고할 공고면 할 일이 끝난 것이다.
                    if (failure instanceof HttpError && failure.status === 409) return;
                    throw failure;
                  }
                }
              : undefined
          }
          siblings={exposuresOf(postingEdit.row)}
          onSwitch={(exposure) => setPostingEdit({ ...postingEdit, exposure })}
          onClose={() => setPostingEdit(null)}
        />
      ) : null}
      {endDateEdit ? (
        <ProductEndDateModal
          key={endDateEdit.contractProductId}
          contractId={contract.id}
          row={endDateEdit}
          exposures={contractExposures.data.filter(
            (exposure) => exposure.productId === endDateEdit.productId,
          )}
          onClose={() => setEndDateEdit(null)}
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
    {
      key: 'name',
      header: '이름',
      // 광고 공고 노출은 이름이 없어 띄운 공고 제목을 보인다.
      render: (row: AdPostingExposure) =>
        row.name ?? (row.targetTitle ? `광고 공고 · ${row.targetTitle}` : '-'),
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
  ];

  return (
    <Card>
      <CardTitle>걸린 노출</CardTitle>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm text-gray-500">
          노출은 위 계약 상품의 `배너 등록`·`공고 등록` 으로 바로 겁니다. 자리 전체의 순서·켜기는{' '}
          <Link to="/business/banners" className="text-blue-500 hover:underline">
            배너 세팅
          </Link>
          ·{' '}
          <Link to="/business/ad-postings" className="text-blue-500 hover:underline">
            광고 공고 세팅
          </Link>
          에서도 합니다. 계약에 넣은 상품의 자리만 여기서 보입니다.
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
