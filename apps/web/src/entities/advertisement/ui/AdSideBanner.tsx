import Link from 'next/link';
import { adHref, type AdExposure } from '../model/types';
import { AdLabel } from './AdLabel';

/**
 * 사이드 배너. 상세 PC 오른쪽 비슷한 공고 아래 자리(`job-detail-pc.png`)다. 상품 시안에 없는 자리라 규격이 정해지지
 * 않아 사이드바 폭에 맞춘 세로형 4:5 로 둔다(`.claude/tasks/memos/결정-광고시스템-web-광고자리-2026-11-03.md`).
 * 소재는 PC 이미지를 쓰고 `object-cover` 로 맞춘다. 광고가 없으면 그리지 않는다.
 */
export function AdSideBanner({ ad }: { ad?: AdExposure }) {
  if (!ad) {
    return null;
  }
  return (
    <Link
      href={adHref(ad)}
      data-ad-placement={ad.placementKey}
      aria-label={`광고: ${ad.companyName} ${ad.postTitle}`}
      className="relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-50"
    >
      {ad.bannerImageUrlPc ? (
        <img src={ad.bannerImageUrlPc} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full flex-col justify-end gap-1 p-5">
          <span className="text-xs text-gray-500">{ad.companyName}</span>
          <span className="text-base font-bold text-gray-900">{ad.postTitle}</span>
        </span>
      )}
      <AdLabel className="absolute top-2 right-2" />
    </Link>
  );
}
