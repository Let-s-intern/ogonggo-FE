/**
 * 상세의 `‹ 목록` 이 돌아갈 목록 주소. 목록이 그릴 때마다 지금 주소(쪽·검색어·필터·정렬)를 적고, 상세의
 * 링크가 꺼내 쓴다. 이게 없으면 링크가 `/`·`/bootcamps` 로 바로 가서 보던 쪽과 검색어가 풀린다.
 *
 * `sessionStorage` 인 이유: 탭 하나 안의 흐름이다. 다른 탭에서 본 목록으로 돌아가면 안 되고, 창을 닫으면
 * 잊어도 된다. 막혀 있으면(사파리 개인 정보 보호 모드 등) 기본 목록으로 간다.
 */
export type ListKind = 'jobs' | 'bootcamps';

const STORAGE_KEY: Record<ListKind, string> = {
  jobs: 'ogonggo.web.listReturn.jobs',
  bootcamps: 'ogonggo.web.listReturn.bootcamps',
};

/** 이 목록의 경로로 시작하는 값만 받는다. 저장소 값은 누구나 고칠 수 있어 그대로 링크로 쓰지 않는다. */
const LIST_PATH: Record<ListKind, RegExp> = {
  jobs: /^\/(\?|$)/,
  bootcamps: /^\/bootcamps(\?|$)/,
};

export function rememberListHref(kind: ListKind, href: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY[kind], href);
  } catch {
    // 저장소가 막혀 있으면 기억하지 않는다. 링크는 기본 목록으로 간다.
  }
}

export function readListHref(kind: ListKind): string | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY[kind]);
    return value && LIST_PATH[kind].test(value) ? value : null;
  } catch {
    return null;
  }
}
