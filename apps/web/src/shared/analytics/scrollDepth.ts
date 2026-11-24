/**
 * 스크롤 깊이(광고 리포트 `SCROLL` 의 `scrollPercent`). 문서와 모달의 스크롤 상자가 같은 식을 쓴다.
 *
 * 다른 모듈을 가져오지 않는다. 단위 테스트(`pnpm --filter web test`)가 이 파일만 Node 에서 돌린다.
 */

export interface ScrollMetrics {
  /** 내린 만큼. 문서는 `window.scrollY`. */
  scrollTop: number;
  /** 스크롤되는 내용 전체의 높이. */
  scrollHeight: number;
  /** 보이는 창의 높이. 문서는 `window.innerHeight`. */
  clientHeight: number;
}

/**
 * 맨 위는 0, 맨 아래는 100 이다. 이 식 전에는 `(내린 만큼 + 창 높이) / 전체 높이` 라 아무것도 내리지 않아도 창
 * 아래 끝까지 본 것으로 쳐서 데스크톱에서 30~60%, 짧은 글은 100% 가 나왔다(2026-11-24 바뀜). 지금은 내릴 수 있는
 * 길이(`전체 높이 - 창 높이`) 중 얼마나 내렸는지다.
 *
 * 창에 다 들어가는 글은 내릴 곳이 없고 끝까지 보인 것이라 100 이다.
 */
export function scrollDepthPercent({ scrollTop, scrollHeight, clientHeight }: ScrollMetrics): number {
  const scrollable = scrollHeight - clientHeight;
  if (scrollable <= 0) {
    return 100;
  }
  return Math.min(100, Math.max(0, Math.round((scrollTop / scrollable) * 100)));
}
