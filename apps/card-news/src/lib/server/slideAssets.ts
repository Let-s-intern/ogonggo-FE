import { loadBrandSvg, loadIcon } from '../card/assets';
import type { SlideAssets } from '../card/render/primitives';

const INK = '#111111';
const WHITE = '#FFFFFF';

/** 렛츠커리어 심볼을 밝은 바탕에 놓을 때의 파랑 그라데이션(원본은 회색이다). */
const MARK_GRADIENT: [string, string] = ['#7C8CFF', '#3D5AFE'];

/** 렌더 키트 목록(`/api/render-kit`). 편집 캔버스가 이걸 받고, 굵기마다 폰트 파일을 따로 받는다. */
export interface RenderKitManifest {
  assets: SlideAssets;
  weights: number[];
}

/** 장을 그리는 데 쓰는 그림. 렌더 라우트와 편집 캔버스용 렌더 키트(`/api/render-kit`)가 같이 쓴다. */
export async function loadAssets(): Promise<SlideAssets> {
  const [
    markColor,
    markWhite,
    ogonggoLogo,
    ogonggoWhite,
    speakerLight,
    speakerDark,
    arrowDark,
    arrowLight,
    chevronDown,
    threads,
    squarePlus,
    menu,
    plusWhite,
    dotsWhite,
  ] = await Promise.all([
    loadBrandSvg('letscareer', { gradient: MARK_GRADIENT }),
    loadBrandSvg('letscareer', { fill: WHITE }),
    loadBrandSvg('ogonggo'),
    loadBrandSvg('ogonggo', { fill: WHITE }),
    loadIcon('speakerphone', WHITE, 2),
    loadIcon('speakerphone', INK, 2),
    loadIcon('arrow-up', INK, 1.5),
    loadIcon('arrow-up', WHITE, 1.5),
    loadIcon('chevron-down', INK, 2.5),
    loadIcon('brand-threads', INK, 1.8),
    loadIcon('square-plus', INK, 1.8),
    loadIcon('menu-2', INK, 1.8),
    loadIcon('plus', WHITE, 3),
    loadIcon('dots', WHITE, 3),
  ]);
  return {
    markColor,
    markWhite,
    ogonggoLogo,
    ogonggoWhite,
    speakerLight,
    speakerDark,
    arrowDark,
    arrowLight,
    chevronDown,
    threads,
    squarePlus,
    menu,
    plusWhite,
    dotsWhite,
  };
}
