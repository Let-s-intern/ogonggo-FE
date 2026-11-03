'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { enumLabel } from '@ogonggo/api';
import { Badge, Button, useToast } from '@ogonggo/ui';
import {
  type AdApplication,
  AdStageTrack,
  adStatusPill,
  approveAdCreative,
  fetchMyAdApplication,
  formatShortDate,
  formatWon,
  myAdApplicationKey,
  requestAdCreativeRevision,
} from '@/entities/advertisement';
import { SALES_EMAIL } from '@/shared/config/site';
import { MY_ADS_PATH, myAdReportHref } from '@/widgets/my-ads';
import { adTodoOf, canRequestCancel } from '../model/todo';
import { CreativePreview } from './CreativePreview';

const WAITLIST_LABELS = {
  NONE: '대기 안 함',
  SAME_PERIOD: '같은 기간 취소 시 연락',
  ANY_PERIOD: '다른 기간이어도 연락',
};
const TAX_LABELS = { CLAIM: '청구', RECEIPT: '영수' };

/**
 * 마이페이지 > 광고 > 광고 조회(시안 B-05). `지금 할 일`, 지면별 소재 미리보기와 `이대로 게재` · `수정 요청`, 신청 내역,
 * 담당자·계약·세금계산서(접힘), 이력, 취소 요청.
 *
 * 취소 요청 API 는 아직 없어 담당 메일로 보낸다(요청서). 확정 뒤에는 시작 3일 전까지만 받는다.
 */
export function MyAdDetail({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const {
    data: ad,
    isPending,
    isError,
  } = useQuery({
    queryKey: myAdApplicationKey(id),
    queryFn: () => fetchMyAdApplication(id),
  });

  const onUpdated = (next: AdApplication, message: string) => {
    queryClient.setQueryData(myAdApplicationKey(id), next);
    void queryClient.invalidateQueries({ queryKey: ['advertisements', 'mine'], exact: false });
    const allApproved = next.items.every((item) => item.creative.confirmStatus === 'APPROVED');
    toast.show({
      message: allApproved ? '모든 소재를 확인했어요. 운영자가 승인하면 확정돼요.' : message,
    });
  };
  const approve = useMutation({
    mutationFn: (creativeId: number) => approveAdCreative(id, creativeId),
    onSuccess: (next) => onUpdated(next, '이대로 게재하도록 확인했어요.'),
    onError: () => toast.show({ message: '확인하지 못했어요. 잠시 후 다시 시도해 주세요.' }),
  });
  const revise = useMutation({
    mutationFn: ({ creativeId, message }: { creativeId: number; message: string }) =>
      requestAdCreativeRevision(id, creativeId, message),
    onSuccess: (next) => onUpdated(next, '수정 요청을 보냈어요.'),
    onError: () =>
      toast.show({ message: '수정 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.' }),
  });

  if (isError) {
    return (
      <p role="alert" className="text-sm text-error">
        광고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }
  if (isPending) {
    return <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  const pill = adStatusPill(ad.status, ad.rejection);
  const todo = adTodoOf(ad);
  const reviewable = ad.status === 'REVIEWING' && !ad.rejection;
  const couponOnly = ad.amount.total === 0;
  const tags = [...new Set(ad.items.flatMap((item) => item.creative.skillTags))];
  const cancellable = canRequestCancel(ad);

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={MY_ADS_PATH}
          className="hidden text-sm text-gray-500 hover:text-gray-800 md:inline"
        >
          ← 광고
        </Link>
        <span className="flex items-center gap-2">
          <Badge tone={pill.tone} className="rounded-full">
            {pill.label}
          </Badge>
          <span className="text-sm text-gray-500">{ad.applicationNo}</span>
        </span>
        <h2 className="text-xl font-bold text-gray-950 md:text-2xl">
          {ad.postTitle}
          <span className="pl-1 text-base font-normal text-gray-500">
            · 상품 {ad.items.length}개
          </span>
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[440px]">
            <AdStageTrack status={ad.status} rejection={ad.rejection} skipBilling={couponOnly} />
          </div>
        </div>
      </div>

      <section
        aria-label="지금 할 일"
        className={
          ad.rejection
            ? 'rounded-md border border-red-200 bg-red-50 p-5'
            : 'rounded-md border border-blue-200 bg-blue-00 p-5'
        }
      >
        <p className="text-xs font-semibold text-gray-500">지금 할 일</p>
        <p className="pt-1 text-lg font-bold text-gray-900">{todo.title}</p>
        <p className="pt-1 text-sm text-gray-700">{todo.description}</p>
        {todo.action === 'creatives' ? (
          <a
            href="#creatives"
            className="inline-block pt-3 text-sm font-semibold text-blue-500 hover:underline"
          >
            소재 미리보기로 이동
          </a>
        ) : todo.action === 'report' ? (
          <Button asChild size="sm" className="mt-3">
            <Link href={myAdReportHref(ad.id)}>성과 보기</Link>
          </Button>
        ) : todo.action === 'editPost' ? (
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link href={`/mypage/company/posts/jobs/${ad.postId}/edit`}>공고 수정하기</Link>
          </Button>
        ) : null}
      </section>

      <section id="creatives" className="flex scroll-mt-6 flex-col gap-3">
        <h3 className="text-base font-bold text-gray-900">소재 미리보기</h3>
        <ul className="grid gap-3 md:grid-cols-2">
          {ad.items.map((item) => (
            <CreativePreview
              key={item.id}
              item={item}
              postTitle={ad.postTitle}
              companyName={ad.companyName}
              reviewable={reviewable}
              pending={approve.isPending || revise.isPending}
              onApprove={() => approve.mutate(item.creative.id)}
              onRequestRevision={(message) =>
                revise.mutate({ creativeId: item.creative.id, message })
              }
            />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-gray-900">신청 내역</h3>
        <ul className="flex flex-col divide-y divide-gray-100 rounded-md border border-gray-200">
          {ad.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm"
            >
              <span className="font-semibold text-gray-900">{item.placementName}</span>
              <span className="text-gray-500">
                {item.jobField ? `${enumLabel('JobField', item.jobField)} · ` : ''}
                {formatShortDate(item.startDate)} ~ {formatShortDate(item.endDate)} · {item.weeks}주
              </span>
              <span className="ml-auto font-semibold text-gray-900">
                {item.couponApplied ? '무료 쿠폰' : formatWon(item.amount)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 rounded-md bg-gray-50 px-4 py-3 text-sm">
          <dt className="text-gray-500">소계</dt>
          <dd className="text-right text-gray-900">{formatWon(ad.amount.subtotal)}</dd>
          <dt className="text-gray-500">복합 할인</dt>
          <dd className="text-right text-gray-900">
            {ad.amount.discount ? `-${formatWon(ad.amount.discount)}` : '0원'}
          </dd>
          <dt className="text-gray-500">무료 쿠폰</dt>
          <dd className="text-right text-gray-900">
            {ad.amount.coupon ? `-${formatWon(ad.amount.coupon)}` : '0원'}
          </dd>
          <dt className="font-bold text-gray-900">합계</dt>
          <dd className="text-right font-bold text-gray-900">
            {formatWon(ad.amount.total)}{' '}
            <span className="text-xs font-normal text-gray-500">
              VAT 별도{ad.paid ? ' · 입금 확인됨' : ''}
            </span>
          </dd>
        </dl>
        {tags.length > 0 ? (
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            역량 태그
            {tags.map((tag) => (
              <Badge key={tag} tone="neutral" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </p>
        ) : null}
      </section>

      <details className="group rounded-md border border-gray-200">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
          담당자 · 계약 · 세금계산서 정보
          <span
            aria-hidden="true"
            className="icon-[lucide--chevron-down] block h-4 w-4 text-gray-400 transition-transform group-open:rotate-180"
          />
        </summary>
        <dl className="grid grid-cols-[7rem_1fr] gap-y-2 border-t border-gray-100 px-4 py-3 text-sm">
          <dt className="text-gray-500">담당자</dt>
          <dd className="text-gray-900">
            {[ad.contact.name, ad.contact.phone, ad.contact.email].join(' · ')}
          </dd>
          <dt className="text-gray-500">회사명</dt>
          <dd className="text-gray-900">{ad.contact.companyName}</dd>
          <dt className="text-gray-500">계약서 수신</dt>
          <dd className="text-gray-900">
            {ad.billing?.contractEmail ?? '0원 신청이라 받지 않아요'}
          </dd>
          <dt className="text-gray-500">세금계산서</dt>
          <dd className="text-gray-900">
            {ad.billing
              ? `${ad.billing.taxInvoiceEmail} · ${TAX_LABELS[ad.billing.taxInvoiceType]}`
              : '0원 신청이라 받지 않아요'}
          </dd>
          <dt className="text-gray-500">대기 등록</dt>
          <dd className="text-gray-900">{WAITLIST_LABELS[ad.waitlist]}</dd>
        </dl>
      </details>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-gray-900">이력</h3>
        <ol className="flex flex-col gap-2 border-l-2 border-gray-100 pl-4">
          {[...ad.history].reverse().map((entry) => (
            <li key={`${entry.at}-${entry.message}`} className="text-sm">
              <span className="pr-2 text-xs text-gray-400">
                {entry.at.slice(0, 16).replace('T', ' ')}
              </span>
              <span className="text-gray-800">{entry.message}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col items-start gap-1 border-t border-gray-100 pt-4">
        {cancellable ? (
          <a
            href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`[광고 취소 요청] ${ad.applicationNo}`)}`}
            className="text-sm font-semibold text-gray-500 underline hover:text-gray-800"
          >
            취소 요청
          </a>
        ) : (
          <span className="text-sm text-gray-300">취소 요청</span>
        )}
        <span className="text-xs text-gray-400">
          확정 후에는 시작 3일 전까지 취소를 요청할 수 있어요.
        </span>
      </div>
    </article>
  );
}
