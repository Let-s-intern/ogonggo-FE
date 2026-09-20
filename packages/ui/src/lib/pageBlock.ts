/** 번호줄 한 묶음에 보여줄 페이지 수. */
export const PAGE_BLOCK_SIZE = 10;

export interface PageBlock {
  /** 지금 묶음에 보여줄 페이지 번호들. 오름차순이고 비지 않는다(`total >= 1`일 때). */
  pages: number[];
  /** `이전`이 갈 페이지. 첫 묶음이면 `null`이고 그때 `이전`은 비활성이다. */
  previousBlockPage: number | null;
  /** `다음`이 갈 페이지. 마지막 묶음이면 `null`이고 그때 `다음`은 비활성이다. */
  nextBlockPage: number | null;
}

/**
 * 현재 페이지가 속한 10개 묶음을 통째로 돌려준다 — `1~10`, `11~20` 식이다.
 *
 * 앞뒤 몇 칸만 보여주고 나머지를 `…`로 접던 방식을 대신한다. 접는 방식은 화면을 덜 차지하지만
 * "지금 몇 번째 묶음을 보고 있는지"가 드러나지 않았고, `packages/ui`와 `apps/web`이 접는 칸 수를
 * 각자 정해(2칸 대 1칸) 두 앱의 페이징이 서로 다르게 생기는 원인이기도 했다. 계산을 여기 한 곳에
 * 두는 이유가 그것이다.
 *
 * `이전`·`다음`은 한 장이 아니라 묶음 단위로 움직인다. 번호를 10개씩 묶어 보여주면서 한 장씩
 * 움직이면 10번을 눌러야 번호줄이 바뀌어, 묶어 보여주는 의미가 없어진다. 돌아오는 값도
 * 대칭이다 — 7에서 `다음`이 11이면 11에서 `이전`은 1이다.
 *
 * 마지막 묶음은 자연스럽게 짧아진다. 23페이지짜리 목록의 마지막 묶음은 `21 22 23`이다.
 *
 * `처음`·`끝`(맨 양끝 화살표)은 이 함수가 다루지 않는다. 그건 언제나 1과 `total`이다.
 */
export function computePageBlock(
  current: number,
  total: number,
  size: number = PAGE_BLOCK_SIZE,
): PageBlock {
  if (total <= 0) {
    return { pages: [], previousBlockPage: null, nextBlockPage: null };
  }

  const clamped = Math.min(Math.max(current, 1), total);
  const blockStart = Math.floor((clamped - 1) / size) * size + 1;
  const blockEnd = Math.min(blockStart + size - 1, total);

  const pages: number[] = [];
  for (let page = blockStart; page <= blockEnd; page += 1) {
    pages.push(page);
  }

  return {
    pages,
    previousBlockPage: blockStart > 1 ? blockStart - size : null,
    nextBlockPage: blockEnd < total ? blockEnd + 1 : null,
  };
}
