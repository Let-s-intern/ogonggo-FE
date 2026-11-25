import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import type { IndustryReport } from '@/shared/config/industryReports';
import { extractDescriptionImages } from '../lib/descriptionImages';
import { PriceLine } from './PriceLine';
import { PurchaseButton } from './PurchaseButton';

export interface IndustryReportSaleProps {
  report: IndustryReport;
  /** 렛츠커리어에서 읽은 상품. 읽지 못했으면 `null` 이고, 이때는 산업 이름과 안내 한 줄만 보인다. */
  guidebook: LetsCareerGuidebook | null;
  /** 이 상품의 오공고 판매 상세 절대 주소. 구매 창에 넘긴다. */
  returnUrl: string;
}

/**
 * 산업 트렌드 리포트 판매 상세 본문. 데스크톱은 왼쪽에 썸네일과 상세 이미지, 오른쪽에 제목·소개·가격·구매 버튼이
 * 고정되어 따라온다. 모바일은 썸네일, 구매 칸, 상세 이미지 순으로 쌓인다.
 *
 * 값을 읽지 못한 칸(썸네일, 소개, 가격, 상세 이미지)은 그 칸만 숨긴다. 상품 전체를 읽지 못하면 구매 버튼도
 * 두지 않는다 — 값을 모르는 상품을 결제 창으로 보내지 않는다.
 */
export function IndustryReportSale({ report, guidebook, returnUrl }: IndustryReportSaleProps) {
  if (!guidebook) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-gray-950">{report.label} 산업 트렌드 리포트</h1>
        <p className="text-sm text-gray-500">
          상품 정보를 불러오지 못했어요. 잠시 후 다시 열어 주세요.
        </p>
      </div>
    );
  }

  const images = extractDescriptionImages(guidebook.description);
  const thumbnail = guidebook.thumbnail ?? guidebook.desktopThumbnail;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-12">
      {thumbnail ? (
        <picture className="block overflow-hidden rounded-xl bg-gray-100 lg:col-start-1 lg:row-start-1">
          {guidebook.desktopThumbnail ? (
            <source media="(min-width: 768px)" srcSet={guidebook.desktopThumbnail} />
          ) : null}
          <img src={thumbnail} alt={guidebook.title} className="block h-auto w-full" />
        </picture>
      ) : null}
      <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <p className="text-sm font-semibold text-blue-500">{report.label}</p>
        <h1 className="mt-1 text-2xl font-bold break-keep text-gray-950">{guidebook.title}</h1>
        {guidebook.recommendedFor ? (
          <p className="mt-3 text-sm break-keep text-gray-600">{guidebook.recommendedFor}</p>
        ) : null}
        {guidebook.priceInfo ? (
          <div className="mt-6">
            <PriceLine price={guidebook.priceInfo} />
          </div>
        ) : null}
        <div className="mt-4">
          <PurchaseButton guidebookId={report.guidebookId} returnUrl={returnUrl} />
        </div>
      </aside>
      {images.length > 0 ? (
        <section aria-label="상세 소개" className="lg:col-start-1 lg:row-start-2">
          {images.map((image, index) => (
            <img
              key={`${index}-${image.src}`}
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="block h-auto w-full"
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
