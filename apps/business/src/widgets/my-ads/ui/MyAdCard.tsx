import Link from 'next/link';
import { enumLabel } from '@ogonggo/api';
import { Badge, Button } from '@ogonggo/ui';
import {
  type AdApplicationSummary,
  AdStageTrack,
  adStatusPill,
  formatShortDate,
  formatWon,
} from '@/entities/advertisement';
import { myAdDetailHref, myAdReportHref } from '../lib/query';

/**
 * 다음 행동 버튼(시안 B-02). 종료면 `성과 보기`, 반려면 `소재 수정하기`, 검수 단계면 `소재 확인하기`, 그 밖에는 `상세 보기`.
 * 목록에는 소재 확인 상태가 없어 검수 단계면 늘 `소재 확인하기` 다.
 */
function nextAction(ad: AdApplicationSummary): { label: string; href: string; primary: boolean } {
  if (ad.status === 'ENDED')
    return { label: '성과 보기', href: myAdReportHref(ad.id), primary: true };
  if (ad.rejection) return { label: '소재 수정하기', href: myAdDetailHref(ad.id), primary: true };
  if (ad.status === 'REVIEWING') {
    return { label: '소재 확인하기', href: `${myAdDetailHref(ad.id)}#creatives`, primary: true };
  }
  return { label: '상세 보기', href: myAdDetailHref(ad.id), primary: false };
}

/** 광고 목록 카드 한 장(시안 B-02). 상태 알약, 공고명·상품 수, 신청번호, 지면 칩, 금액, 여덟 단계, 다음 행동. */
export function MyAdCard({ ad }: { ad: AdApplicationSummary }) {
  const pill = adStatusPill(ad.status, ad.rejection);
  const action = nextAction(ad);
  const couponOnly = ad.amount.total === 0;
  return (
    <li className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-4 md:px-6 md:py-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={pill.tone} className="rounded-full">
              {pill.label}
            </Badge>
            <span className="text-xs text-gray-400">{ad.applicationNo}</span>
          </span>
          <Link
            href={myAdDetailHref(ad.id)}
            className="truncate text-base font-bold text-gray-900 hover:underline"
          >
            {ad.postTitle}
            <span className="pl-1 font-normal text-gray-500">· 상품 {ad.items.length}개</span>
          </Link>
          <ul className="flex flex-wrap gap-1.5">
            {ad.items.map((item) => (
              <li key={item.id}>
                <Badge tone="neutral" className="rounded-full">
                  {item.placementName}
                  {item.jobField ? ` · ${enumLabel('JobField', item.jobField)}` : ''} ·{' '}
                  {formatShortDate(item.startDate)}
                  {item.couponApplied ? ' · 쿠폰' : ''}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end">
          <p className="text-sm text-gray-700">
            <span className="text-base font-bold text-gray-950">{formatWon(ad.amount.total)}</span>
            <span className="pl-1 text-xs text-gray-500">
              VAT 별도{ad.paid ? ' · 입금 확인됨' : ''}
            </span>
          </p>
          <Button
            asChild
            size="sm"
            variant={action.primary ? 'primary' : 'secondary'}
            className="ml-auto md:ml-0"
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
          <AdStageTrack status={ad.status} rejection={ad.rejection} skipBilling={couponOnly} />
        </div>
      </div>
      {ad.rejection ? (
        <p className="rounded-xs bg-red-50 px-3 py-2 text-sm text-error">
          반려 사유 · {ad.rejection.reason}
        </p>
      ) : null}
    </li>
  );
}
