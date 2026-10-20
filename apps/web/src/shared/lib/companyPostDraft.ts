/**
 * 기업 공고 작성 폼의 임시저장(채용공고·부트캠프). **서버가 아니라 이 브라우저의 `localStorage` 에 둔다.**
 *
 * 서버에는 임시저장이 따로 없다. 기업 공고는 만들어지는 순간 검수 대기가 되어 운영자 검수 목록에
 * 오르고, 승인되면 곧바로 게시된다(BE `Job.reviewStatus`·`approveReview`). 쓰다 만 공고를 서버에
 * 저장하면 그대로 검수에 들어가므로, 새 공고는 `공고 등록` 을 누르기 전까지 서버에 보내지 않는다.
 *
 * 키를 계정마다 나눈다. 한 브라우저를 여러 기업 계정이 쓰면 다른 계정의 초안이 보이면 안 된다.
 * 로그아웃해도 지우지 않는다 — 세션이 만료되어 로그인 화면으로 밀려난 사람이 쓰던 공고를 잃는다.
 *
 * 저장소를 읽고 쓰는 일은 실패할 수 있다(시크릿 창, 용량 초과, 막힌 사이트 데이터). 실패하면
 * 읽기는 `null`, 쓰기는 `null` 을 돌려주고 화면이 그 사실을 말한다.
 */
export type CompanyPostDraftKind = 'jobs' | 'bootcamps';

export interface CompanyPostDraft<T> {
  values: T;
  /** 저장한 시각(ISO 문자열). */
  savedAt: string;
}

const draftKey = (kind: CompanyPostDraftKind, userId: number) =>
  `ogonggo.web.companyPostDraft.${kind}.${userId}`;

export function readCompanyPostDraft<T>(
  kind: CompanyPostDraftKind,
  userId: number,
): CompanyPostDraft<T> | null {
  try {
    const raw = localStorage.getItem(draftKey(kind, userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CompanyPostDraft<T>>;
    if (!parsed || typeof parsed.savedAt !== 'string' || typeof parsed.values !== 'object') {
      return null;
    }
    return parsed as CompanyPostDraft<T>;
  } catch {
    return null;
  }
}

/** 저장한 시각을 돌려준다. 저장하지 못했으면 `null` 이다. */
export function writeCompanyPostDraft<T>(
  kind: CompanyPostDraftKind,
  userId: number,
  values: T,
): string | null {
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      draftKey(kind, userId),
      JSON.stringify({ values, savedAt } satisfies CompanyPostDraft<T>),
    );
    return savedAt;
  } catch {
    return null;
  }
}

export function clearCompanyPostDraft(kind: CompanyPostDraftKind, userId: number): void {
  try {
    localStorage.removeItem(draftKey(kind, userId));
  } catch {
    // 지우지 못한 초안은 다음에 폼을 열 때 이어쓰기로 다시 보일 뿐이다.
  }
}

/** `10월 20일 14:32`. 이어쓰기 안내와 자동 저장 표시가 같은 모양을 쓴다. */
export function formatDraftSavedAt(savedAt: string): string {
  const date = new Date(savedAt);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hours}:${minutes}`;
}
