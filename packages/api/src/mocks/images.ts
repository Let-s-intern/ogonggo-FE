import { http, HttpResponse, type HttpHandler } from 'msw';
import type { CreateImagePresignedUrlRequest } from '../generated/user/models/createImagePresignedUrlRequest';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { SuccessResponseImagePresignedUrlResponse } from '../generated/user/models/successResponseImagePresignedUrlResponse';
import type { SuccessResponseImageUploadResponse } from '../generated/user/models/successResponseImageUploadResponse';

/**
 * presigned 업로드 세 단계(발급 → S3 `PUT` → 완료) 목 핸들러.
 *
 * S3 주소는 실제로 없는 목 호스트다. 브라우저 워커가 그 `PUT` 을 가로채 200 을 준다 — 실제 S3 는
 * CORS 가 운영 주소만 열려 있어 로컬에서 볼 수 없다. 파일은 어디에도 남지 않으므로 표시용 주소는
 * `apps/web/public/hero/` 의 이미지를 돌려 쓴다.
 *
 * 발급은 백엔드처럼 취준고민·모집글의 WEBP 를 400 으로 거절한다. 완료는 발급한 적 없는 id 도
 * 200 이다 — 메모리 저장소가 서버 렌더와 브라우저 워커에 따로 있어 맞춰 볼 수 없다.
 */

const MOCK_S3_ORIGIN = 'https://ogonggo-mock-s3.s3.ap-northeast-2.amazonaws.com';
const MOCK_IMAGE_URLS = [
  '/hero/concerns.png',
  '/hero/side-studies.png',
  '/hero/jobs.png',
  '/hero/bootcamps.png',
] as const;

/** 발급한 id 의 형식·크기. 완료 응답을 채운다. */
const issued = new Map<string, { contentType: string; size: number; url: string }>();

const issueHandler = http.post('*/api/v1/images/presigned-urls', async ({ request }) => {
  const body = (await request.json()) as CreateImagePresignedUrlRequest;
  if (body.contentType === 'image/webp' && body.usage !== 'PROFILE') {
    const error: ErrorResponse = {
      status: 400,
      code: 'IMAGE_FILE_TYPE_NOT_SUPPORTED',
      message: 'JPG·PNG만 됩니다.',
    };
    return HttpResponse.json(error, { status: 400 });
  }

  const id = crypto.randomUUID();
  const url = MOCK_IMAGE_URLS[issued.size % MOCK_IMAGE_URLS.length] ?? MOCK_IMAGE_URLS[0];
  issued.set(id, { contentType: body.contentType, size: body.size, url });
  const response: SuccessResponseImagePresignedUrlResponse = {
    status: 201,
    message: 'Created',
    data: {
      id,
      uploadUrl: `${MOCK_S3_ORIGIN}/ogonggo/${body.usage.toLowerCase()}/${id}`,
      uploadHeaders: { 'Content-Type': body.contentType },
      url,
    },
  };
  return HttpResponse.json(response, { status: 201 });
});

const s3PutHandler = http.put(`${MOCK_S3_ORIGIN}/*`, () => new HttpResponse(null, { status: 200 }));

const completeHandler = http.post('*/api/v1/images/:imageId/complete', ({ params }) => {
  const id = String(params.imageId);
  const image = issued.get(id);
  const response: SuccessResponseImageUploadResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: {
      id,
      url: image?.url ?? MOCK_IMAGE_URLS[0],
      mimeType: image?.contentType ?? 'image/png',
      size: image?.size ?? 0,
    },
  };
  return HttpResponse.json(response);
});

export const imageUploadHandlers: HttpHandler[] = [issueHandler, s3PutHandler, completeHandler];
