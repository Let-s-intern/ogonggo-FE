import {
  completeImageUpload,
  createImagePresignedUrl,
  type CreateImagePresignedUrlRequestContentType,
  type SuccessResponseImagePresignedUrlResponse,
} from '@ogonggo/api';

/** 글에 붙이는 사진이 받는 형식. 취준고민·모집글은 WEBP 를 받지 않는다(백엔드 발급 검사). */
export const ATTACHMENT_CONTENT_TYPES = ['image/jpeg', 'image/png'] as const;

/** 장당 크기 상한. 발급 API 의 10 MiB 와 같다. */
export const ATTACHMENT_MAX_BYTES = 10_485_760;

/** 사진을 쓸 곳. 발급 API 의 `usage` 중 글 첨부 둘이다 — 프로필은 WEBP 를 받아 규칙이 다르다. */
export type AttachmentUsage = 'CONCERN' | 'RECRUITMENT_POST';

/**
 * 올리기 전에 거른 파일. `message` 가 그대로 사용자에게 보일 문구다 — 첨부 칸이 토스트로 띄운다.
 */
export class AttachmentRejectedError extends Error {
  readonly reason: 'type' | 'size';

  constructor(reason: 'type' | 'size') {
    super(reason === 'type' ? 'JPG, PNG 만 올릴 수 있어요' : '10MB 이하 사진만 올릴 수 있어요');
    this.name = 'AttachmentRejectedError';
    this.reason = reason;
  }
}

/** 형식·크기를 본다. 통과하면 `null`. 요청을 보내기 전에 거르려고 따로 둔다. */
export function checkAttachment(file: File): AttachmentRejectedError | null {
  if (!(ATTACHMENT_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return new AttachmentRejectedError('type');
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return new AttachmentRejectedError('size');
  }
  return null;
}

/**
 * 글에 붙일 사진 한 장을 presigned 방식으로 올리고 `{ id, url }` 을 돌려준다. `id` 는 저장 요청의
 * `imageIds` 에, `url` 은 미리보기에 쓴다.
 *
 * 1. 발급(`POST /api/v1/images/presigned-urls`) — 형식·크기를 알리고 S3 주소를 받는다.
 * 2. `uploadUrl` 에 파일을 `PUT`. `httpClient` 가 아니라 `fetch` 로 보낸다 — 인증 헤더가 붙으면
 *    S3 서명이 깨진다. `uploadHeaders` 는 서명에 묶여 있어 그대로 싣는다.
 * 3. 완료(`POST /api/v1/images/{imageId}/complete`) — 하지 않으면 글에 붙지 않고 정리 작업이 지운다.
 *
 * 형식·크기는 발급 전에 먼저 걸러 `AttachmentRejectedError` 를 던진다. 생성 타입이 응답을
 * `{ data, status, headers }` 로 감싼 모양인 것은 `uploadImage.ts` 와 같은 사정이라 한 번 단언한다.
 */
export async function uploadAttachment(
  file: File,
  usage: AttachmentUsage,
): Promise<{ id: string; url: string }> {
  const rejected = checkAttachment(file);
  if (rejected) {
    throw rejected;
  }

  const issued = (
    (await createImagePresignedUrl({
      usage,
      contentType: file.type as CreateImagePresignedUrlRequestContentType,
      size: file.size,
    })) as unknown as SuccessResponseImagePresignedUrlResponse
  ).data;
  if (!issued) {
    throw new Error('사진 업로드 주소를 받지 못했습니다.');
  }

  const put = await fetch(issued.uploadUrl, {
    method: 'PUT',
    headers: issued.uploadHeaders,
    body: file,
  });
  if (!put.ok) {
    throw new Error(`사진을 올리지 못했습니다: ${put.status}`);
  }

  await completeImageUpload(issued.id);
  return { id: issued.id, url: issued.url };
}
