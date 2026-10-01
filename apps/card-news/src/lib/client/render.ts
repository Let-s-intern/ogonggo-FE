import { zipSync } from 'fflate';
import { CARD_SIZES, type CardSizeId, type CardSpec } from '../card/types';
import { variantOf } from '../card/variants';

export interface RenderedSlide {
  blob: Blob;
  overflow: boolean;
}

export async function renderSlide(
  spec: CardSpec,
  slide: number,
  size: CardSizeId,
  options: { scale?: number; format?: 'png' | 'svg'; signal?: AbortSignal } = {},
): Promise<RenderedSlide> {
  const response = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec, slide, size, scale: options.scale, format: options.format }),
    signal: options.signal,
  });
  if (!response.ok) {
    throw new Error(`render ${response.status}`);
  }
  return {
    blob: await response.blob(),
    overflow: response.headers.get('X-Card-Overflow') === '1',
  };
}

function save(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safe(name: string): string {
  return name.replace(/[\\/:*?"<>|\s]+/g, '_');
}

/** 받을 한 장. 시안마다 `spec` 이 다르다(배경 이미지가 시안에만 실린다). */
export interface SlideTarget {
  spec: CardSpec;
  slide: number;
}

function fileName(target: SlideTarget, size: CardSizeId): string {
  const { width, height } = CARD_SIZES[size];
  const variant = variantOf(target.spec.variant).label;
  return safe(`${target.spec.companyName}-${variant}-${target.slide + 1}-${width}x${height}.png`);
}

/**
 * 고른 장들을 받는다. 한 장이면 PNG 하나, 여러 장이면 zip 하나 — 브라우저는 다운로드가 여러 개
 * 연달아 나가면 허용을 묻는다.
 */
export async function downloadSlides(
  targets: SlideTarget[],
  sizes: CardSizeId[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const total = targets.length * sizes.length;
  const files: Record<string, Uint8Array> = {};
  let done = 0;
  for (const size of sizes) {
    for (const target of targets) {
      const { blob } = await renderSlide(target.spec, target.slide, size);
      if (total === 1) {
        save(blob, fileName(target, size));
        return;
      }
      files[fileName(target, size)] = new Uint8Array(await blob.arrayBuffer());
      done += 1;
      onProgress?.(done, total);
    }
  }
  const company = targets[0]?.spec.companyName ?? '카드뉴스';
  save(
    new Blob([zipSync(files, { level: 0 }) as BlobPart], { type: 'application/zip' }),
    safe(`${company}-카드뉴스-${total}장.zip`),
  );
}
