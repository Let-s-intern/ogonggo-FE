import { Badge, Card } from '@ogonggo/ui';
import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import type { IndustryReport } from '@/shared/config/industryReports';
import { StickyApplyBar } from '@/shared/ui/StickyApplyBar';
import { priceView } from '../lib/price';
import { saleInfoRows } from '../model/saleInfo';
import { PriceLine } from './PriceLine';
import { PurchaseButton } from './PurchaseButton';
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
 * 구매 카드. 위에서 아래로 썸네일, 산업·가격, 제목, 산업 소개 줄, 구성·열람·대상, 구매 버튼이다. 소개 줄과 정보 줄의 글은
 * 마케팅팀 상세 이미지에 적힌 말이다(`report.tagline`, `saleInfoRows`). 구매 뒤 안내가 버튼 아래에 붙어도 화면 안에 들도록
 * 구매에 필요한 것만 담는다(이동 링크는 `ReportLinks` 로 카드 밖).
 *
 * 썸네일 그림 안에 제목이 들어 있어 `alt` 는 비운다. 제목은 바로 아래 `h1` 이 한 번만 읽힌다.
 *
 * 썸네일이 573px 짜리라 카드 안에서만 보인다. 본문 폭으로 늘리면 1.4배(레티나는 3배)로 커져 깨져 보인다.
 * 데스크톱 카드는 폭이 340px 안팎이라 안쪽 306px 로 1배보다 작게 줄어든다. 좁은 화면에서 카드가 넓어져도
 * 썸네일은 `max-w-md`(448px)에서 멈추고, `md` 이상 `lg` 미만에서는 카드를 두 칸으로 나눠 썸네일을 왼쪽에 둔다.
 */
export function PurchaseCard({ report, guidebook, returnUrl }: PurchaseCardProps) {
  const thumbnail = guidebook.thumbnail ?? guidebook.desktopThumbnail;
  const infoRows = saleInfoRows(guidebook);

  return (
    <Card className="flex flex-col gap-3 p-4 md:max-lg:grid md:max-lg:grid-cols-2 md:max-lg:items-start md:max-lg:gap-x-6">
      {thumbnail ? (
        <div className="mx-auto w-full max-w-md md:max-lg:mx-0 md:max-lg:max-w-none">
          <img
            src={thumbnail}
            alt=""
            width={THUMBNAIL_WIDTH}
            height={THUMBNAIL_HEIGHT}
            decoding="async"
            className="block aspect-4/3 w-full rounded-md bg-gray-100 object-contain"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Badge tone="main">{report.label}</Badge>
          {guidebook.priceInfo ? <PriceLine price={guidebook.priceInfo} /> : null}
        </div>
        <h1 className="text-xl font-bold break-keep text-balance text-gray-900">
          {guidebook.title}
        </h1>
        <p className="text-sm break-keep text-gray-600">{report.tagline}</p>
        <SaleInfoList rows={infoRows} />
        <div>
          {/* 모바일(`md` 미만)에서는 화면 아래에 떠서 스크롤해도 누를 수 있고, 그 위 줄에 가격을 보인다.
              `md` 이상에서는 카드 안 제자리로 돌아온다(공고·부트캠프 상세와 같은 부품). */}
          <StickyApplyBar
            summary={
              guidebook.priceInfo ? (
                <span className="font-semibold text-gray-900">
                  {priceView(guidebook.priceInfo).final}
                </span>
              ) : undefined
            }
          >
            <PurchaseButton guidebookId={report.guidebookId} returnUrl={returnUrl} />
          </StickyApplyBar>
        </div>
      </div>
    </Card>
  );
}
