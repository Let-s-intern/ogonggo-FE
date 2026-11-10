/**
 * 목록 화면이 마지막으로 본 조건(페이지·필터)을 탭에 기억해 두고, 상세에서 목록으로 돌아가는 링크가 그 조건으로
 * 돌아가게 한다(2026-11-10 사용자: 3페이지에서 상세를 보고 돌아오면 1페이지로 리셋돼 불편했다).
 *
 * 목록 주소의 쿼리를 그대로 쓰되, 열린 모달을 뜻하는 값(`bootcamp`, `edit`)은 뺀다 — 돌아왔을 때 모달이 다시 뜨면
 * 안 된다. 저장소를 쓸 수 없으면 조건 없이 목록 주소만 준다.
 */
const KEY_PREFIX = 'ogonggo-admin:list-search:';
const MODAL_PARAMS = ['bootcamp', 'edit'];

export function rememberListSearch(pathname: string, searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);
  for (const key of MODAL_PARAMS) next.delete(key);
  try {
    sessionStorage.setItem(KEY_PREFIX + pathname, next.toString());
  } catch {
    // 저장소를 쓸 수 없으면 기억하지 않는다.
  }
}

/** 목록 주소에 마지막으로 본 조건을 붙인다. 이미 쿼리가 있는 주소는 그대로 둔다. */
export function listHref(path: string): string {
  if (path.includes('?')) return path;
  try {
    const search = sessionStorage.getItem(KEY_PREFIX + path);
    return search ? `${path}?${search}` : path;
  } catch {
    return path;
  }
}
