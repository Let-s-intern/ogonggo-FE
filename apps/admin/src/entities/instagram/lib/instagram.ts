import type { InstagramAdStatus } from '@ogonggo/api/src/instagram';

export const INSTAGRAM_AD_STATUS_BADGES: Record<
  InstagramAdStatus,
  { label: string; tone: 'main' | 'success' | 'neutral' }
> = {
  SCHEDULED: { label: '예정', tone: 'main' },
  PUBLISHED: { label: '게시 완료', tone: 'success' },
  CANCELED: { label: '취소', tone: 'neutral' },
};

/** 계정 표시. 서버는 `@` 를 뺀 값을 준다. */
export const instagramHandle = (handle: string) => `@${handle}`;

/** 입력한 계정 이름에서 앞의 `@` 와 공백을 뗀다. */
export const normalizeHandle = (value: string) => value.trim().replace(/^@+/, '');

/** 서버와 같은 규칙. 영문·숫자·마침표·밑줄 30자까지. */
export const isInstagramHandle = (value: string) => /^[A-Za-z0-9._]{1,30}$/.test(value);

export const isHttpUrl = (value: string) => /^https?:\/\/\S+$/.test(value);

/** 계약 상품 표시(`인스타그램 · 릴스(숏츠)`). 지워진 유형은 id 로 적는다. */
export function instagramProductLabel(formatName: string | undefined, formatId: number): string {
  return `인스타그램 · ${formatName ?? `유형 ${formatId}번`}`;
}

const dot = (date: string) => date.replaceAll('-', '.');

/** 게시 예정일과 노출 끝. `2026.11.12` 또는 `2026.11.12 ~ 11.22`(해가 다르면 끝도 해를 적는다). */
export function formatInstagramDates(ad: { postDate: string; endDate: string | null }): string {
  if (ad.endDate === null || ad.endDate === ad.postDate) {
    return dot(ad.postDate);
  }
  const end = ad.endDate.slice(0, 4) === ad.postDate.slice(0, 4) ? ad.endDate.slice(5) : ad.endDate;
  return `${dot(ad.postDate)} ~ ${dot(end)}`;
}

/** `YYYY-MM-DD` 에 하루를 더한다. */
function nextDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

/**
 * 인스타 광고가 차지하는 날을 계약 기간과 같은 KST 시각 `[startAt, endAt)` 으로. 계약 기간 밖 경고(`isOutsideContract`)에
 * 넘긴다.
 */
export function instagramAdPeriod(ad: { postDate: string; endDate: string | null }): {
  startAt: string | null;
  endAt: string | null;
} {
  if (!ad.postDate) {
    return { startAt: null, endAt: null };
  }
  return {
    startAt: `${ad.postDate}T00:00:00`,
    endAt: `${nextDay(ad.endDate ?? ad.postDate)}T00:00:00`,
  };
}

/** 지금의 KST 날짜와 달. */
export const kstDate = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
export const kstMonth = () => kstDate().slice(0, 7);
