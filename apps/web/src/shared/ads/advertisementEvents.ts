import { createAdvertisementEvent, type AdvertisementEventType } from '@ogonggo/api';

const ANONYMOUS_ID_KEY = 'ogonggo.advertisement.anonymousId';
let fallbackAnonymousId: string | undefined;

/** Send a server-validated event. The API uses the authenticated member ID when a token is present. */
export function recordAdvertisementEvent(
  exposureId: number,
  eventType: AdvertisementEventType,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const idempotencyKey = createId();
  void createAdvertisementEvent(
    { exposureId, eventType, anonymousId: readAnonymousId() },
    idempotencyKey,
    { keepalive: true },
  ).catch(() => {
    // Event collection is best-effort and must not interrupt navigation or ad rendering.
    console.warn('[advertisement-events] 이벤트를 저장하지 못했습니다.');
  });
}

function readAnonymousId(): string {
  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) {
      return existing;
    }
    const generated = createId();
    window.localStorage.setItem(ANONYMOUS_ID_KEY, generated);
    return generated;
  } catch {
    fallbackAnonymousId ??= createId();
    return fallbackAnonymousId;
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
