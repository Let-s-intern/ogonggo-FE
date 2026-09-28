import { cn } from '@ogonggo/ui';
import { HERO_CONTENT, type HeroScreen } from '@/shared/lib/heroContent';

export interface HomeHeroProps {
  /** 어느 화면의 히어로인지. 문구와 색은 `HERO_CONTENT`가 안다. */
  screen: HeroScreen;
}

/**
 * 배지 pill의 돋보기. 목업 SVG(`docs/asset/v8 히어로/`)의 두 패스를 그대로 옮기고 `viewBox`를
 * 그 자리(12x12)에 맞췄다 — lucide 돋보기는 윤곽선이라 목업의 채운 원과 모양이 다르다.
 */
function HeroSearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="420.5 12 12 12" className="h-3 w-3" fill="currentColor">
      <path d="M425.3 12C424.027 12 422.806 12.5057 421.906 13.4059C421.006 14.3061 420.5 15.527 420.5 16.8001C420.5 18.0732 421.006 19.2941 421.906 20.1943C422.806 21.0945 424.027 21.6002 425.3 21.6002C426.573 21.6002 427.794 21.0945 428.694 20.1943C429.595 19.2941 430.1 18.0732 430.1 16.8001C430.1 15.527 429.595 14.3061 428.694 13.4059C427.794 12.5057 426.573 12 425.3 12Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M432.324 23.8239C432.212 23.9364 432.059 23.9996 431.9 23.9996C431.741 23.9996 431.589 23.9364 431.476 23.8239L429.376 21.7239C429.267 21.6107 429.206 21.4592 429.208 21.3018C429.209 21.1445 429.272 20.994 429.383 20.8828C429.495 20.7715 429.645 20.7084 429.802 20.7071C429.96 20.7057 430.111 20.7662 430.224 20.8755L432.324 22.9755C432.437 23.088 432.5 23.2406 432.5 23.3997C432.5 23.5588 432.437 23.7114 432.324 23.8239Z"
      />
    </svg>
  );
}

/**
 * 화면 최상단 히어로. 배경은 v8 목업 PNG(`public/hero/`)를 그대로 깔고, 배지와 헤드라인은
 * 목업 SVG에서 색과 크기를 읽어 텍스트로 그린다. 데이터에 의존하지 않아 서버 컴포넌트로 둔다.
 *
 * 목업에서 이 블록은 화면 끝까지 채운 띠가 아니라 좌우 40px 떨어진 박스다(1440px 기준 폭
 * 1360). 아래 콘텐츠(`max-w-6xl`)보다 넓어서 그 폭에 맞추지 않는다. 데스크톱 위아래 여백
 * 80px도 목업 PNG 높이에서 SVG 높이를 뺀 절반이다.
 *
 * 배경은 장식이라 `<img>`가 아니라 CSS 배경이다 — 대체 텍스트를 가질 이유가 없고, 문구는
 * `<h1>`이 이미 말한다.
 */
export function HomeHero({ screen }: HomeHeroProps) {
  const { badge, lines, theme } = HERO_CONTENT[screen];

  return (
    <section
      className="relative mx-10 mt-6 self-stretch overflow-hidden rounded-3xl bg-cover bg-center px-4 py-8 sm:px-6 sm:py-12 lg:py-20"
      style={{ backgroundImage: `url(${theme.backgroundImage})` }}
    >
      <div className="relative flex flex-col items-center gap-6 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium',
            theme.badgeBg,
            theme.badgeText,
          )}
        >
          <HeroSearchIcon />
          {badge}
        </span>

        <h1 className="text-2xl leading-[1.125] font-bold tracking-tight text-gray-800 sm:text-[32px] lg:text-[40px]">
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="block">
              {line.map((segment, segmentIndex) =>
                segment.accent ? (
                  <span
                    key={segmentIndex}
                    className="inline-block -skew-x-12 text-[1.2em] leading-none text-[#1BC47D]"
                  >
                    {segment.text}
                  </span>
                ) : (
                  segment.text
                ),
              )}
            </span>
          ))}
        </h1>
      </div>
    </section>
  );
}
