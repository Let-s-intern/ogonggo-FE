import type { ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import { HERO_CONTENT, type HeroScreen } from '@/shared/lib/heroContent';

export interface HomeHeroProps {
  /** 어느 화면의 히어로인지. 문구와 색은 `HERO_CONTENT`가 안다. */
  screen: HeroScreen;
  /**
   * 헤드라인 아래, 박스 안쪽에 그릴 내용. 홈이 인기 공고를 여기에 넣는다. 없으면(`null` 포함) 지금과
   * 같은 마크업·간격이고, 있을 때만 안쪽 여백과 헤드라인 아래 간격이 시안대로 바뀐다.
   */
  children?: ReactNode;
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
 * 1360). 아래 콘텐츠(`max-w-page-padded`)보다 넓어서 그 폭에 맞추지 않는다. 모바일은 좌우 16px 이고
 * (`docs/asset/v9 mobile/`), 배경은 `bg-cover` 라 비율을 지킨 채 좌우가 잘린다. 데스크톱 위아래 여백
 * 80px도 목업 PNG 높이에서 SVG 높이를 뺀 절반이다.
 *
 * 배경은 장식이라 `<img>`가 아니라 CSS 배경이다 — 대체 텍스트를 가질 이유가 없고, 문구는
 * `<h1>`이 이미 말한다.
 *
 * `children` 이 있으면 헤드라인 아래에 같이 그린다(`docs/asset/v12 채용공고 상세/목록.webp`, `모바일 목록.webp`
 * 의 인기 공고). 시안에서 잰 값은 이렇다 — PC 는 위아래 안쪽 여백 약 64px, 헤드라인과 내용 사이 약
 * 104px 이고, 모바일은 위아래 약 24~28px, 헤드라인과 내용 사이 약 32px 이다. 박스 아래에서 다음 구역까지는
 * 약 40~46px 이라 페이지의 `py-10` 이 이미 맞아 여기서 더하지 않는다.
 */
export function HomeHero({ screen, children }: HomeHeroProps) {
  const { badge, lines, theme } = HERO_CONTENT[screen];
  const hasChildren = Boolean(children);

  return (
    <section
      className={cn(
        'relative mx-5 mt-4 self-stretch overflow-hidden rounded-3xl bg-cover bg-center px-4 py-8 sm:px-6 sm:py-12 md:mx-10 md:mt-6 lg:py-20',
        // 모바일 가로 넘김 목록(`PopularJobsTabs`)이 `-mx-4` 로 박스 가장자리까지 번지려면 md 미만의
        // 가로 안쪽 여백이 16px 이어야 한다. 그래서 `sm:px-6` 을 md 로 미룬다.
        hasChildren && 'py-6 sm:px-4 sm:py-10 md:px-6 lg:py-16',
      )}
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

        <h1 className="text-[22px] leading-[1.6] font-bold tracking-tight text-gray-800 sm:text-[32px] md:leading-[1.125] lg:text-[40px]">
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="block">
              {line.map((segment, segmentIndex) =>
                segment.accent ? (
                  <span
                    key={segmentIndex}
                    className={cn(
                      'inline-block text-[1.2em] leading-none text-[#1BC47D]',
                      segment.tilted && 'mx-[0.1em] -translate-y-[0.15em] rotate-[10deg]',
                    )}
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

      {hasChildren ? (
        // 폭은 아래 콘텐츠 열(`max-w-page-padded` 에서 좌우 `px-5` 를 뺀 1180px)과 맞춘다. 자식이 아무것도 그리지
        // 않으면(`empty:hidden`) 간격도 같이 사라져 박스가 헤드라인만 남은 모양이 된다.
        <div className="mx-auto mt-8 w-full max-w-page empty:hidden md:mt-16 lg:mt-26">
          {children}
        </div>
      ) : null}
    </section>
  );
}
