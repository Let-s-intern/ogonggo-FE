import { zipSync } from 'fflate';
import { CARD_SIZES, SLIDE_COUNT, type CardSizeId, type CardSpec } from '../card/types';

export interface RenderedSlide {
  blob: Blob;
  overflow: boolean;
}

export async function renderSlide(
  spec: CardSpec,
  slide: number,
  size: CardSizeId,
  signal?: AbortSignal,
): Promise<RenderedSlide> {
  const response = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec, slide, size }),
    signal,
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

function baseName(spec: CardSpec): string {
  return `${spec.companyName}-카드뉴스`.replace(/[\\/:*?"<>|\s]+/g, '_');
}

function slideFileName(spec: CardSpec, slide: number, size: CardSizeId): string {
  const { width, height } = CARD_SIZES[size];
  return `${baseName(spec)}-${slide + 1}-${width}x${height}.png`;
}

export async function downloadSlide(spec: CardSpec, slide: number, size: CardSizeId) {
  const { blob } = await renderSlide(spec, slide, size);
  save(blob, slideFileName(spec, slide, size));
}

/**
 * 여러 장을 zip 하나로. 브라우저는 다운로드가 여러 개 연달아 나가면 허용을 묻는다 — selumo-card
 * 와 같은 이유로 묶는다.
 */
export async function downloadZip(spec: CardSpec, sizes: CardSizeId[]) {
  const files: Record<string, Uint8Array> = {};
  for (const size of sizes) {
    for (let slide = 0; slide < SLIDE_COUNT; slide += 1) {
      const { blob } = await renderSlide(spec, slide, size);
      files[slideFileName(spec, slide, size)] = new Uint8Array(await blob.arrayBuffer());
    }
  }
  const zipped = zipSync(files, { level: 0 });
  const only = sizes.length === 1 ? CARD_SIZES[sizes[0]!] : null;
  const suffix = only ? `${only.width}x${only.height}` : '전체크기';
  save(
    new Blob([zipped as BlobPart], { type: 'application/zip' }),
    `${baseName(spec)}-${suffix}.zip`,
  );
}
