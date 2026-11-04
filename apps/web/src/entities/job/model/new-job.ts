/** 등록 뒤 이만큼 지나면 `NEW` 를 뗀다. 크롤러가 하루에 한 번 수집하므로 다음 수집분이 올 즈음이다. */
const NEW_JOB_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * 등록 24시간 안 공고인지(2026-11-04 사용자: "다음 배치가 들어올 즈음, 하루가 지나면 뗀다").
 *
 * 등록 시각(`registeredAt`)은 사용자 공고 응답에 아직 없다(백엔드 요청). 없으면 `NEW` 를 달지 않는다.
 */
export function isNewJob(registeredAt: string | undefined, now: number = Date.now()): boolean {
  if (!registeredAt) {
    return false;
  }
  const time = Date.parse(registeredAt);
  return !Number.isNaN(time) && now - time < NEW_JOB_WINDOW_MS;
}
