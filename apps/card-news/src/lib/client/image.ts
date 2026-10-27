import type { CardImage } from '../card/types';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = src;
  });
}

/**
 * 올린 이미지를 긴 변 `maxEdge` 로 줄여 data URL 로. 렌더 요청 본문에 그대로 실리므로 원본을
 * 보내면 요청이 무거워진다(Vercel 함수 본문 한도 4.5MB). 투명도가 있을 수 있어 PNG 로 둔다.
 */
export async function fileToDataUrl(file: Blob, maxEdge = 1080): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (file.type === 'image/svg+xml') {
    return source;
  }
  const image = await loadImage(source);
  const ratio = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/**
 * 썸네일을 카드에 넣을 모양으로. 긴 변 1350px JPEG 로 줄인다. `source` 는 올린 파일이거나 이 앱
 * 출처의 URL(`/api/images/proxy`)이다.
 */
export async function toCardImage(source: File | string, opacity: number): Promise<CardImage> {
  const src =
    typeof source === 'string'
      ? source
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(source);
        });
  const image = await loadImage(src);
  const ratio = Math.min(1, 1350 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.86),
    opacity,
    aspect: canvas.width / canvas.height,
  };
}

/** 캔버스에 투명한 픽셀이 하나라도 있는지. */
function hasTransparency(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): boolean {
  const { data } = context.getImageData(0, 0, width, height);
  for (let index = 3; index < data.length; index += 4) {
    if ((data[index] ?? 255) < 255) {
      return true;
    }
  }
  return false;
}

/**
 * 자유 요소로 붙인 이미지를 긴 변 1350px 로 줄인다. 투명한 곳이 있는 PNG·WebP·GIF 는 PNG 로 두고
 * 나머지는 JPEG 다 — 받기 요청 본문에 그대로 실린다(Vercel 함수 본문 한도 4.5MB).
 */
export async function blobToLayerImage(
  blob: Blob,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const image = await loadImage(source);
  const ratio = Math.min(1, 1350 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  const context = canvas.getContext('2d');
  context?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const transparent =
    blob.type !== 'image/jpeg' &&
    context !== null &&
    hasTransparency(context, canvas.width, canvas.height);
  return {
    dataUrl: transparent ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.86),
    width: canvas.width,
    height: canvas.height,
  };
}
