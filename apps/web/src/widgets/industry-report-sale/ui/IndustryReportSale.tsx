import type { LetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import type { IndustryReport } from '@/shared/config/industryReports';
import { cn } from '@ogonggo/ui';
import { extractDescriptionImages } from '../lib/descriptionImages';
import { PurchaseCard } from './PurchaseCard';
import { ReportLinks } from './ReportLinks';

export interface IndustryReportSaleProps {
  report: IndustryReport;
  /** 렛츠커리어에서 읽은 상품. 읽지 못했으면 `null` 이고, 이때는 산업 이름과 안내 한 줄만 보인다. */
  guidebook: LetsCareerGuidebook | null;
  /** 이 상품의 오공고 판매 상세 절대 주소. 구매 창에 넘긴다. */
  returnUrl: string;
}

/**
 * 산업 트렌드 리포트 판매 상세 본문. 데스크톱은 왼쪽에 상세 이미지, 오른쪽에 구매 카드가 고정되어 따라온다
 * (공고·부트캠프 상세와 같은 `739fr / 323fr` 두 칸). 좁은 화면은 구매 카드 아래에 상세 이미지가 이어진다.
 *
 * 썸네일은 카드 안에만 있다. 573px 원본이라 본문 폭으로 늘려 두면 흐려 보인다(`PurchaseCard`). 본문은 1074px
 * 상세 이미지로 채운다. 이동 링크(`ReportLinks`)는 카드 밖 본문 위에 둔다 — 따라오는 카드가 길어지면 아래가 잘린다.
 *
 * 값을 읽지 못한 칸(썸네일, 가격, 상세 이미지)은 그 칸만 숨긴다. 상품 전체를 읽지 못하면 구매 버튼도
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
  const hasImages = images.length > 0;

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6',
        hasImages && 'lg:grid-cols-[minmax(0,739fr)_minmax(0,323fr)] lg:gap-15',
      )}
    >
      <aside
        className={cn(
          'min-w-0',
          hasImages
            ? 'lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start'
            : 'lg:mx-auto lg:w-full lg:max-w-sm',
        )}
      >
        <PurchaseCard report={report} guidebook={guidebook} returnUrl={returnUrl} />
      </aside>
      <div
        className={cn('flex min-w-0 flex-col gap-4', hasImages && 'lg:col-start-1 lg:row-start-1')}
      >
        <ReportLinks currentSlug={report.slug} />
        {hasImages ? (
          <section aria-label="상세 소개">
            {images.map((image, index) => (
              <img
                key={`${index}-${image.src}`}
                src={image.src}
                alt={image.alt}
                // 긴 세로 이미지(약 2MB)라 첫 장만 바로 받고 나머지는 내려올 때 받는다.
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="block h-auto w-full"
              />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
