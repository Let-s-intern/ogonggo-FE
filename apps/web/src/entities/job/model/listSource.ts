/**
 * 공고 카드를 누른 목록(`list_source`)을 상세 화면으로 넘긴다.
 *
 * URL 쿼리에 싣지 않는다 — 공유 링크를 따라 다른 사람의 상세 조회까지 같은 목록에서 온 것으로
 * 잡힌다(명세 4장). 탭 안에서만 사는 `sessionStorage` 에 공고 id 와 함께 둔다. 누른 공고와 연
 * 공고가 다르면(뒤로 갔다가 주소로 다른 공고를 연 경우) 쓰지 않는다.
 *
 * 사생활 보호 창처럼 저장소가 막혀 있으면 조용히 `direct` 가 된다.
 */
const KEY = 'ogonggo:job-list-source';

export function rememberListSource(jobId: number, listSource: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ jobId, listSource }));
  } catch {
    // 저장소를 못 쓰면 상세 조회가 `direct` 로 잡힐 뿐이다.
  }
}

/** 한 번 읽으면 지운다. 새로고침한 상세가 같은 목록에서 한 번 더 온 것으로 잡히지 않게 한다. */
export function takeListSource(jobId: number): string {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    const saved = raw ? (JSON.parse(raw) as { jobId?: unknown; listSource?: unknown }) : null;
    if (saved?.jobId === jobId && typeof saved.listSource === 'string') {
      return saved.listSource;
    }
  } catch {
    // 아래 `direct` 로 떨어진다.
  }
  return 'direct';
}
