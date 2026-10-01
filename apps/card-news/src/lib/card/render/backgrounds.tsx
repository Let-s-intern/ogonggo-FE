import type { CSSProperties } from 'react';
import { mix } from '../color';
import type { CardSize, CardSpec } from '../types';
import type { Palette } from '../variants';
import type { SlideAssets } from './primitives';

/**
 * 시안마다의 배경. 물결·워터마크·테두리 중 하나를 얹는다(탭 시안은 큰 흰 카드가 덮는다).
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
        return (
          <img
            src={assets.markColor}
            alt=""
            width={size.width}
            height={size.width}
            style={{
              position: 'absolute',
              left: 260,
              top: Math.round(size.height * 0.3),
              opacity: 0.08,
            }}
          />
        );
      case 'tab':
        // 브랜드색 바탕 그대로. 큰 흰 카드가 화면 대부분을 덮는다.
        return null;
    }
  })();

  return (
    <div style={base}>
      <div style={{ ...base, backgroundColor: palette.background }} />
      {layers}
    </div>
  );
}
