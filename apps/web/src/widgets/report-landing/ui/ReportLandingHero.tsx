import { Badge, cn } from '@ogonggo/ui';

/**
 * 부채꼴 다섯 장의 자리별 모양. 가운데가 맨 위에 오고 바깥으로 갈수록 낮고 더 기운다(`rotate-3` 이하). 클래스를 조립하지
 * 않고 통째로 적는다(Tailwind 가 소스의 글자를 스캔한다). 다섯 장이 안 되면 앞에서부터 쓴다.
 */
const FAN_SLOTS = [
  '-rotate-3 translate-y-3 z-0',
  '-rotate-2 translate-y-1 z-10',
  'rotate-0 z-20',
  'rotate-2 translate-y-1 z-10',
  'rotate-3 translate-y-3 z-0',
] as const;

/**
 * 랜딩 맨 위. 다른 화면의 히어로(`widgets/home-hero/ui/HomeHero.tsx`)와 같은 상자다 — 좌우 20px/40px 떨어진
 * `rounded-3xl` 박스에 같은 옅은 파랑 배경 이미지(`/hero/jobs.png`)를 깔고, 배지는 알약(`bg-blue-100 text-blue-500`),
 * 제목은 `font-bold tracking-tight text-gray-800` 이다. 다른 화면이 가운데 정렬이고 이 화면만 오른쪽에 그림이 있어
 * 왼쪽 정렬이다. 제목은 시스템 최대 글자(`text-7xl`)다.
 *
 * 오른쪽 그림은 렛츠커리어에서 읽은 실제 썸네일(4:3)을 겹쳐 펼친 것이다. 장식이라 `alt=""` 와 `aria-hidden` 이고 링크가
 * 아니다 — 누르는 곳은 아래 목록 카드다. 데스크톱(lg)에서만 보이고, 한 장도 읽지 못했으면 자리를 비워 글만 남는다.
 * 움직임은 `motion-safe` 의 `transition-transform` 뿐이다.
 */
export function ReportLandingHero({
  issueLabel,
  price,
  thumbnails,
}: {
  issueLabel: string;
  /** 다섯 상품의 공통 결제 금액(`990원`, `무료`). 모르면 `null` 이고 가격 칩을 뺀다. */
  price: string | null;
  /** 산업 순서대로 읽은 썸네일 주소. 못 읽은 건은 빠진다. */
  thumbnails: readonly string[];
}) {
  const fan = thumbnails.slice(0, FAN_SLOTS.length);
  return (
    <section
      className="relative mx-5 mt-4 overflow-hidden rounded-3xl bg-cover bg-center px-4 py-8 sm:px-6 md:mx-10 md:mt-6 lg:py-10"
      style={{ backgroundImage: 'url(/hero/jobs.png)' }}
    >
      <div className="relative mx-auto grid w-full max-w-page items-center gap-8 lg:grid-cols-12">
        <div className={cn('lg:col-span-12', fan.length > 0 && 'lg:col-span-6')}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 text-sm font-medium text-blue-500">
              <span aria-hidden="true" className="icon-[lucide--calendar-check] h-4 w-4" />
              매주 월요일 발행
            </span>
            <span className="text-sm font-medium text-gray-600">{issueLabel}</span>
          </div>
          <h1 className="mt-5 text-5xl font-bold tracking-tight break-keep text-balance text-gray-800 md:text-7xl">
            이번 주 산업 트렌드를 채용공고와 함께 읽어요
          </h1>
          <p className="mt-4 text-base break-keep text-gray-600 md:text-lg">
            뉴스 4꼭지, 공고 속 직무, 혼자 해볼 준비 3가지를 산업별 한 편에 담았어요.
          </p>
          {price ? (
            <Badge tone="main" className="mt-6 rounded-full px-3 py-2 text-sm font-medium">
              산업별 한 편&nbsp;<span className="font-bold">{price}</span>
            </Badge>
          ) : null}
        </div>

        {fan.length > 0 ? (
          <div
            aria-hidden="true"
            className="hidden justify-center -space-x-7 lg:col-span-6 lg:flex lg:justify-end"
          >
            {fan.map((src, index) => (
              <div
                key={src}
                className={cn(
                  'relative w-32 shrink-0 overflow-hidden rounded-lg bg-white shadow-lg ring-2 ring-white',
                  'motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-2 hover:z-30',
                  FAN_SLOTS[index],
                )}
              >
                <img
                  src={src}
                  alt=""
                  width={573}
                  height={430}
                  className="block aspect-4/3 w-full object-contain"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
