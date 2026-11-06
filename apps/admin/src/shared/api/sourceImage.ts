import { getAccessToken } from './accessToken';

/**
 * 공고 원문 이미지를 서버리스 함수(`api/source-image.ts`)를 거쳐 받는 작은 클라이언트. AI 비서의 `view_source_images`
 * 가 쓴다. 남의 사이트 그림을 브라우저가 직접 받으면 CORS 로 캔버스에서 줄이지 못한다.
 *
 * `logoCandidates.ts` 와 같은 이유로 `httpClient` 를 쓰지 않는다 — 이 호출의 실패는 남의 사이트 사정일 수 있다.
 * `/source-image-api` 는 dev 에서 `vite.config.ts` 의 미들웨어가, 배포본에서 `vercel.json` 의 rewrite 가 받는다.
 */

const SOURCE_IMAGE_PATH = '/source-image-api';

export async function fetchSourceImage(url: string, signal?: AbortSignal): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(SOURCE_IMAGE_PATH, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url }),
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { message?: string } | undefined;
    throw new Error(body?.message ?? `이미지를 받지 못했습니다(${response.status}).`);
  }
  return response.blob();
}
