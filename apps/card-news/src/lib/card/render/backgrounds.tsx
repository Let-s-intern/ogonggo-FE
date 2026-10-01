import type { CSSProperties } from 'react';
import { mix } from '../color';
import type { CardSize, CardSpec } from '../types';
import { type Palette, variantImage } from '../variants';
import type { SlideAssets } from './primitives';

/**
 * 시안마다의 배경. 썸네일·물결·워터마크·테두리 중 하나를 얹는다(탭 시안은 큰 흰 카드가 덮는다).
 * 3장(`cta`)은 글과 프로필 카드가 위부터 차 있어 썸네일을 빼거나 더 어둡게 둔다.
 */

function svgUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * 바탕색 위에 얹는 밝은 물결. 크기마다 늘려 쓴다(모양이 조금 눌려도 티가 안 난다). 글자 뒤에
 * 깔리므로 바탕과 거의 같은 밝기로 옅게 둔다 — 진하면 글자 대비가 두 겹이 돼 지저분하다.
 */
function waveSvg(color: string, size: CardSize, text: string): string {
  const light = mix(color, '#FFFFFF', text === '#FFFFFF' ? 0.1 : 0.3);
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 1080 1350" preserveAspectRatio="none">` +
      `<path fill="${light}" d="M330 0 C250 210 120 330 90 560 C50 860 260 1060 300 1350 L1080 1350 L1080 1120 C860 1090 700 960 700 760 C700 520 900 430 1080 300 L1080 0 Z"/>` +
      `<path fill="${color}" d="M1080 0 L760 0 C860 120 1000 170 1080 160 Z"/>` +
      `</svg>`,
  );
}

/** 테두리 시안의 브랜드색 테두리 두께. */
const FRAME_INSET = 30;

function fill(size: CardSize): CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: size.width,
    height: size.height,
    display: 'flex',
  };
}

/** 연한 바탕 아래쪽에 크게 흐리게 까는 렛츠커리어 심볼. */
function WatermarkMark({ size, assets }: { size: CardSize; assets: SlideAssets }) {
  return (
    <img
      src={assets.markColor}
      alt=""
      width={size.width}
      height={size.width}
      style={{ position: 'absolute', left: 260, top: Math.round(size.height * 0.3), opacity: 0.08 }}
    />
  );
}

export function Background({
  spec,
  palette,
  size,
  assets,
  cta = false,
}: {
  spec: CardSpec;
  palette: Palette;
  size: CardSize;
  assets: SlideAssets;
  cta?: boolean;
}) {
  const base = fill(size);
  const image = variantImage(spec.variant, spec.settings);

  const layers = (() => {
    switch (spec.variant) {
      case 'wave':
        return (
          <img
            src={waveSvg(palette.background, size, palette.headlineText)}
            alt=""
            width={size.width}
            height={size.height}
            style={base}
          />
        );
      case 'watermark': {
        const mark = Math.round(size.width * 1.05);
        return (
          <img
            src={assets.markColor}
            alt=""
            width={mark}
            height={mark}
            style={{
              position: 'absolute',
              left: Math.round(size.width * 0.3),
              top: Math.round(size.height - mark * 0.86),
              opacity: 0.09,
            }}
          />
        );
      }
      case 'frame':
        // 브랜드색을 깔고 그 안에 흰 카드를 얹어 테두리를 만든다.
        return (
          <div style={{ ...base, backgroundColor: spec.settings.brandColor }}>
            <div
              style={{
                position: 'absolute',
                top: FRAME_INSET,
                left: FRAME_INSET,
                width: size.width - FRAME_INSET * 2,
                height: size.height - FRAME_INSET * 2,
                display: 'flex',
                backgroundColor: palette.background,
                borderRadius: 40,
              }}
            />
          </div>
        );
      case 'panel':
        return <WatermarkMark size={size} assets={assets} />;
      case 'tab':
        // 브랜드색 바탕 그대로. 큰 흰 카드가 화면 대부분을 덮는다.
        return null;
      case 'thumb': {
        // 썸네일을 아래쪽에 깔고 위쪽은 바탕색으로 녹인다(LG생활건강 예시). 3장은 썸네일 없이.
        if (cta || !image) {
          return <WatermarkMark size={size} assets={assets} />;
        }
        const top = Math.round(size.height * 0.45);
        return (
          <div style={base}>
            <img
              src={image.dataUrl}
              alt=""
              width={size.width}
              height={size.height - top}
              style={{
                position: 'absolute',
                left: 0,
                top,
                width: size.width,
                height: size.height - top,
                objectFit: 'cover',
                opacity: image.opacity,
              }}
            />
            <div
              style={{
                ...base,
                backgroundImage: `linear-gradient(180deg, ${palette.background} 0%, ${palette.background} 45%, rgba(244,245,247,0) 60%)`,
              }}
            />
          </div>
        );
      }
      case 'thumbFade':
        // 연한 바탕에 썸네일을 흐리게(아누아 예시). 글자 뒤에 깔리므로 진하기의 1할만 쓴다.
        return image ? (
          <img
            src={image.dataUrl}
            alt=""
            width={size.width}
            height={size.height}
            style={{ ...base, objectFit: 'cover', opacity: image.opacity * 0.1 }}
          />
        ) : (
          <WatermarkMark size={size} assets={assets} />
        );
      case 'thumbDark':
        // 썸네일 위를 검정으로 덮는다(현대자동차 예시). 아래로 갈수록 진하게 — 목록이 아래에 있다.
        return (
          <div style={base}>
            {image ? (
              <img
                src={image.dataUrl}
                alt=""
                width={size.width}
                height={size.height}
                style={{ ...base, objectFit: 'cover', opacity: image.opacity }}
              />
            ) : null}
            <div
              style={{
                ...base,
                backgroundImage:
                  'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.9) 100%)',
              }}
            />
          </div>
        );
      case 'thumbCard':
        // 썸네일은 슬라이드가 카드로 띄운다. 바탕은 연한 회색.
        return null;
      case 'dark':
        // 검정 바탕 위쪽에 브랜드색이 은은하게 번지게.
        return (
          <div
            style={{
              ...base,
              backgroundImage: `linear-gradient(160deg, ${mix(spec.settings.brandColor, '#121212', 0.55)} 0%, #121212 55%)`,
            }}
          />
        );
    }
  })();

  return (
    <div style={base}>
      <div style={{ ...base, backgroundColor: palette.background }} />
      {layers}
    </div>
  );
}
