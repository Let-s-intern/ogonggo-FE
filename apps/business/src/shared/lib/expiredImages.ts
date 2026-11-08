import { useCallback, useState } from 'react';
import { HttpError } from '@ogonggo/api';

/**
 * 업로드 이미지 만료(ogonggo-BE #117). 기업 공고·부트캠프 폼에서 올린 로고·대표 이미지는 공고를 저장할 때 붙는다.
 * 올리고 저장하지 않은 채(임시저장은 이 브라우저에만 남는다) 하루가 지나면 정리 작업이 S3 에서 지운다. 그 주소로
 * 등록·수정하면 백엔드가 400 `IMAGE_ASSET_NOT_AVAILABLE` 을 준다. 외부 주소는 막지 않는다.
 */

export const IMAGE_EXPIRED_MESSAGE = '이미지가 만료되었어요. 이미지를 다시 올려 주세요.';

/**
 * 오공고가 올린 이미지의 호스트. `POST /api/v1/images` 가 돌려주는 주소다(로고 프록시 `LOGO_PROXY_HOSTS` 의 첫 줄과
 * 같은 버킷). 이 호스트가 아닌 주소는 외부 주소라 확인하지 않는다.
 */
const UPLOAD_HOST = 'letsintern-bucket.s3.ap-northeast-2.amazonaws.com';

/** 확인을 이만큼 기다리고, 넘으면 살아 있다고 본다. 느린 망에서 멀쩡한 이미지를 지우지 않는다. */
const CHECK_TIMEOUT_MS = 8000;

export function isUploadedImageUrl(url: string): boolean {
  try {
    return new URL(url).host === UPLOAD_HOST;
  } catch {
    return false;
  }
}

/** 등록·수정 응답이 지워진 이미지 때문에 거절된 것인지. 응답에는 어느 칸인지 적혀 있지 않다. */
export function isImageAssetNotAvailable(error: unknown): boolean {
  if (!(error instanceof HttpError) || error.status !== 400) {
    return false;
  }
  try {
    return (JSON.parse(error.body) as { code?: unknown }).code === 'IMAGE_ASSET_NOT_AVAILABLE';
  } catch {
    return false;
  }
}

/**
 * 이미지가 아직 있는지. 이미지로 불러 본다 — 지워진 S3 객체는 403 이라 `onerror` 가 된다. `fetch` 로 보면 버킷의 CORS 에
 * 막힌다. 기다리다 넘으면 살아 있다고 본다.
 */
function isImageAlive(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => finish(true), CHECK_TIMEOUT_MS);
    function finish(alive: boolean) {
      window.clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(alive);
    }
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
  });
}

/** 칸들 가운데 오공고가 올렸는데 지워진 이미지의 칸. 빈 칸과 외부 주소는 보지 않는다. */
export async function findExpiredImages<K extends string>(images: Record<K, string>): Promise<K[]> {
  const keys = (Object.keys(images) as K[]).filter((key) => isUploadedImageUrl(images[key]));
  const alive = await Promise.all(keys.map((key) => isImageAlive(images[key])));
  return keys.filter((_, index) => !alive[index]);
}

/**
 * 등록·수정이 `IMAGE_ASSET_NOT_AVAILABLE` 로 거절됐을 때 비울 칸. 지워진 것이 확인된 칸이고, 하나도 확인되지 않으면
 * (응답이 칸을 알려 주지 않는다) 오공고에 올린 이미지 칸 전부다. 그것도 없으면 이미지 칸 전부다.
 */
export async function imagesToClearAfterRejection<K extends string>(
  images: Record<K, string>,
): Promise<K[]> {
  const expired = await findExpiredImages(images);
  if (expired.length > 0) {
    return expired;
  }
  const keys = (Object.keys(images) as K[]).filter((key) => images[key] !== '');
  const uploaded = keys.filter((key) => isUploadedImageUrl(images[key]));
  return uploaded.length > 0 ? uploaded : keys;
}

/**
 * 폼의 만료된 이미지 칸. 표시한 칸 옆에 `IMAGE_EXPIRED_MESSAGE` 를 띄우고, 그 칸에 새 값이 들어오면 지운다
 * (`onChanged` 에 폼의 바뀐 값을 넘긴다).
 */
export function useExpiredImageFields<K extends string>() {
  const [expired, setExpired] = useState<ReadonlySet<K>>(() => new Set());
  const mark = useCallback((keys: K[]) => setExpired(new Set(keys)), []);
  const onChanged = useCallback(
    (patch: object) =>
      setExpired((previous) => {
        const next = new Set([...previous].filter((key) => !(key in patch)));
        return next.size === previous.size ? previous : next;
      }),
    [],
  );
  const messageOf = (key: K) => (expired.has(key) ? IMAGE_EXPIRED_MESSAGE : undefined);
  return { expired, mark, onChanged, messageOf };
}
