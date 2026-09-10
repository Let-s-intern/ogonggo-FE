import { httpClient } from '@ogonggo/api';

/** 어드민 API 의 공통 응답 봉투. 사용자 API 와 같은 모양이다. */
export interface AdminResponse<T> {
  status: number;
  message: string;
  data?: T;
}

export interface PageInfo {
  pageNum: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

/**
 * 어드민 API 한 번 호출하고 `data` 만 꺼낸다.
 *
 * 백엔드가 아직 없어 orval 생성 클라이언트에 어드민 호출이 없다. 생기면 이 함수를 지우고
 * 생성된 훅으로 갈아끼운다 — 그때까지 봉투를 벗기는 자리를 한 곳에 모아 둔다.
 */
export async function adminGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    // 빈 문자열은 "전체"를 뜻하므로 아예 보내지 않는다. 서버가 빈 값으로 거르면 결과가 0건이 된다.
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  const search = query.toString();
  const response = await httpClient<AdminResponse<T>>(`${path}${search ? `?${search}` : ''}`);
  return response.data;
}

/** 쓰기 요청. `PATCH`·`POST`·`PUT` 을 같은 자리에서 처리한다. */
export async function adminWrite<T>(method: 'POST' | 'PUT' | 'PATCH', path: string, body: unknown) {
  const response = await httpClient<AdminResponse<T>>(path, {
    method,
    body: JSON.stringify(body),
  });
  return response.data;
}

/** 삭제. 응답 본문은 지운 id 뿐이라 따로 쓰지 않는다. */
export async function adminDelete(path: string) {
  await httpClient<AdminResponse<{ id: number }>>(path, { method: 'DELETE' });
}
