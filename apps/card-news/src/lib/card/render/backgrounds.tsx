import type { CSSProperties } from 'react';
import { mix } from '../color';
import type { CardSize, CardSpec } from '../types';
import { type Palette, variantImage } from '../variants';
import type { SlideAssets } from './primitives';

/**
 * 시안마다의 배경. 물결·워터마크·사진 중 하나를 얹는다(탭 시안은 큰 흰 카드가 덮는다). 3장(`cta`)은
 * 글자와 프로필 카드가 가운데 몰려 있어 사진을 더 흐리게 둔다.
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
      case 'photo':
        // 연한 바탕 위에 이미지를 흐리게 깐다(아누아 예시). 진하기는 설정에서 바꾸고, 글자색은
        // 그 진하기로 섞인 밝기를 보고 시안이 고른다.
        return image ? (
          <img
            src={image.dataUrl}
            alt=""
            width={size.width}
            height={size.height}
            style={{
              ...base,
              objectFit: 'cover',
              opacity: cta ? image.opacity * 0.7 : image.opacity,
            }}
          />
        ) : (
          <img
            src={waveSvg(palette.background, size, palette.headlineText)}
            alt=""
            width={size.width}
            height={size.height}
            style={base}
          />
        );
      case 'building': {
        const top = Math.round(size.height * 0.3);
        return (
          <div style={base}>
            {image ? (
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
            ) : (
              <img
                src={assets.markColor}
                alt=""
                width={size.width}
                height={size.width}
                style={{ position: 'absolute', left: 260, top, opacity: 0.08 }}
              />
            )}
            <div
              style={{
                ...base,
                // 3장은 글자와 프로필 카드가 사진 위에 오므로 사진 전체를 밝게 덮는다.
                backgroundImage: cta
                  ? 'linear-gradient(180deg, rgba(244,245,247,1) 0%, rgba(244,245,247,1) 30%, rgba(244,245,247,0.82) 50%, rgba(244,245,247,0.6) 100%)'
                  : `linear-gradient(180deg, ${palette.background} 0%, ${palette.background} 30%, rgba(244,245,247,0) 48%)`,
              }}
            />
          </div>
        );
      }
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
