import type { AssistantApiMessage, AssistantContentPart } from '@/shared/api/assistant';

/**
 * AI 비서에게 보내는 이미지. 채팅에 올린 그림과 원문 포스터(`view_source_images`)를 브라우저에서 줄여 JPEG data URI 로
 * 만든다. 모델은 이미지를 user 메시지의 `image_url` 로만 받는다(`api/assistant.ts`).
 *
 * 숫자는 Vercel 함수의 요청 본문 상한 4.5MB 에 맞췄다. 왕복마다 대화 전체를 다시 보내므로 이미지도 매번 실린다.
 * - 한 장은 긴 변 1600px 이하, data URI 450,000자(약 330KB) 이하. 넘으면 화질을 낮추고, 그래도 넘으면 더 줄인다.
 *   모델은 이미지 한 장을 1024 토큰 안으로 읽어 이보다 크게 보내도 더 읽지 못한다.
 * - 메시지 하나에 6장까지(서버 `MAX_IMAGES_PER_MESSAGE` 와 같다). 6장이면 2.7MB 쯤이다.
 * - 요청 하나는 4,000,000바이트까지. 넘으면 오래된 메시지의 이미지부터 빼고 보낸다(`fitRequestSize`).
 *
 * 세로로 긴 포스터(높이가 폭의 2배 초과)는 위에서부터 같은 높이로 잘라 여러 장으로 보낸다. 통째로 줄이면 글자가
 * 뭉개져 읽지 못한다.
 */

export const MAX_IMAGES_PER_MESSAGE = 6;
const MAX_IMAGE_SIDE = 1600;
const MAX_IMAGE_DATA_URL_LENGTH = 450_000;
const MAX_REQUEST_BYTES = 4_000_000;
/** 높이가 폭의 이 배를 넘으면 자른다. 조각 높이는 폭의 `TILE_RATIO` 배 가까이로 고르게 나눈다. */
const SPLIT_RATIO = 2;
const TILE_RATIO = 1.5;
const JPEG_QUALITIES = [0.85, 0.7, 0.55];

/** 받는 그림 형식. 모델이 읽는 형식(JPEG·PNG·GIF·WebP)과 같다. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function encodeSlice(bitmap: ImageBitmap, top: number, sliceHeight: number): string {
  let scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, sliceHeight));
  for (;;) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(sliceHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('이미지를 줄이지 못했습니다.');
    }
    // 투명한 PNG 는 JPEG 로 바꾸면 검게 된다. 흰 바탕을 먼저 깐다.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, top, bitmap.width, sliceHeight, 0, 0, canvas.width, canvas.height);
    for (const quality of JPEG_QUALITIES) {
      const url = canvas.toDataURL('image/jpeg', quality);
      if (url.length <= MAX_IMAGE_DATA_URL_LENGTH) {
        return url;
      }
    }
    scale *= 0.75;
  }
}

/** 그림 하나를 보낼 data URI 로. 긴 포스터는 여러 장이 되고, `maxParts` 장에서 멈춘다(아래쪽이 빠진다). */
export async function imageToDataUrls(blob: Blob, maxParts: number): Promise<string[]> {
  if (!ACCEPTED_IMAGE_TYPES.includes(blob.type)) {
    throw new Error('JPEG·PNG·GIF·WebP 이미지만 올릴 수 있습니다.');
  }
  const bitmap = await createImageBitmap(blob).catch(() => {
    throw new Error('이미지를 읽지 못했습니다.');
  });
  try {
    const { width, height } = bitmap;
    const count =
      height / width > SPLIT_RATIO ? Math.max(1, Math.round(height / (width * TILE_RATIO))) : 1;
    const sliceHeight = Math.ceil(height / count);
    const urls: string[] = [];
    for (let top = 0; top < height && urls.length < maxParts; top += sliceHeight) {
      urls.push(encodeSlice(bitmap, top, Math.min(sliceHeight, height - top)));
    }
    return urls;
  } finally {
    bitmap.close();
  }
}

export const imageParts = (urls: string[]): AssistantContentPart[] =>
  urls.map((url) => ({ type: 'image_url', image_url: { url } }));

const imageCount = (message: AssistantApiMessage) =>
  message.role === 'user' && Array.isArray(message.content)
    ? message.content.filter((part) => part.type === 'image_url').length
    : 0;

/**
 * 요청이 `MAX_REQUEST_BYTES` 를 넘으면 오래된 메시지의 이미지부터 글 한 줄로 바꾼다. 보낼 요청만 바꾸고 대화에 든
 * 메시지는 그대로 둔다. 이미지를 다 빼도 넘으면 그대로 보낸다 — 서버가 413 으로 답하고 패널이 알린다.
 */
export function fitRequestSize(messages: AssistantApiMessage[]): AssistantApiMessage[] {
  const size = (list: AssistantApiMessage[]) => new Blob([JSON.stringify(list)]).size;
  let fitted = messages;
  for (let index = 0; index < fitted.length && size(fitted) > MAX_REQUEST_BYTES; index += 1) {
    const message = fitted[index]!;
    const count = imageCount(message);
    if (count === 0 || message.role !== 'user' || !Array.isArray(message.content)) {
      continue;
    }
    const text = message.content.flatMap((part) => (part.type === 'text' ? [part.text] : []));
    const placeholder: AssistantApiMessage = {
      role: 'user',
      content: [
        ...text,
        `(이미지 ${count}장은 요청 크기 상한 때문에 이번 요청에서 뺐습니다. 앞에서 읽은 내용으로 답한다.)`,
      ].join('\n'),
    };
    fitted = fitted.map((entry, at) => (at === index ? placeholder : entry));
  }
  return fitted;
}
