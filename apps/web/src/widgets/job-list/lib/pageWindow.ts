export type PageWindowItem = number | 'ellipsis';

/**
 * `home.png`의 "1 2 3 … 15" 패턴 — 처음·끝 페이지와 현재 페이지 앞뒤 1칸씩만 보여주고 나머지는
 * `'ellipsis'`로 표시한다. 순수 함수라 `NumberedPagination`(렌더링)에서 분리해뒀다 — 큰
 * `totalPages`에서의 생략 규칙은 실제 픽스처 데이터(최대 3페이지)로는 curl로 확인할 수 없어
 * 이 함수만 별도로(`npx tsx`) 확인했다.
 */
export function computePageWindow(current: number, total: number): PageWindowItem[] {
  if (total <= 0) {
    return [];
  }

  const SIBLINGS = 1;
  const pages = new Set<number>([1, total]);
  for (let page = current - SIBLINGS; page <= current + SIBLINGS; page++) {
    if (page >= 1 && page <= total) {
      pages.add(page);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: PageWindowItem[] = [];
  let previous: number | undefined;
  for (const page of sorted) {
    if (previous !== undefined && page - previous > 1) {
      result.push('ellipsis');
    }
    result.push(page);
    previous = page;
  }
  return result;
}
