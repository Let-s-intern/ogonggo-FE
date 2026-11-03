import Link from 'next/link';
import type { AdExposure } from '@/entities/advertisement/model/types';
import { adHref } from '@/entities/advertisement/model/types';
import { AdLabel } from '@/entities/advertisement/ui/AdLabel';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';

/**
 * 공고 달력 위의 주목 공고 스트립(`calendar_top`, A6 달력 하이라이트와 합친 구좌, 월 4슬롯). 로고·회사명·공고명 칩을
 * 한 줄로 놓고 MO 는 가로로 넘긴다. 광고가 없으면 그리지 않는다.
 */
export function CalendarAdStrip({ ads }: { ads: AdExposure[] }) {
  if (ads.length === 0) {
    return null;
  }
  return (
    <section data-ad-placement="CALENDAR_TOP" className="mb-6 flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
        주목 공고 <AdLabel />
      </h2>
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-4 md:px-0">
        {ads.map((ad) => (
          <li key={ad.itemId} className="w-60 shrink-0 md:w-auto">
            <Link
              href={adHref(ad)}
              className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3 hover:bg-blue-50"
            >
              <CompanyLogo
                companyName={ad.companyName}
                logoUrl={ad.companyLogoUrl}
                className="h-9 w-9 shrink-0 rounded-lg"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs text-gray-500">{ad.companyName}</span>
                <span className="truncate text-sm font-semibold text-gray-900">{ad.postTitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
