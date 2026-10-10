import {
  HttpError,
  createConcern,
  replaceMyConcern,
  type SuccessResponseCreateConcernResponse,
} from '@ogonggo/api';
import type { ConcernFormValues } from '../model/values';

/**
 * 고민글 작성. 만든 글의 id 를 돌려준다.
 *
 * 생성 함수의 반환 타입은 `{ data, status, headers }` 봉투지만 `httpClient` 는 본문을 그대로 돌려준다.
 * 2xx 가 아니면 `HttpError` 로 던진다.
 */
export async function createConcernPost(values: ConcernFormValues): Promise<number> {
  const response = (await createConcern(values)) as unknown as SuccessResponseCreateConcernResponse;
  const id = response.data?.id;
  if (id === undefined) {
    throw new Error('고민글 작성 응답에 id 가 없습니다.');
  }
  return id;
}

/** 고민글 수정. 카테고리·제목·본문을 모두 보낸다. 작성자 본인만 된다(403). */
export async function updateConcernPost(id: number, values: ConcernFormValues): Promise<void> {
  await replaceMyConcern(id, values);
}

/**
 * 토스트 문구. 403 은 정지·탈퇴 계정이거나 남의 글을 고치려 한 경우다 — 백엔드가 주는 문구가 사유를 가장
 * 정확히 말하므로 본문의 `message` 를 그대로 쓴다. 404 는 그 사이 지워진 글을 고치려 한 경우다.
 * 401 은 `shared/api/reissue.ts` 가 재발급하고 다시 보낸 뒤에도 남은 것 — 로그인하지 않았거나 세션이 끝났다.
 */
export function saveFailureMessage(error: unknown, editing: boolean): string {
  const fallback = editing ? '고민을 수정하지 못했어요' : '고민을 올리지 못했어요';
  if (error instanceof HttpError) {
    if (error.status === 401) {
      return '로그인이 필요해요';
    }
    if (error.status === 403) {
      return readServerMessage(error.body) ?? fallback;
    }
    if (error.status === 404 && editing) {
      return '이미 삭제된 고민이에요';
    }
  }
  return `${fallback}. 잠시 뒤 다시 시도해 주세요`;
}

function readServerMessage(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      const { message } = parsed as { message: unknown };
      return typeof message === 'string' && message ? message : null;
    }
  } catch {
    // 본문이 JSON 이 아니면(스프링의 평문 오류 등) 기본 문구로 떨어진다.
  }
  return null;
}
