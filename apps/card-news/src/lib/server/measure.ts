import { parse } from '@shuding/opentype.js';
import { loadFonts } from '../card/assets';
import { createMeasure, type Measure } from '../card/measure';

let measurePromise: Promise<Measure> | null = null;

/** `assets/fonts` 의 Pretendard 로 측정 함수를 만든다. 한 번 만들어 계속 쓴다. */
export function loadMeasure(): Promise<Measure> {
  measurePromise ??= loadFonts()
    .then((fonts) =>
      createMeasure(new Map(fonts.map((font) => [font.weight, parse(font.data)] as const))),
    )
    .catch((error: unknown) => {
      measurePromise = null;
      throw error;
    });
  return measurePromise;
}
