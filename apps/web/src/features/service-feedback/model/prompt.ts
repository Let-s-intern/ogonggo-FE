/**
 * 채용공고 상세를 볼 때 가끔 화면 아래에 의견을 요청하는 창을 띄울지 정한다.
 *
 * 기준은 이 브라우저에만 남긴다(`localStorage`). 서버가 알 필요가 없는 편의 기능이고, 저장이 막힌
 * 브라우저(시크릿 창 등)에서는 창을 띄우지 않는 쪽으로 떨어진다 — 매번 뜨는 것보다 안 뜨는 편이 낫다.
 *
 * - 상세를 `VIEWS_BEFORE_PROMPT` 번 볼 때마다 한 번 띄운다. 첫 방문자에게 바로 묻지 않는다.
 * - `다음에`·닫기를 누르면 `SNOOZE_DAYS` 동안 다시 띄우지 않는다.
 * - 의견을 보내면 `SENT_SNOOZE_DAYS` 동안 띄우지 않는다. 버튼으로 직접 보낸 것도 같다.
 */
const STORAGE_KEY = 'ogonggo.serviceFeedbackPrompt';
const VIEWS_BEFORE_PROMPT = 3;
const SNOOZE_DAYS = 7;
const SENT_SNOOZE_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

interface PromptState {
  views: number;
  /** 이 시각 전에는 띄우지 않는다(epoch ms). */
  quietUntil: number;
}

function read(): PromptState | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<PromptState>) : {};
    return { views: Number(parsed.views) || 0, quietUntil: Number(parsed.quietUntil) || 0 };
  } catch {
    return undefined;
  }
}

function write(state: PromptState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장이 막혔으면 기록 없이 지나간다. `read` 가 실패해 창도 뜨지 않는다.
  }
}

/** 채용공고 상세를 한 번 봤다고 적고, 이번에 창을 띄울지 돌려준다. */
export function recordJobViewAndCheckPrompt(now = Date.now()): boolean {
  const state = read();
  if (!state) {
    return false;
  }
  const views = state.views + 1;
  if (now < state.quietUntil || views < VIEWS_BEFORE_PROMPT) {
    write({ ...state, views });
    return false;
  }
  write({ views: 0, quietUntil: state.quietUntil });
  return true;
}

/** `다음에`·닫기. */
export function snoozePrompt(now = Date.now()) {
  write({ views: 0, quietUntil: now + SNOOZE_DAYS * DAY });
}

/** 의견을 보냈다. */
export function markFeedbackSent(now = Date.now()) {
  write({ views: 0, quietUntil: now + SENT_SNOOZE_DAYS * DAY });
}
