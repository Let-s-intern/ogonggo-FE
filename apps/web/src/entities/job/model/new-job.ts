import { withKstOffset } from '@/shared/lib/kstDateTime';

/** 등록 뒤 이만큼 지나면 `NEW` 를 뗀다. 크롤러가 하루에 한 번 수집하므로 다음 수집분이 올 즈음이다. */
const NEW_JOB_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * `NEW` 배지를 보일지. 지금은 숨김이다 — 곧 UI/UX 가 바뀔 수 있어서 숨김(2026-11-04 사용자 요청).
 * 판정 로직과 배지 자리는 그대로 두었으니 다시 보일 때는 `true` 로만 바꾼다.
 */
const SHOW_NEW_BADGE = false;

/**
 * 등록 24시간 안 공고인지(2026-11-04 사용자: "다음 배치가 들어올 즈음, 하루가 지나면 뗀다").
 *
 * 등록 시각(`registeredAt`)은 백엔드에 필수 칸으로 구현됐고 아직 배포 전이다. 배포 전 응답처럼 칸이 없으면 `NEW` 를
 * 달지 않는다. 백엔드 시각은 시간대가 없는 한국 시간이라 서버(UTC)에서 그려도 어긋나지 않게 `+09:00` 으로 읽는다.
 */
export function isNewJob(registeredAt: string | undefined, now: number = Date.now()): boolean {
  if (!SHOW_NEW_BADGE || !registeredAt) {
    return false;
  }
  const time = Date.parse(withKstOffset(registeredAt)!);
  return !Number.isNaN(time) && now - time < NEW_JOB_WINDOW_MS;
}
