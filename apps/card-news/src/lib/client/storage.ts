import type { CardContent, CardSettings } from '../card/types';

/**
 * 편집 중인 카드를 이 브라우저에 공고별로 남긴다. 서버에는 저장하지 않는다 — 로그인이 없는
 * 앱이라 서버에 두면 주소를 아는 누구나 고칠 수 있다.
 *
 * 로고는 남기지 않는다. data URL 이 커서 저장소 한도(약 5MB)를 금방 넘긴다.
 */
// v2: 시안 여러 개로 바뀌며 테마 대신 공용 설정을 남긴다. v1 편집본은 읽지 않는다.
const KEY_PREFIX = 'ogonggo.card-news.draft.v2.';

export interface SavedCard {
  content: CardContent;
  settings: CardSettings;
  savedAt: string;
}

export function loadCard(jobId: number): SavedCard | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${jobId}`);
    return raw ? (JSON.parse(raw) as SavedCard) : null;
  } catch {
    return null;
  }
}

export function saveCard(jobId: number, content: CardContent, settings: CardSettings): void {
  const saved: SavedCard = {
    content,
    settings,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(`${KEY_PREFIX}${jobId}`, JSON.stringify(saved));
  } catch {
    // 저장소가 막혔거나 가득 찼다. 편집은 그대로 이어진다.
  }
}

export function clearCard(jobId: number): void {
  try {
    localStorage.removeItem(`${KEY_PREFIX}${jobId}`);
  } catch {
    // 위와 같다.
  }
}
