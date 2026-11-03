import { useParams } from 'react-router';
import { Callout, Card, CardTitle } from '@ogonggo/ui';
import {
  useAdApplicationDetail,
  useAdPlacementSettings,
  type AdApplication,
} from '@/entities/advertisement/api/useAdvertisements';
import { AdApplicationStatusBadge } from '@/entities/advertisement/ui/AdApplicationStatusBadge';
import { formatCount, formatDateTime } from '@/shared/lib/format';
import { PageHeader } from '@/widgets/page-header';
import { AdApplicationActions } from './AdApplicationActions';
import { AdApplicationItemCard } from './AdApplicationItemCard';

/**
 * 광고 신청 상세(PRD `어드민 > 구좌 세팅`, 광고별 묶음). 신청 하나의 지면을 한 화면에서 보고, 소재를 올리거나 반려하고,
 * 상태를 바꾸고, 지면 묶음을 한 번에 확정·배치한다.
 */
export function AdApplicationDetailPage() {
  const { advertisementId } = useParams();
  const id = Number(advertisementId);
  const { data, isPending, isError } = useAdApplicationDetail(id);
  const { data: placements } = useAdPlacementSettings();
  const backTo = { to: '/business/ad-applications', label: '광고 신청' };

  if (isPending) {
    return (
      <>
        <PageHeader title="광고 신청" backTo={backTo} />
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중</p>
      </>
    );
  }
  if (isError || !data) {
    return (
      <>
        <PageHeader title="광고 신청" backTo={backTo} />
        <Callout tone="error">신청을 불러오지 못했습니다.</Callout>
      </>
    );
  }

  const placementOf = (key: string) =>
    placements?.find((setting) => setting.placement.key === key)?.placement;

  return (
    <>
      <PageHeader title={data.applicationNo} backTo={backTo} />
      <div className="flex flex-col gap-4">
        <Summary application={data} />
        {/* 소재 반려로 신청 반려가 바뀌면 폼의 반려 사유 칸을 새 값으로 다시 채운다. 안 그러면 빈 칸으로 저장해 반려가 풀린다. */}
        <AdApplicationActions key={data.rejection?.rejectedAt ?? 'none'} application={data} />
        {data.items.map((item) => (
          <AdApplicationItemCard
            key={item.id}
            applicationId={data.id}
            reviewing={data.status === 'REVIEWING'}
            item={item}
            placement={placementOf(item.placementKey)}
          />
        ))}
        <History application={data} />
      </div>
    </>
  );
}

function Summary({ application }: { application: AdApplication }) {
  const { amount, contact } = application;
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <AdApplicationStatusBadge application={application} />
        <CardTitle>{application.companyName}</CardTitle>
        <span className="text-sm text-gray-700">{application.postTitle}</span>
      </div>
      {application.rejection ? (
        <Callout tone="error" className="mt-4">
          반려 사유 · {application.rejection.reason} (
          {formatDateTime(application.rejection.rejectedAt)})
        </Callout>
      ) : null}
      <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 pt-4 text-sm">
        <dt className="text-gray-500">접수</dt>
        <dd className="text-gray-900">{formatDateTime(application.receivedAt)}</dd>
        <dt className="text-gray-500">금액</dt>
        <dd className="text-gray-900">
          {formatCount(amount.total)}원
          <span className="text-gray-500">
            {' '}
            (소계 {formatCount(amount.subtotal)} · 할인 {formatCount(amount.discount)} · 쿠폰{' '}
            {formatCount(amount.coupon)}) · {application.paid ? '입금 확인됨' : '입금 전'}
          </span>
        </dd>
        <dt className="text-gray-500">담당자</dt>
        <dd className="text-gray-900">
          {contact.name} · {contact.phone} · {contact.email}
        </dd>
        {application.billing ? (
          <>
            <dt className="text-gray-500">계약·세금계산서</dt>
            <dd className="text-gray-900">
              {application.billing.contractEmail} · {application.billing.taxInvoiceEmail}
            </dd>
          </>
        ) : null}
        {application.memo ? (
          <>
            <dt className="text-gray-500">메모</dt>
            <dd className="whitespace-pre-wrap text-gray-900">{application.memo}</dd>
          </>
        ) : null}
      </dl>
    </Card>
  );
}

function History({ application }: { application: AdApplication }) {
  return (
    <Card>
      <CardTitle>이력</CardTitle>
      <ol className="flex flex-col gap-1.5 pt-4 text-sm">
        {[...application.history].reverse().map((entry, index) => (
          <li key={`${entry.at}-${index}`} className="flex gap-4">
            <time dateTime={entry.at} className="w-44 shrink-0 text-gray-500">
              {formatDateTime(entry.at)}
            </time>
            <span className="text-gray-900">{entry.message}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
