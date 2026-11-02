import type { ReactElement } from 'react';
import type { Layer, ShapeLayer } from '../types';

/**
 * 자유 요소(`Layer`)를 템플릿 위에 절대 위치로 그린다. 이미지 생성기와 편집 캔버스가 같은 JSX 를
 * 그린다. `data-layer` 는 이미지 생성기가 무시하고, 편집 캔버스가 요소 상자를 찾는 데 쓴다.
 *
 * 컴포넌트나 조각(`<>`)이 아니라 요소 배열을 돌려준다 — 이미지 생성기는 조각도 상자 하나로 배치해,
 * 템플릿 다음 자리(x 1080)를 기준으로 그려 버린다.
 */
const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;

/** 돌린 요소는 상자 가운데를 두고 돌린다. 돌리지 않은 요소는 스타일을 더하지 않는다(그림이 그대로). */
function rotate(layer: Layer) {
  return layer.rotation
    ? { transform: `rotate(${layer.rotation}deg)`, transformOrigin: 'center' }
    : {};
}

/** 서버 렌더와 편집 캔버스(브라우저)가 같이 부르므로 `Buffer` 대신 `btoa` 로 만든다. */
function svgUrl(svg: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(svg)) {
    binary += String.fromCharCode(byte);
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

/**
 * 도형을 그 크기의 SVG 로 그린다. 이미지 생성기와 브라우저가 원·테두리를 같은 모양으로 그리게 CSS 테두리·
 * 모서리 대신 SVG 를 쓴다. 테두리는 상자 안쪽으로 들어오게 굵기 절반만큼 들여 그린다.
 */
export function shapeSvg(layer: ShapeLayer): string {
  const { width, height } = layer;
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  if (layer.shape === 'line') {
    const rx = Math.min(layer.radius, height / 2);
    return svgUrl(
      `${open}<rect width="${width}" height="${height}" rx="${rx}" fill="${layer.fill ?? '#111111'}"/></svg>`,
    );
  }
  const stroke = layer.stroke && layer.strokeWidth > 0 ? layer.strokeWidth : 0;
  const paint = `fill="${layer.fill ?? 'none'}"${stroke ? ` stroke="${layer.stroke}" stroke-width="${stroke}"` : ''}`;
  const inner = { width: Math.max(0, width - stroke), height: Math.max(0, height - stroke) };
  const body =
    layer.shape === 'ellipse'
      ? `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${inner.width / 2}" ry="${inner.height / 2}" ${paint}/>`
      : `<rect x="${stroke / 2}" y="${stroke / 2}" width="${inner.width}" height="${inner.height}" rx="${Math.min(layer.radius, inner.width / 2, inner.height / 2)}" ${paint}/>`;
  return svgUrl(`${open}${body}</svg>`);
}

/**
 * `place` 가 `behind` 면 템플릿 뒤에 깐 요소(`behind`)만, `front` 면 나머지를 그린다. 장 바탕(`Canvas`)이
 * 배경 다음과 템플릿 다음에 한 번씩 부른다.
 */
export function layerElements(
  layers: Layer[] | undefined,
  place: 'front' | 'behind' = 'front',
): ReactElement[] {
  return (layers ?? [])
    .filter((layer) => Boolean(layer.behind) === (place === 'behind'))
    .map((layer) =>
      layer.kind === 'shape' ? (
        <img
          key={layer.id}
          data-layer={layer.id}
          src={shapeSvg(layer)}
          alt=""
          width={layer.width}
          height={layer.height}
          style={{
            position: 'absolute',
            left: layer.x,
            top: layer.y,
            opacity: layer.opacity,
            ...rotate(layer),
          }}
        />
      ) : layer.kind === 'text' ? (
        <div
          key={layer.id}
          data-layer={layer.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            left: layer.x,
            top: layer.y,
            width: layer.width,
            fontSize: layer.fontSize,
            fontWeight: layer.fontWeight,
            lineHeight: layer.lineHeight,
            color: layer.color,
            ...rotate(layer),
          }}
        >
          {/* 이미지 생성기는 한 글자 상자 안의 줄바꿈(\n)을 공백으로 그려, 줄마다 상자를 따로 둔다. 빈 줄은 줄 높이를 지키게 줄바꿈 없는 공백을 넣는다. */}
          {layer.text.split('\n').map((line, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: JUSTIFY[layer.align],
                textAlign: layer.align,
                wordBreak: 'keep-all',
              }}
            >
              {layer.background ? (
                // 채움은 줄마다 글자에 맞춘 상자다(강조 상자·칩).
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: layer.background,
                    borderRadius: layer.radius ?? 0,
                    padding: `${Math.round(layer.fontSize * 0.08)}px ${Math.round(layer.fontSize * 0.28)}px`,
                  }}
                >
                  {line || '\u00a0'}
                </div>
              ) : (
                line || '\u00a0'
              )}
            </div>
          ))}
        </div>
      ) : (
        <img
          key={layer.id}
          data-layer={layer.id}
          src={layer.src}
          alt=""
          width={layer.width}
          height={layer.height}
          style={{
            position: 'absolute',
            left: layer.x,
            top: layer.y,
            opacity: layer.opacity,
            borderRadius: layer.radius,
            objectFit: 'cover',
            ...rotate(layer),
          }}
        />
      ),
    );
}
