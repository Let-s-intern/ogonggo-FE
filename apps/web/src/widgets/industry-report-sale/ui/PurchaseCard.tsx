import { Badge, Card } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import type { IndustryReport } from '@/shared/config/industryReports';
import { saleInfoRows } from '../model/saleInfo';
import { PriceLine } from './PriceLine';
import { PurchaseButton } from './PurchaseButton';
import { ReportLinks } from './ReportLinks';
import { SaleInfoList } from './SaleInfoList';

/** 렛츠커리어 썸네일의 원본 크기(2026-11-26 실측 573x430, 4:3). 카드 안쪽 폭이 이보다 커지지 않게 폭을 정한다. */
const THUMBNAIL_WIDTH = 573;
const THUMBNAIL_HEIGHT = 430;

export interface PurchaseCardProps {
  report: IndustryReport;
  guidebook: LetsCareerGuidebook;
  returnUrl: string;
}

/**
 * 구매 카드. 위에서 아래로 썸네일, 산업, 제목, 가격, 정보 줄, 구매 버튼, 결제 안내, 이동 링크다.
 *
 * 썸네일이 573px 짜리라 카드 안에서만 보인다. 본문 폭으로 늘리면 1.4배(레티나는 3배)로 커져 깨져 보인다.
 * 데스크톱 카드는 폭이 340px 안팎이라 안쪽 306px 로 1배보다 작게 줄어든다. 좁은 화면에서 카드가 넓어져도
 * 썸네일은 `max-w-md`(448px)에서 멈추고, `md` 이상 `lg` 미만에서는 카드를 두 칸으로 나눠 썸네일을 왼쪽에 둔다.
 */
export function PurchaseCard({ report, guidebook, returnUrl }: PurchaseCardProps) {
  const thumbnail = guidebook.thumbnail ?? guidebook.desktopThumbnail;

  return (
    <Card className="flex flex-col gap-5 p-5 md:max-lg:grid md:max-lg:grid-cols-2 md:max-lg:gap-x-6">
      {thumbnail ? (
        <div className="mx-auto w-full max-w-md md:max-lg:row-span-2 md:max-lg:mx-0 md:max-lg:max-w-none">
          <img
            src={thumbnail}
            alt={guidebook.title}
            width={THUMBNAIL_WIDTH}
            height={THUMBNAIL_HEIGHT}
            decoding="async"
            className="block aspect-4/3 w-full rounded-md bg-gray-100 object-contain"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-start gap-2">
          <Badge tone="main">{report.label}</Badge>
          <h1 className="text-xl font-bold break-keep text-balance text-gray-900">{guidebook.title}</h1>
        </div>
        {guidebook.priceInfo ? <PriceLine price={guidebook.priceInfo} /> : null}
        <SaleInfoList rows={saleInfoRows(guidebook)} />
        <div className="flex flex-col gap-2">
          <PurchaseButton guidebookId={report.guidebookId} returnUrl={returnUrl} />
          <p className="text-center text-xs text-gray-500">
            결제는 렛츠커리어 결제창에서 진행돼요
          </p>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-4 md:max-lg:col-span-2">
        <ReportLinks currentSlug={report.slug} />
      </div>
    </Card>
  );
}
