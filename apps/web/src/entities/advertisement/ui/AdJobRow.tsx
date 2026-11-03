import Link from 'next/link';
import { adHref, type AdExposure } from '../model/types';
import { AdLabel } from './AdLabel';

/**
 * 한 줄짜리 광고 공고 카드(로고, 회사명, 공고명, 해석 한 줄). 지원일정 대시보드 상단 추천(`my_dashboard_scrap`,
 * 시안 spec `공고 링크, 로고`)이 쓴다. 광고가 없으면 그리지 않는다.
 */
export function AdJobRow({ ad }: { ad?: AdExposure }) {
  if (!ad) {
    return null;
  }
  return (
    <Link
      href={adHref(ad)}
      data-ad-placement={ad.placementKey}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white">
        {ad.companyLogoUrl ? (
          <img src={ad.companyLogoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-gray-400">{ad.companyName.slice(0, 2)}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <AdLabel />
          <span className="truncate">{ad.companyName}</span>
        </span>
        <span className="truncate text-sm font-bold text-gray-900">{ad.postTitle}</span>
        {ad.headline ? <span className="truncate text-xs text-blue-500">{ad.headline}</span> : null}
      </span>
    </Link>
  );
}
