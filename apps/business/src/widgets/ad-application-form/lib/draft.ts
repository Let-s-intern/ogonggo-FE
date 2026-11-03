import { type AdApplicationFormValues, EMPTY_FORM } from '../model/form';

/**
 * 신청서 임시저장. 이 브라우저의 `localStorage` 에 둔다(서버 임시저장 API 는 요청서
 * `.claude/tasks/memos/백엔드-요청-광고-시스템-business.md` 에 적었다). 비밀번호·인증번호는 값 객체에 없어 저장되지 않는다.
 */
const KEY = 'ogonggo.business.adApplicationDraft';

export interface AdApplicationDraft {
  values: AdApplicationFormValues;
  savedAt: string;
}

export function readDraft(): AdApplicationDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdApplicationDraft;
    // 칸이 나중에 늘어도 옛 임시저장이 깨지지 않게 빈 값 위에 덮는다.
    return { savedAt: parsed.savedAt, values: { ...EMPTY_FORM, ...parsed.values } };
  } catch {
    return null;
  }
}

export function writeDraft(values: AdApplicationFormValues): string {
  const savedAt = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify({ values, savedAt }));
  return savedAt;
}

export function clearDraft(): void {
  localStorage.removeItem(KEY);
}

/** `11.03 14:20`. */
export function formatSavedAt(savedAt: string): string {
  const date = new Date(savedAt);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
