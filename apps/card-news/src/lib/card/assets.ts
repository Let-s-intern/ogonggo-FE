import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * 렌더에 쓰는 파일. 전부 `apps/card-news/assets/` 에 받아 두었다 — 렌더할 때마다 외부에서 받으면
 * 그쪽이 느리거나 막혔을 때 카드가 깨진다.
 *
 * - 폰트: Pretendard 1.3.9 static woff(OFL). 이미지 생성기(satori)는 woff2 를 읽지 못한다.
 * - 이모지: Noto Color Emoji v2.047 SVG(Apache-2.0). 받아 두지 않은 것은 같은 판을 jsDelivr 에서
 *   받는다.
 * - 아이콘: Tabler Icons 3.34.0 outline SVG(MIT). 뱃지의 확성기, 3장 프로필 카드와 화살표에 쓴다.
 * - 로고: 오공고·렛츠커리어 심볼(`docs/asset/v3-1/icon/`).
 */
const ASSETS_DIR = path.join(process.cwd(), 'assets');

type FontWeight = 500 | 600 | 700 | 800 | 900;

const FONT_FILES: Record<FontWeight, string> = {
  500: 'Pretendard-Medium.woff',
  600: 'Pretendard-SemiBold.woff',
  700: 'Pretendard-Bold.woff',
  800: 'Pretendard-ExtraBold.woff',
  900: 'Pretendard-Black.woff',
};

export interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: FontWeight;
  style: 'normal';
}

let fontsPromise: Promise<LoadedFont[]> | null = null;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

export function loadFonts(): Promise<LoadedFont[]> {
  fontsPromise ??= Promise.all(
    (Object.entries(FONT_FILES) as [string, string][]).map(async ([weight, file]) => ({
      name: 'Pretendard',
      data: toArrayBuffer(await readFile(path.join(ASSETS_DIR, 'fonts', file))),
      weight: Number(weight) as FontWeight,
      style: 'normal' as const,
    })),
  ).catch((error: unknown) => {
    fontsPromise = null;
    throw error;
  });
  return fontsPromise;
}

const brandCache = new Map<string, Promise<string>>();

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * 브랜드 SVG 를 data URL 로. `fill` 을 주면 한 색으로 칠한다. 렛츠커리어 심볼은 원본이 회색
 * 그라데이션이라, `gradient` 를 주면 그 두 색으로 바꿔 칠한다(예시 카드의 파랑).
 */
export function loadBrandSvg(
  name: 'ogonggo' | 'letscareer',
  paint?: { fill: string } | { gradient: [string, string] },
): Promise<string> {
  const key = `${name}:${JSON.stringify(paint ?? null)}`;
  let cached = brandCache.get(key);
  if (!cached) {
    cached = readFile(path.join(ASSETS_DIR, 'brand', `${name}.svg`), 'utf8').then((svg) => {
      if (paint && 'fill' in paint) {
        return svgDataUrl(svg.replace(/fill="(?!none)[^"]*"/g, `fill="${paint.fill}"`));
      }
      if (paint) {
        let stop = 0;
        return svgDataUrl(
          svg.replace(/stop-color="[^"]*"/g, () => `stop-color="${paint.gradient[stop++] ?? ''}"`),
        );
      }
      return svgDataUrl(svg);
    });
    brandCache.set(key, cached);
  }
  return cached;
}

export type IconName =
  | 'arrow-up'
  | 'brand-threads'
  | 'chevron-down'
  | 'dots'
  | 'menu-2'
  | 'plus'
  | 'speakerphone'
  | 'square-plus';

const iconCache = new Map<string, Promise<string>>();

/** Tabler 아이콘을 한 색·한 굵기로. 원본은 `currentColor`, 굵기 2 다. */
export function loadIcon(name: IconName, color: string, strokeWidth = 2): Promise<string> {
  const key = `${name}:${color}:${strokeWidth}`;
  let cached = iconCache.get(key);
  if (!cached) {
    cached = readFile(path.join(ASSETS_DIR, 'icons', `${name}.svg`), 'utf8').then((svg) =>
      svgDataUrl(
        svg
          .replace(/currentColor/g, color)
          .replace(/stroke-width="2"/, `stroke-width="${strokeWidth}"`),
      ),
    );
    iconCache.set(key, cached);
  }
  return cached;
}

const NOTO_CDN = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.047/svg';
const emojiCache = new Map<string, Promise<string | undefined>>();

/** 이모지 파일 이름(코드포인트를 `-` 로 이은 것). 변형 선택자(FE0F)는 뺀다 — Noto 이름 규칙이다. */
function emojiCode(segment: string): string {
  return [...segment]
    .map((char) => (char.codePointAt(0) ?? 0).toString(16))
    .filter((point) => point !== 'fe0f')
    .join('-');
}

export function loadEmoji(segment: string): Promise<string | undefined> {
  const code = emojiCode(segment);
  let cached = emojiCache.get(code);
  if (!cached) {
    cached = readFile(path.join(ASSETS_DIR, 'emoji', `${code}.svg`))
      .catch(async () => {
        const response = await fetch(`${NOTO_CDN}/emoji_u${code.replace(/-/g, '_')}.svg`, {
          cache: 'force-cache',
        });
        if (!response.ok) {
          throw new Error(`emoji ${code} ${response.status}`);
        }
        return Buffer.from(await response.arrayBuffer());
      })
      .then((svg) => `data:image/svg+xml;base64,${svg.toString('base64')}`)
      .catch(() => undefined);
    emojiCache.set(code, cached);
  }
  return cached;
}
