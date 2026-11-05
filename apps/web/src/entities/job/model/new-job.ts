import { withKstOffset } from '@/shared/lib/kstDateTime';

/** 등록 뒤 이만큼 지나면 `NEW` 를 뗀다. 크롤러가 하루에 한 번 수집하므로 다음 수집분이 올 즈음이다. */
const NEW_JOB_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * `NEW` 배지를 보일지. 2026-11-04 에 UI/UX 가 바뀔 수 있어 숨겼다가, 2026-11-05 새 시안(주황 `N`)으로 다시 보인다.
 * 다시 숨길 때는 `false` 로만 바꾼다.
 */
const SHOW_NEW_BADGE = true;

/**
 * 등록 24시간 안 공고인지(2026-11-04 사용자: "다음 배치가 들어올 즈음, 하루가 지나면 뗀다").
 *
 * 등록 시각(`registeredAt`)은 사용자 공고 응답의 필수 칸이다. 칸이 없으면 `NEW` 를 달지 않는다. 백엔드 시각은 시간대가 없는 한국 시간이라 서버(UTC)에서 그려도 어긋나지 않게 `+09:00` 으로 읽는다.
 */
export function isNewJob(registeredAt: string | undefined, now: number = Date.now()): boolean {
  if (!SHOW_NEW_BADGE || !registeredAt) {
    return false;
  }
  const time = Date.parse(withKstOffset(registeredAt)!);
  return !Number.isNaN(time) && now - time < NEW_JOB_WINDOW_MS;
}
