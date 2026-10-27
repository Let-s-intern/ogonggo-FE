import type { ReactElement } from 'react';
import type { Layer } from '../types';

/**
 * 자유 요소(`Layer`)를 템플릿 위에 절대 위치로 그린다. 이미지 생성기와 편집 캔버스가 같은 JSX 를
 * 그린다. `data-layer` 는 이미지 생성기가 무시하고, 편집 캔버스가 요소 상자를 찾는 데 쓴다.
 *
 * 컴포넌트나 조각(`<>`)이 아니라 요소 배열을 돌려준다 — 이미지 생성기는 조각도 상자 하나로 배치해,
 * 템플릿 다음 자리(x 1080)를 기준으로 그려 버린다.
 */
const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;

export function layerElements(layers: Layer[] | undefined): ReactElement[] {
  return (layers ?? []).map((layer) =>
    layer.kind === 'text' ? (
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
            {line || '\u00a0'}
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
        }}
      />
    ),
  );
}
