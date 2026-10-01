import type { AiDraft } from '../ai/draft';
import type { CardContent, CardProfile } from './types';

/** 카드 편집에 필요한 공고 값. 공개 공고 상세(`GET /api/v1/jobs/{jobId}`)에서 고른다. */
export interface CardJob {
  id: number;
  companyName: string;
  title: string;
  recruitmentType: 'PERIOD' | 'ALWAYS_OPEN';
  recruitmentEndAt?: string;
  sourceUrl?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Deadline = Pick<CardJob, 'recruitmentType' | 'recruitmentEndAt'>;

interface EndDate {
  year: string;
  month: string;
  day: string;
  weekday: string;
  /** 시각이 없거나 자정이면 `undefined`. */
  time?: string;
}

/** 마감일을 나눠 읽는다. 상시 채용이면 `'always'`, 형식을 모르면 원문 그대로. */
function readEnd(job: Deadline): EndDate | 'always' | string {
  if (job.recruitmentType === 'ALWAYS_OPEN' || !job.recruitmentEndAt) {
    return 'always';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(job.recruitmentEndAt);
  if (!match) {
    return job.recruitmentEndAt;
  }
  const [, year = '', month = '', day = '', hour, minute] = match;
  const weekday = WEEKDAYS[new Date(Number(year), Number(month) - 1, Number(day)).getDay()] ?? '';
  const time = hour && !(hour === '00' && minute === '00') ? `${hour}:${minute}` : undefined;
  return { year, month, day, weekday, time };
}

/**
 * 마감 기한 문구. `2026.10.11 (일) 23:59`, 시각이 없으면 `2026.10.02 (금) 마감`, 상시 채용은
 * `채용 시 마감` 이다. AI 에 맡기지 않는다 — 날짜를 틀리면 안 되는 칸이다.
 */
export function deadlineText(job: Deadline): string {
  const end = readEnd(job);
  if (end === 'always') {
    return '채용 시 마감';
  }
  if (typeof end === 'string') {
    return end;
  }
  const date = `${end.year}.${end.month}.${end.day} (${end.weekday})`;
  return end.time ? `${date} ${end.time}` : `${date} 마감`;
}

/**
 * 인스타 본문의 마감 줄. `~ 9월 20일(일) 23:59`, 시각이 없으면 `~ 9월 20일(일)`, 상시 채용은
 * `채용 시 마감`. 카드의 마감 기한처럼 AI 에 맡기지 않는다.
 */
export function captionDeadline(job: Deadline): string {
  const end = readEnd(job);
  if (end === 'always') {
    return '채용 시 마감';
  }
  if (typeof end === 'string') {
    return end;
  }
  const date = `${Number(end.month)}월 ${Number(end.day)}일(${end.weekday})`;
  return end.time ? `~ ${date} ${end.time}` : `~ ${date}`;
}

export const DEFAULT_PROFILE: CardProfile = {
  handle: 'letscareer.job',
  name: '오공고 | 오늘의 추천 채용공고',
  posts: '483',
  followers: '2.8만',
  following: '7',
  bio: '📍 문과 취준생이 놓치면 안되는 채용공고\n🔥 매일 오후 1시, 채용 관련 정보를 알려드려요\n➰ 꼼꼼히 분석하여 이해하기 쉽게 정리해요',
};

export function contentFromDraft(
  job: CardJob,
  draft: AiDraft,
  previous?: CardContent,
): CardContent {
  return {
    badge: previous?.badge ?? '오늘의 공고 속보',
    headline: draft.headline,
    roleTitle: draft.roles[0] ?? job.title,
    summarySections: [
      { label: '채용 직무', items: draft.roles.length ? draft.roles : [job.title] },
      { label: '마감 기한', items: [deadlineText(job)] },
      { label: '담당 업무', items: draft.responsibilities },
    ],
    note: draft.note,
    detailSections: [
      { label: '자격 요건', items: draft.qualifications },
      { label: '우대 요건', items: draft.preferred },
    ],
    ctaHeadline: previous?.ctaHeadline ?? '자세한 공고 링크는\n*프로필 링크*에서!',
    ctaSub: previous?.ctaSub ?? '*팔로우*하고\n매일 문과생을 위한 채용공고 확인하기!',
    profile: previous?.profile ?? DEFAULT_PROFILE,
    caption: draft.caption,
  };
}

/** 편집 중인 카드를 AI 에 "지금 초안" 으로 넘길 모양으로. */
export function draftFromContent(content: CardContent): AiDraft {
  const items = (sections: CardContent['summarySections'], label: string) =>
    sections.find((section) => section.label === label)?.items ?? [];
  return {
    headline: content.headline,
    roles: items(content.summarySections, '채용 직무'),
    responsibilities: items(content.summarySections, '담당 업무'),
    qualifications: items(content.detailSections, '자격 요건'),
    preferred: items(content.detailSections, '우대 요건'),
    note: content.note,
    caption: content.caption ?? '',
  };
}
