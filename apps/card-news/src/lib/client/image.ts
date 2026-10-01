/**
 * 올린 이미지를 긴 변 `maxEdge` 로 줄여 data URL 로. 렌더 요청 본문에 그대로 실리므로 원본을
 * 보내면 요청이 무거워진다(Vercel 함수 본문 한도 4.5MB). 투명도가 있을 수 있어 PNG 로 둔다.
 */
import type { CardImage } from '../card/types';

function readFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = src;
  });
}

export async function fileToDataUrl(file: File, maxEdge = 1080): Promise<string> {
  const source = await readFile(file);
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

/** 캔버스 한 띠의 평균 밝기(0~1). */
function bandLuminance(
  context: CanvasRenderingContext2D,
  width: number,
  top: number,
  bottom: number,
) {
  const { data } = context.getImageData(0, top, width, Math.max(1, bottom - top));
  let sum = 0;
  for (let index = 0; index < data.length; index += 4) {
    sum += (0.2126 * data[index]! + 0.7152 * data[index + 1]! + 0.0722 * data[index + 2]!) / 255;
  }
  return sum / (data.length / 4);
}

/**
 * 배경 이미지를 카드에 넣을 모양으로. 긴 변 1350px JPEG 로 줄이고, 카드(4:5)에 꽉 채웠을 때
 * 제목 자리(위 40%)와 목록 자리(아래 60%)의 밝기를 잰다 — 시안이 그 밝기로 글자색을 고른다.
 * `source` 는 올린 파일이거나 이 앱 출처의 URL(`/api/images/proxy`)이다.
 */
export async function toCardImage(source: File | string, opacity: number): Promise<CardImage> {
  const image = await loadImage(typeof source === 'string' ? source : await readFile(source));
  const ratio = Math.min(1, 1350 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('canvas');
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  // 카드 비율(4:5)로 가운데를 잘랐을 때의 영역에서 잰다(렌더의 objectFit: cover 와 같다).
  const cardRatio = 4 / 5;
  const cropWidth = Math.min(canvas.width, canvas.height * cardRatio);
  const cropHeight = Math.min(canvas.height, canvas.width / cardRatio);
  const sample = document.createElement('canvas');
  sample.width = 80;
  sample.height = 100;
  const sampleContext = sample.getContext('2d');
  sampleContext?.drawImage(
    canvas,
    (canvas.width - cropWidth) / 2,
    (canvas.height - cropHeight) / 2,
    cropWidth,
    cropHeight,
    0,
    0,
    80,
    100,
  );
  const tone = sampleContext
    ? {
        top: bandLuminance(sampleContext, 80, 0, 40),
        bottom: bandLuminance(sampleContext, 80, 40, 100),
      }
    : { top: 0.5, bottom: 0.5 };
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.86), opacity, tone };
}
