import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * 렌더에 쓰는 파일. 전부 `apps/card-news/assets/` 에 받아 두었다 — 렌더할 때마다 외부에서 받으면
 * 그쪽이 느리거나 막혔을 때 카드가 깨진다.
 *
 * - 폰트: Pretendard 1.3.9 static woff(OFL). 이미지 생성기(satori)는 woff2 를 읽지 못한다.
 * - 이모지: Twemoji 15.1.0 SVG(CC-BY 4.0). 받아 두지 않은 것은 같은 판을 jsDelivr 에서 받는다.
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

/** 브랜드 SVG 를 data URL 로. `fill` 을 바꿔 한 색으로 칠할 수 있다. */
export function loadBrandSvg(name: 'ogonggo' | 'letscareer', fill?: string): Promise<string> {
  const key = `${name}:${fill ?? ''}`;
  let cached = brandCache.get(key);
  if (!cached) {
    cached = readFile(path.join(ASSETS_DIR, 'brand', `${name}.svg`), 'utf8').then((svg) => {
      const painted = fill ? svg.replace(/fill="(?!none)[^"]*"/g, `fill="${fill}"`) : svg;
      return `data:image/svg+xml;base64,${Buffer.from(painted).toString('base64')}`;
    });
    brandCache.set(key, cached);
  }
  return cached;
}

const TWEMOJI_CDN = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg';
const emojiCache = new Map<string, Promise<string | undefined>>();

/** Twemoji 파일 이름. 변형 선택자(FE0F)는 ZWJ 조합이 아닐 때 뺀다 — Twemoji 이름 규칙이다. */
function emojiCode(segment: string): string {
  const points = [...segment].map((char) => (char.codePointAt(0) ?? 0).toString(16));
  const joined = points.includes('200d') ? points : points.filter((point) => point !== 'fe0f');
  return joined.join('-');
}

export function loadEmoji(segment: string): Promise<string | undefined> {
  const code = emojiCode(segment);
  let cached = emojiCache.get(code);
  if (!cached) {
    cached = readFile(path.join(ASSETS_DIR, 'emoji', `${code}.svg`))
      .catch(async () => {
        const response = await fetch(`${TWEMOJI_CDN}/${code}.svg`, { cache: 'force-cache' });
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
