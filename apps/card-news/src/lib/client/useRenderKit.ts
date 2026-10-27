'use client';

import { parse } from '@shuding/opentype.js';
import { useEffect, useState } from 'react';
import { createMeasure, type Measure } from '../card/measure';
import type { SlideAssets } from '../card/render/primitives';
import type { RenderKitManifest } from '../server/slideAssets';

/** 브라우저에서 `buildSlide()` 를 부르는 데 필요한 것. */
export interface RenderKit {
  assets: SlideAssets;
  measure: Measure;
}

let kitPromise: Promise<RenderKit> | null = null;

async function fetchKit(): Promise<RenderKit> {
  const response = await fetch('/api/render-kit');
  if (!response.ok) {
    throw new Error(`render-kit ${response.status}`);
  }
  const manifest = (await response.json()) as RenderKitManifest;
  const fonts = await Promise.all(
    manifest.weights.map(async (weight) => {
      const font = await fetch(`/api/render-kit?weight=${weight}`);
      if (!font.ok) {
        throw new Error(`render-kit font ${weight} ${font.status}`);
      }
      return { weight, data: await font.arrayBuffer() };
    }),
  );
  // 캔버스 글자를 서버 렌더와 같은 파일로 그린다. 화면 글꼴(가변 Pretendard)과 이름이 겹치지 않는다
  // — 화면은 `next/font` 가 지은 이름을 쓴다.
  await Promise.all(
    fonts.map(async ({ weight, data }) => {
      const face = new FontFace('Pretendard', data, { weight: String(weight) });
      document.fonts.add(await face.load());
    }),
  );
  return {
    assets: manifest.assets,
    measure: createMeasure(new Map(fonts.map(({ weight, data }) => [weight, parse(data)]))),
  };
}

/** 렌더 키트를 한 번 받아 둔다. 받는 동안과 실패하면 `kit` 이 없다. */
export function useRenderKit(): { kit: RenderKit | null; error: boolean } {
  const [kit, setKit] = useState<RenderKit | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    kitPromise ??= fetchKit().catch((reason: unknown) => {
      kitPromise = null;
      throw reason;
    });
    kitPromise.then(
      (loaded) => !cancelled && setKit(loaded),
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return { kit, error };
}
