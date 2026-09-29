import { parseLocalDate } from '@/shared/lib/localDate';

/** 공유할 공고의 종류. 토스트 문구와 캘린더 일정 제목이 종류마다 다르다. */
export type SharePostingKind = 'jobs' | 'bootcamps' | 'side-studies';

export interface SharePosting {
  kind: SharePostingKind;
  title: string;
  /** 공유 창 맨 위 카드의 이름. 채용·부트캠프는 회사명, 사이드·스터디는 작성자 이름이다. */
  organizationName: string;
  /** 사이트 안 경로(`/jobs/12`). 주소는 누르는 순간의 `window.location.origin` 에 붙인다. */
  path: string;
  /** 모집 마감 일시. 없으면(상시모집) 캘린더에 넣을 날이 없어 그 버튼을 감춘다. */
  recruitmentEndAt?: string;
}

const KIND_LABEL: Record<SharePostingKind, string> = {
  jobs: '채용공고',
  bootcamps: '부트캠프',
  'side-studies': '모집글',
};

export function shareKindLabel(kind: SharePostingKind): string {
  return KIND_LABEL[kind];
}

export function shareUrl(posting: SharePosting): string {
  return new URL(posting.path, window.location.origin).toString();
}

function compactDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${month}${day}`;
}

/**
 * 마감일을 하루 종일 일정으로 여는 Google Calendar 주소. 끝 날짜는 다음 날이다 — 구글이 종일
 * 일정의 끝을 그 날을 뺀 값으로 읽는다. 시각이 아니라 날짜만 쓰는 것은 공고마다 마감 시각이
 * 있거나 없어서다. 마감일이 없으면 `null`.
 */
export function googleCalendarUrl(posting: SharePosting, url: string): string | null {
  if (!posting.recruitmentEndAt) {
    return null;
  }
  const end = parseLocalDate(posting.recruitmentEndAt);
  const next = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[${KIND_LABEL[posting.kind]} 마감] ${posting.title}`,
    dates: `${compactDate(end)}/${compactDate(next)}`,
    details: url,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** 공개 공유 주소가 있는 서비스. 새 창으로 연다. */
export function naverBlogShareUrl(url: string, title: string): string {
  const params = new URLSearchParams({ url, title });
  return `https://blog.naver.com/openapi/share?${params.toString()}`;
}

export function linkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url }).toString()}`;
}

export function xShareUrl(url: string, title: string): string {
  return `https://twitter.com/intent/tweet?${new URLSearchParams({ url, text: title }).toString()}`;
}
