import { Badge, Button } from '@ogonggo/ui';

/**
 * 랜딩 맨 위. 파랑 면(blue-600) 한 줄 높이에 제목과 한 줄 소개를 왼쪽에, 산업 목록으로 내려가는 버튼을 오른쪽에 둔다.
 * 가격을 읽었으면 버튼 위에 `산업별 한 편 990원` 한 줄을 둔다. 표지 같은 그림은 두지 않는다 — 판매 상세가 이미 보여 주는 것이라 랜딩은 입구 역할만 한다.
 *
 * 디자인 스케일의 가장 큰 글자(`text-7xl`, 36px)가 상한이라 제목을 더 키우지 않았다. 흰 글자 대비는 blue-600 이상에서
 * 4.5:1 을 넘기므로 파랑 면은 blue-600 보다 옅게 가지 않는다.
 */
export function ReportLandingHero({
  issueLabel,
  price,
}: {
  issueLabel: string;
  /** 다섯 상품의 공통 결제 금액(`990원`, `무료`). 모르면 `null` 이고 가격 줄을 뺀다. */
  price: string | null;
}) {
  return (
    <section className="bg-blue-600 text-white">
      <div className="mx-auto grid w-full max-w-page-padded gap-6 px-5 py-8 md:py-6 lg:grid-cols-12 lg:items-end lg:gap-12">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="main" className="gap-1 bg-white text-blue-600">
              <span aria-hidden="true" className="icon-[lucide--calendar-check] h-4 w-4" />
              매주 월요일 발행
            </Badge>
            <span className="text-sm font-medium text-white">{issueLabel}</span>
          </div>
          <h1 className="mt-4 text-5xl font-bold break-keep md:text-7xl">
            이번 주 산업 트렌드를 채용공고와 함께 읽어요
          </h1>
          <p className="mt-4 text-base break-keep text-white md:text-lg">
            뉴스 4꼭지, 공고 속 직무, 혼자 해볼 준비 3가지를 산업별 한 편에 담았어요.
          </p>
        </div>
        <div className="lg:col-span-4 lg:border-l lg:border-blue-400 lg:pl-8">
          {price ? (
            <p className="mb-3 text-base text-white">
              산업별 한 편 <span className="text-3xl font-bold">{price}</span>
            </p>
          ) : null}
          <Button
            asChild
            className="border-transparent bg-white px-5 text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <a href="#industries">
              산업별 리포트 보기
              <span aria-hidden="true" className="ml-1.5 icon-[lucide--arrow-down] h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
