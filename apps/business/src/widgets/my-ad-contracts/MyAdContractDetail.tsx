'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import {
  enumLabel,
  getMyAdvertisementContract,
  HttpError,
  type MyAdvertisementContractDetailResponse,
  type SuccessResponseMyAdvertisementContractDetailResponse,
} from '@ogonggo/api';
import { Badge, cn } from '@ogonggo/ui';
import { formatDateDots } from '@/shared/lib/localDate';
import { StageTrack } from '@/shared/ui/StageTrack';
import {
  formatPaymentAmount,
  MY_AD_CONTRACTS_HREF,
  STATUS_HINTS,
  STATUS_STEPS,
  statusBadge,
} from './model';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; contract: MyAdvertisementContractDetailResponse }
  | { kind: 'notFound' }
  | { kind: 'error' };

/** 사업자 번호 칸. 하이픈은 가입 화면과 같은 자리(3-2-5, 6-7)에 넣는다. 서버는 숫자만 준다. */
function businessNumberText(contract: MyAdvertisementContractDetailResponse): string | null {
  const { businessNumberType: type, businessNumber: number } = contract;
  if (!type) return null;
  const label = enumLabel('CompanyBusinessNumberType', type);
  if (!number) return label;
  const formatted =
    type === 'CORPORATE_REGISTRATION'
      ? `${number.slice(0, 6)}-${number.slice(6)}`
      : `${number.slice(0, 3)}-${number.slice(3, 5)}-${number.slice(5)}`;
  return `${label} ${formatted}`;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="break-words whitespace-pre-wrap text-gray-900">{children ?? '-'}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-gray-950">{title}</h2>
      <dl className="divide-y divide-gray-100 border-y border-gray-100">{children}</dl>
    </section>
  );
}

/**
 * 내 광고 신청 상세(`GET /api/v1/users/me/advertisement-contracts/{contractId}`, BE LC-3590). 신청 폼에 낸 값,
 * 상태, 협의 금액, 운영자가 계약에 넣은 광고 상품을 보인다. 다른 회원의 신청은 BE 가 404 로 준다.
 */
export function MyAdContractDetail({ contractId }: { contractId: number }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    (
      getMyAdvertisementContract(
        contractId,
      ) as unknown as Promise<SuccessResponseMyAdvertisementContractDetailResponse>
    )
      .then((response) => {
        if (!active) return;
        setState(response.data ? { kind: 'ready', contract: response.data } : { kind: 'error' });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          kind: error instanceof HttpError && error.status === 404 ? 'notFound' : 'error',
        });
      });
    return () => {
      active = false;
    };
  }, [contractId]);

  const back = (
    <Link
      href={MY_AD_CONTRACTS_HREF}
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
    >
      <span aria-hidden="true" className="icon-[lucide--chevron-left] block size-4" />
      신청 내역
    </Link>
  );

  if (state.kind !== 'ready') {
    return (
      <section className="flex flex-col gap-5">
        <div className="hidden md:block">{back}</div>
        <p
          role={state.kind === 'loading' ? undefined : 'alert'}
          className="rounded-md border border-gray-200 px-4 py-16 text-center text-sm text-gray-500"
        >
          {state.kind === 'loading'
            ? '불러오는 중입니다.'
            : state.kind === 'notFound'
              ? '신청을 찾을 수 없습니다.'
              : '신청을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'}
        </p>
      </section>
    );
  }

  const { contract } = state;
  const badge = statusBadge(contract.status);
  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="hidden md:block">{back}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <span className="text-sm text-gray-500">
            신청일 {formatDateDots(contract.registeredAt)}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">
          {contract.recruitmentTitle}
        </h1>
        <div className="mt-2 max-w-xs">
          <StageTrack steps={STATUS_STEPS[contract.status]} />
        </div>
        <p className={cn('text-sm', STATUS_HINTS[contract.status].className)}>
          {STATUS_HINTS[contract.status].text}
        </p>
      </header>

      <Section title="공고 정보">
        <Row label="홍보 유형">
          {enumLabel('AdvertisementContractPromotionTarget', contract.promotionTarget)}
        </Row>
        <Row label="기업명">{contract.companyName}</Row>
        <Row label="공고·지원 링크">
          <a
            href={contract.recruitmentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {contract.recruitmentUrl}
          </a>
        </Row>
        <Row label="모집 마감일">{formatDateDots(contract.recruitmentDeadline)}</Row>
        <Row label="광고 목적">{enumLabel('AdvertisementContractPurpose', contract.purpose)}</Row>
      </Section>

      <Section title="광고 신청 내역">
        <Row label="희망 카테고리">
          {contract.categories
            .map((category) => enumLabel('AdvertisementProductCategory', category))
            .join(', ')}
        </Row>
        <Row label="예정 예산">
          {contract.budgetRange
            ? enumLabel('AdvertisementContractBudgetRange', contract.budgetRange)
            : null}
        </Row>
        <Row label="일정 요청">{contract.scheduleRequest}</Row>
        <Row label="추가 요청">{contract.advertisementRequest}</Row>
        <Row label="협의 금액">{formatPaymentAmount(contract.paymentAmount)}</Row>
        <Row label="광고 상품">
          {contract.products.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {contract.products.map((product) => (
                <li key={product.contractProductId}>
                  {product.productName}
                  <span className="text-gray-500">
                    {' · '}
                    {enumLabel('AdvertisementProductCategory', product.category)}
                    {product.position
                      ? ` · ${enumLabel('AdvertisementProductPosition', product.position)}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            '담당자 확인 후 정해집니다.'
          )}
        </Row>
      </Section>

      <Section title="담당자·계약">
        <Row label="담당자">{contract.managerName}</Row>
        <Row label="이메일">{contract.email}</Row>
        <Row label="연락처">{contract.phoneNumber}</Row>
        <Row label="사업자 번호">{businessNumberText(contract)}</Row>
        <Row label="계산서 발행">
          {enumLabel('AdvertisementContractInvoiceMethod', contract.invoiceMethod)}
        </Row>
        <Row label="소재 준비">
          {enumLabel('AdvertisementContractCreativeMethod', contract.creativeMethod)}
        </Row>
      </Section>
    </section>
  );
}
