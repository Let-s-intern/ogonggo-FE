import { contrastRatio, hexToRgb, mix, readableText, rgbToHex } from '../card/color';
import type { CardTheme } from '../card/types';

/** 로고에서 색을 못 뽑았을 때(흑백 로고 등)의 바탕. 오공고 인스타 계정의 민트다. */
export const FALLBACK_COLOR = '#9CF6EE';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function hsl([r, g, b]: [number, number, number]): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const light = (max + min) / 2;
  if (max === min) {
    return [0, 0, light];
  }
  const delta = max - min;
  const sat = light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue =
    max === rn
      ? (gn - bn) / delta + (gn < bn ? 6 : 0)
      : max === gn
        ? (bn - rn) / delta + 2
        : (rn - gn) / delta + 4;
  return [hue * 60, sat, light];
}

/**
 * 로고에서 대표 색을 뽑는다. 투명·흰색·검정·회색에 가까운 픽셀은 버리고, 색상(hue)을 30도
 * 칸으로 나눠 가장 많은 칸의 평균을 고른다. 채도가 높은 픽셀에 가중치를 더 준다 — 로고의
 * 글자색보다 브랜드 색이 뽑히도록.
 */
export async function extractBrandColor(dataUrl: string): Promise<string | null> {
  const image = await loadImage(dataUrl);
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  const ratio = Math.min(size / image.width, size / image.height);
  context.drawImage(image, 0, 0, image.width * ratio, image.height * ratio);
  const { data } = context.getImageData(0, 0, size, size);

  const buckets = new Map<number, { weight: number; r: number; g: number; b: number }>();
  for (let index = 0; index < data.length; index += 4) {
    const [r, g, b, a] = [data[index]!, data[index + 1]!, data[index + 2]!, data[index + 3]!];
    if (a < 160) {
      continue;
    }
    const [hue, sat, light] = hsl([r, g, b]);
    if (sat < 0.25 || light < 0.12 || light > 0.92) {
      continue;
    }
    const key = Math.floor(hue / 30);
    const weight = sat * (1 - Math.abs(light - 0.5));
    const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
    bucket.weight += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    buckets.set(key, bucket);
  }
  const best = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
  // 색 픽셀이 너무 적으면(로고의 작은 점 하나 등) 브랜드 색으로 보지 않는다.
  if (!best || best.weight < 8) {
    return null;
  }
  return rgbToHex([best.r / best.weight, best.g / best.weight, best.b / best.weight]);
}

/**
 * 대표 색으로 카드 색 묶음을 만든다. 바탕은 그 색 그대로, 글자는 더 잘 읽히는 검정·흰색이다.
 * 상자와 칩은 검정 바탕에 흰 글자 — 예시 카드(배민·와이어트·에르메스)가 모두 그렇다. 바탕이
 * 검정에 가까우면 상자가 묻히므로 브랜드 색을 밝혀 상자로 쓴다.
 */
export function themeFromColor(color: string): CardTheme {
  const textColor = readableText(color);
  const boxColor = contrastRatio(color, '#111111') < 2.2 ? mix(color, '#FFFFFF', 0.85) : '#111111';
  const boxTextColor = readableText(boxColor);
  const [r, g, b] = hexToRgb(color);
  const accentColor =
    textColor === '#FFFFFF' ? mix(rgbToHex([r, g, b]), '#FFFFFF', 0.35) : '#111111';
  return {
    background: {
      kind: 'solid',
      color,
      color2: '#000000',
      imageOpacity: 0.18,
    },
    textColor,
    boxColor,
    boxTextColor,
    accentColor,
    // 바탕이 로고 색이라 어두운 바탕에서는 로고가 묻힌다(토스 파랑 위의 파란 로고).
    logoPlate: textColor === '#FFFFFF',
  };
}
