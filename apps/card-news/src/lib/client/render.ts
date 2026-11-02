import { zipSync } from 'fflate';
import type { SlideRole } from '../card/document';
import { CARD_SIZES, type CardSizeId, type CardSpec } from '../card/types';
import { variantOf } from '../card/variants';

export interface RenderedSlide {
  blob: Blob;
  overflow: boolean;
}

export async function renderSlide(
  spec: CardSpec,
  role: SlideRole,
  size: CardSizeId,
  options: { scale?: number; format?: 'png' | 'svg'; signal?: AbortSignal } = {},
): Promise<RenderedSlide> {
  const response = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec, role, size, scale: options.scale, format: options.format }),
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

/** 받을 한 장. 장마다 `spec` 이 다르다(그 장의 편집값만 싣는다). `index` 는 문서의 몇 번째 장인가. */
export interface SlideTarget {
  spec: CardSpec;
  role: SlideRole;
  index: number;
}

/**
 * 장 파일 이름(`<문서 제목>-<시안>-<장 번호>-<크기>.png`). 이름 앞을 문서 제목 하나로 두어, 여러 회사를
 * 묶어도 파일 이름 순서가 장 순서다. 공고 하나면 문서 제목이 회사명이다. 장 번호는 받는 장 중 가장 큰
 * 번호의 자릿수에 맞춰 앞을 0 으로 채운다(10장이면 `01`).
 */
function fileName(target: SlideTarget, size: CardSizeId, title: string, digits: number): string {
  const { width, height } = CARD_SIZES[size];
  const variant = variantOf(target.spec.variant).label;
  const number = String(target.index + 1).padStart(digits, '0');
  return safe(`${title}-${variant}-${number}-${width}x${height}.png`);
}

/**
 * 고른 장들을 받는다. 한 장이면 PNG 하나, 여러 장이면 zip 하나 — 브라우저는 다운로드가 여러 개
 * 연달아 나가면 허용을 묻는다. zip 이름은 `<문서 제목>-카드뉴스-<N>장.zip` 이다(한 회사면 회사명, 여러
 * 회사 묶음이면 회사 이름을 `·` 로 이은 문서 제목).
 */
export async function downloadSlides(
  targets: SlideTarget[],
  sizes: CardSizeId[],
  title: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const total = targets.length * sizes.length;
  const digits = String(Math.max(0, ...targets.map((target) => target.index + 1))).length;
  const files: Record<string, Uint8Array> = {};
  let done = 0;
  for (const size of sizes) {
    for (const target of targets) {
      const { blob } = await renderSlide(target.spec, target.role, size);
      if (total === 1) {
        save(blob, fileName(target, size, title, digits));
        return;
      }
      files[fileName(target, size, title, digits)] = new Uint8Array(await blob.arrayBuffer());
      done += 1;
      onProgress?.(done, total);
    }
  }
  save(
    new Blob([zipSync(files, { level: 0 }) as BlobPart], { type: 'application/zip' }),
    safe(`${title}-카드뉴스-${total}장.zip`),
  );
}
