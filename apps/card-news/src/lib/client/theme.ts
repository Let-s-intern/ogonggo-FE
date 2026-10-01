import { hexToRgb, rgbToHex } from '../card/color';
import type { CardSettings } from '../card/types';

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
 * 처음 설정. 강조 상자는 연한 브랜드색이다 — 검정 상자만 쓰면 시안이 다 비슷해 보이고, 예시
 * (아누아·오늘의집)도 연한 브랜드색을 쓴다. 로고는 시안이 알아서 고른다.
 */
export function defaultSettings(brandColor: string): CardSettings {
  return {
    brandColor,
    highlight: 'tint',
    highlightColor: '#111111',
    logoStyle: 'auto',
  };
}

/**
 * 로고의 배경을 걷어 내고 빈 테두리를 잘라 낸다. `color` 를 주면 그 한 색으로 칠한다. 투명 배경
 * 로고는 알파를 그대로 쓰고, 흰 판 같은 불투명 배경 로고는 네 귀퉁이 색을 배경으로 보고 그 색과 먼
 * 픽셀만 남긴다 — 원래 색 로고도 흰 네모 없이 바탕 위에 놓인다.
 */
export interface ProcessedLogo {
  dataUrl: string;
  /** 가로÷세로. */
  aspect: number;
}

export async function processLogo(dataUrl: string, color?: string): Promise<ProcessedLogo> {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, 800 / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    return { dataUrl, aspect: image.width / image.height };
  }
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  const { data } = pixels;

  let transparent = 0;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index]! < 200) {
      transparent += 1;
    }
  }
  const opaque = transparent < (width * height) / 20;
  const corners = [0, width - 1, (height - 1) * width, height * width - 1].map((pixel) => [
    data[pixel * 4]!,
    data[pixel * 4 + 1]!,
    data[pixel * 4 + 2]!,
  ]);
  const background = [0, 1, 2].map(
    (channel) => corners.reduce((sum, corner) => sum + corner[channel]!, 0) / corners.length,
  ) as [number, number, number];

  const tint = color ? hexToRgb(color) : null;
  let [left, top, right, bottom] = [width, height, -1, -1];
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    let alpha = data[offset + 3]!;
    if (opaque) {
      const distance = Math.hypot(
        data[offset]! - background[0],
        data[offset + 1]! - background[1],
        data[offset + 2]! - background[2],
      );
      alpha = Math.round(Math.max(0, Math.min(1, (distance - 24) / 72)) * 255);
    }
    if (tint) {
      [data[offset], data[offset + 1], data[offset + 2]] = tint;
    }
    data[offset + 3] = alpha;
    if (alpha > 24) {
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < 0) {
    return { dataUrl, aspect: image.width / image.height };
  }
  // 로고가 색 네모 안에 흰 글자인 모양(모두닥 등)이면, 한 색으로 칠할 때 글자까지 같은 색이 돼
  // 네모만 남는다. 남은 픽셀이 테두리 상자의 6할을 넘으면 칠하지 않고 원래 색으로 돌려준다.
  if (color) {
    let covered = 0;
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        covered += data[(y * width + x) * 4 + 3]! / 255;
      }
    }
    if (covered / ((right - left + 1) * (bottom - top + 1)) > 0.6) {
      return processLogo(dataUrl);
    }
  }
  context.putImageData(pixels, 0, 0);
  const cropped = document.createElement('canvas');
  cropped.width = right - left + 1;
  cropped.height = bottom - top + 1;
  cropped.getContext('2d')?.drawImage(canvas, -left, -top);
  return { dataUrl: cropped.toDataURL('image/png'), aspect: cropped.width / cropped.height };
}
