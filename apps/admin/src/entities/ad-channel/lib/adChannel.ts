import type { AdChannelPlatform, ChannelAdStatus } from '@ogonggo/api/src/ad-channels';

export const CHANNEL_AD_STATUS_BADGES: Record<
  ChannelAdStatus,
  { label: string; tone: 'main' | 'success' | 'neutral' }
> = {
  SCHEDULED: { label: '예정', tone: 'main' },
  PUBLISHED: { label: '게시 완료', tone: 'success' },
  CANCELED: { label: '취소', tone: 'neutral' },
};

/**
 * 플랫폼마다 다른 이름과 문구. `label` 은 계약 상품·고르기 칸, `short` 는 좁은 칸(캘린더 막대, 표의 플랫폼 칸)에 쓴다.
 *
 * 오픈채팅 글에는 게시물 주소가 없다. 그래서 `postUrl` 칸을 인스타그램은 `게시물 주소`, 오픈채팅은 `확인 링크`(올린 글의 캡처
 * 이미지 링크 등)로 부르고 비워도 되게 둔다.
 */
export const PLATFORM_COPY: Record<
  AdChannelPlatform,
  {
    label: string;
    short: string;
    /** 채널 하나를 부르는 말. */
    channelNoun: string;
    /** 플랫폼을 붙여 부르는 말(모달 제목). */
    channelTitle: string;
    urlLabel: string;
    urlPlaceholder: string;
    postUrlLabel: string;
    postUrlHint: string;
    postUrlPlaceholder: string;
    memberLabel: string;
  }
> = {
  INSTAGRAM: {
    label: '인스타그램',
    short: '인스타',
    channelNoun: '계정',
    channelTitle: '인스타그램 계정',
    urlLabel: '계정 주소',
    urlPlaceholder: 'https://www.instagram.com/',
    postUrlLabel: '게시물 주소',
    postUrlHint: '게시한 뒤 적습니다.',
    postUrlPlaceholder: 'https://www.instagram.com/p/',
    memberLabel: '팔로워 수',
  },
  KAKAO_OPENCHAT: {
    label: '카카오톡 오픈채팅',
    short: '오픈채팅',
    channelNoun: '오픈채팅방',
    channelTitle: '카카오톡 오픈채팅방',
    urlLabel: '오픈채팅 주소',
    urlPlaceholder: 'https://open.kakao.com/o/',
    postUrlLabel: '확인 링크',
    postUrlHint:
      '오픈채팅 글은 주소가 없습니다. 올린 글의 캡처 이미지 링크 등을 적고, 없으면 비워 둡니다.',
    postUrlPlaceholder: 'https://',
    memberLabel: '참여 인원',
  },
};

/** 인스타그램 계정 표시. 서버는 `@` 를 뺀 값을 준다. */
export const instagramHandle = (handle: string) => `@${handle}`;

/** 채널 한 줄 표시. 인스타그램은 `@계정`, 오픈채팅은 방 이름. */
export function channelLabel(channel: { handle: string | null; name: string }): string {
  return channel.handle ? instagramHandle(channel.handle) : channel.name;
}

/** 입력한 계정 이름에서 앞의 `@` 와 공백을 뗀다. */
export const normalizeHandle = (value: string) => value.trim().replace(/^@+/, '');

/** 서버와 같은 규칙. 영문·숫자·마침표·밑줄 30자까지. */
export const isInstagramHandle = (value: string) => /^[A-Za-z0-9._]{1,30}$/.test(value);

export const isHttpUrl = (value: string) => /^https?:\/\/\S+$/.test(value);

/** 계약 상품 표시(`인스타그램 · 릴스(숏츠)`, `카카오톡 오픈채팅 · 공지 등록`). 지워진 유형은 id 로 적는다. */
export function channelProductLabel(
  format: { platform: AdChannelPlatform; name: string } | undefined,
  formatId: number,
): string {
  return format ? `${PLATFORM_COPY[format.platform].label} · ${format.name}` : `유형 ${formatId}번`;
}

const dot = (date: string) => date.replaceAll('-', '.');

/** 게시 예정일과 노출 끝. `2026.11.12` 또는 `2026.11.12 ~ 11.22`(해가 다르면 끝도 해를 적는다). */
export function formatChannelAdDates(ad: { postDate: string; endDate: string | null }): string {
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
 * 채널 광고가 차지하는 날을 계약 기간과 같은 KST 시각 `[startAt, endAt)` 으로. 계약 기간 밖 경고(`isOutsideContract`)에
 * 넘긴다.
 */
export function channelAdPeriod(ad: { postDate: string; endDate: string | null }): {
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
