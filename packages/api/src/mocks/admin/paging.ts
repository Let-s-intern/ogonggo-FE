/**
 * 어드민 목록 핸들러가 공유하는 페이지네이션.
 *
 * 목록이 여덟 개고 전부 같은 `pageInfo` 모양을 낸다. 핸들러마다 slice 를 적으면 한 곳에서
 * 경계 조건을 틀리고(마지막 페이지가 비거나, `page=0` 이 앞에서 잘리거나) 그 화면만 다르게
 * 동작한다.
 */

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

export const DEFAULT_PAGE_SIZE = 20;

/** `?page=`·`?size=` 를 읽는다. 숫자가 아니거나 1 보다 작으면 기본값으로 되돌린다. */
export function readPaging(url: URL): { page: number; size: number } {
  return {
    page: readPositiveInt(url.searchParams.get('page'), 1),
    size: readPositiveInt(url.searchParams.get('size'), DEFAULT_PAGE_SIZE),
  };
}

function readPositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

/**
 * 걸러진 전체 목록을 한 페이지로 자른다.
 *
 * `page` 가 마지막을 넘어가면 빈 `items` 를 준다. 마지막 페이지로 되돌리지 않는다 — 주소창의
 * `page=99` 가 조용히 3 으로 바뀌면 운영자는 자기가 어디를 보고 있는지 알 수 없다.
 */
export function paginate<T>(all: T[], page: number, size: number): PageResponse<T> {
  const totalElements = all.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const from = (page - 1) * size;
  return {
    items: all.slice(from, from + size),
    pageInfo: { pageNum: page, pageSize: size, totalElements, totalPages },
  };
}

/** 대소문자를 무시한 부분 일치. 목록의 검색 상자가 전부 이걸 쓴다. */
export function matches(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/** 응답 봉투. 어드민 API 는 사용자 API 와 같은 `status`·`message`·`data` 모양을 쓴다. */
export function ok<T>(data: T) {
  return { status: 200, message: 'OK', data };
}

/** 없는 id 를 조회했을 때. 사용자 API 의 `ErrorResponse` 와 같은 모양이다. */
export function notFound(message: string) {
  return { status: 404, code: 'NOT_FOUND', message };
}
