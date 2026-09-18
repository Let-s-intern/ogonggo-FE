import { httpClient } from '@ogonggo/api';

/*
 * 백엔드 API 가 없어 MSW 목에만 있는 화면(회원, 공지, 사이드·스터디) 이 쓰는 호출.
 *
 * admin 스펙에 있는 화면(채용공고, 부트캠프, 검수 대기, 반려 보관) 은 생성 함수
 * (`@ogonggo/api/src/admin`) 를 부르고 봉투는 `./unwrapData.ts` 가 벗긴다. 목 전용 화면의
 * 백엔드가 생기면 같은 방식으로 옮기고 여기서 그 호출을 지운다.
 */

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

/** 목 전용 어드민 API 를 한 번 호출하고 `data` 만 꺼낸다. */
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

/** 쓰기 요청. 공지의 `POST`·`PUT` 만 남았다. */
export async function adminWrite<T>(method: 'POST' | 'PUT', path: string, body: unknown) {
  const response = await httpClient<AdminResponse<T>>(path, {
    method,
    body: JSON.stringify(body),
  });
  return response.data;
}

/** 삭제. 사이드·스터디만 쓴다. 응답 본문은 지운 id 뿐이라 따로 쓰지 않는다. */
export async function adminDelete(path: string) {
  await httpClient<AdminResponse<{ id: number }>>(path, { method: 'DELETE' });
}
