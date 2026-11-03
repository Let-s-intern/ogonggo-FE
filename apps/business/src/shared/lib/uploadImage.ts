import { createImage, type SuccessResponseImageUploadResponse } from '@ogonggo/api';

/**
 * 이미지 한 장을 올리고 표시용 주소를 돌려준다(`POST /api/v1/images`).
 *
 * `multipart/form-data` 한 칸(`file`) 이고, 응답의 `url` 이 그대로 공고의 대표 이미지 주소에
 * 들어간다. 이미지는 여기서 임시 저장되고 공고를 저장할 때 연결된다 — 그래서 올린 뒤 저장하지
 * 않으면 공고에 붙지 않는다.
 *
 * 생성 타입은 응답을 `{ data, status, headers }` 로 감싼 모양이지만 `httpClient` 는 본문을
 * 그대로 돌려준다(`widgets/company-posts/lib/fetch.ts` 의 같은 주석). 그래서 한 번 단언한다.
 */
export async function uploadImage(file: File): Promise<string | undefined> {
  return (await uploadImageAsset(file))?.url;
}

/**
 * `uploadImage` 와 같고 이미지 식별자(`id`)도 함께 돌려준다. 모집글 본문 이미지가 쓴다 — 백엔드는
 * 본문 JSON 의 이미지 노드에 담긴 `imageId` 로 올린 이미지를 글에 연결한다(`lexicalImageNode.tsx`).
 */
export async function uploadImageAsset(
  file: File,
): Promise<{ id: string; url: string } | undefined> {
  const body = (await createImage({ file })) as unknown as SuccessResponseImageUploadResponse;
  return body.data ? { id: body.data.id, url: body.data.url } : undefined;
}
