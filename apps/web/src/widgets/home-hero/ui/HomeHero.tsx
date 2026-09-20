import Image from 'next/image';
import { HERO_IMAGES, type HeroScreen } from '@/shared/lib/heroImages';

export interface HomeHeroProps {
  /** 어느 화면의 히어로인지. 이미지 경로와 크기는 `HERO_IMAGES`가 안다. */
  screen: HeroScreen;
  /**
   * 이미지 안에 그려져 있는 헤드라인. 화면에는 보이지 않고 `<h1>`으로만 남는다.
   * 줄바꿈은 이미지가 하고 있어서 한 줄로 받는다.
   */
  headline: string;
}

/**
 * 화면 최상단 히어로 — v3에서 배경·배지 pill·헤드라인이 전부 한 장의 이미지가 됐다
 * (`docs/asset/v3 변경사항/hero/`). 데이터에 의존하지 않아 서버 컴포넌트로 둔다.
 *
 * 목업에서 이 블록은 화면 끝까지 채운 띠가 아니라 좌우 40px 떨어진 박스다(실측 1440px 기준
 * 42~1400). 아래 콘텐츠(`max-w-6xl`)보다 넓어서 그 폭에 맞추지 않는다. 둥근 모서리는 이미지가
 * 투명으로 들고 있다.
 *
 * `next/image`를 쓴다. `Thumbnail`·`LogoLoader`가 피한 이유(등록해야 하는 외부 호스트, 로딩
 * 표시의 왕복 지연)가 여기에는 없고, 1.2~1.5MB짜리 PNG를 그대로 내보내지 않는 쪽이 낫다.
 * 첫 화면에 보이므로 `priority`다.
 *
 * 문구가 이미지 안에 있어 그대로 두면 화면 낭독기와 검색 엔진에 아무것도 남지 않는다. 그래서
 * `<h1>`을 `sr-only`로 남기고 이미지는 `alt=""`다 — 양쪽에 문구를 넣으면 같은 말이 두 번
 * 읽힌다.
 */
export function HomeHero({ screen, headline }: HomeHeroProps) {
  const { src, width, height } = HERO_IMAGES[screen];

  return (
    <section className="mx-10 mt-6 self-stretch">
      <h1 className="sr-only">{headline}</h1>
      <Image src={src} alt="" width={width} height={height} priority className="h-auto w-full" />
    </section>
  );
}
