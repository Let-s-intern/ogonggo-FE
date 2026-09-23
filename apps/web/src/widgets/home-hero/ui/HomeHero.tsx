import { cn } from '@ogonggo/ui';
import { HERO_CONTENT, type HeroScreen } from '@/shared/lib/heroContent';
import { SearchIcon } from '@/shared/ui/icons';

export interface HomeHeroProps {
  /** 어느 화면의 히어로인지. 문구와 색은 `HERO_CONTENT`가 안다. */
  screen: HeroScreen;
}

/**
 * 화면 최상단 히어로 — v3에서 배경·배지 pill·헤드라인이 합성 PNG 한 장이 됐던 것을
 * (`docs/asset/v3 변경사항/hero/`) 벡터 소스가 없어 CSS로 다시 짰다. 데이터에 의존하지 않아
 * 서버 컴포넌트로 둔다.
 *
 * 목업에서 이 블록은 화면 끝까지 채운 띠가 아니라 좌우 40px 떨어진 박스다(실측 1440px 기준
 * 42~1400). 아래 콘텐츠(`max-w-6xl`)보다 넓어서 그 폭에 맞추지 않는다.
 *
 * 배경의 흐릿한 원형 블롭 세 개는 재현하지만, PNG 하단에 아주 옅게 깔려 있던 마스코트 실루엣은
 * 옮기지 않았다 — 벡터 소스 없이 정확히 그릴 수 없다(`shared/lib/heroContent.ts`).
 *
 * 문구가 화면에도, `<h1>`에도 있다. PNG였을 때는 문구가 이미지 안에만 있어 `sr-only` `<h1>`이
 * 따로 필요했지만, 지금은 헤드라인 자체가 텍스트라 그 `<h1>`이 화면에 보이는 헤드라인을 감싼다.
 */
export function HomeHero({ screen }: HomeHeroProps) {
  const { badge, lines, theme } = HERO_CONTENT[screen];

  return (
    <section
      className={cn(
        'relative mx-10 mt-6 self-stretch overflow-hidden rounded-3xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14',
        theme.background,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute top-1/2 left-[18%] h-56 w-56 -translate-y-1/2 rounded-full opacity-60 blur-3xl',
            theme.blob,
          )}
        />
        <div
          className={cn(
            'absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl',
            theme.blob,
          )}
        />
        <div
          className={cn(
            'absolute top-1/2 right-[18%] h-56 w-56 -translate-y-1/2 rounded-full opacity-60 blur-3xl',
            theme.blob,
          )}
        />
      </div>

      <div className="relative flex flex-col items-center gap-4 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium',
            theme.badgeBg,
            theme.badgeText,
          )}
        >
          <SearchIcon className="h-4 w-4" />
          {badge}
        </span>

        <h1 className="text-2xl font-bold text-gray-900 sm:text-4xl lg:text-6xl">
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="block">
              {line.map((segment, segmentIndex) =>
                segment.accent ? (
                  <span key={segmentIndex} className="text-success">
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
