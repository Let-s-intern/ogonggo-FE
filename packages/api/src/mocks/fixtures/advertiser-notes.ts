import type { AdminAdvertiserNoteResponse } from '../../advertiser-notes';

/**
 * 광고주 어드민 메모 목의 저장소(이슈 #573). 브라우저에서는 `localStorage` 에 적어 새로고침해도 남긴다(배너 목과 같다).
 */

const STORAGE_KEY = 'ogonggo.mock.admin.advertiserNotes';

const SEED: AdminAdvertiserNoteResponse[] = [
  {
    id: 1,
    advertiserId: 1,
    title: '12월 홈 상단 배너 소재 일정',
    content: '소재는 11월 25일까지 메일로 받기로 함.\n결제는 소재 확인 뒤 12월 첫 주.',
    authorName: '관리자',
    createdAt: '2026-11-04T14:20:00',
    updatedAt: '2026-11-04T14:20:00',
  },
  {
    id: 2,
    advertiserId: 1,
    title: '첫 통화',
    content: '광고 문의 12번으로 연락. 공고 상세 자리 위주로 관심.',
    authorName: '관리자',
    createdAt: '2026-10-20T10:05:00',
    updatedAt: '2026-10-20T10:05:00',
  },
];

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): AdminAdvertiserNoteResponse[] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AdminAdvertiserNoteResponse[];
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return SEED.map((note) => ({ ...note }));
}

export const advertiserNoteStore: { notes: AdminAdvertiserNoteResponse[] } = { notes: load() };

export function saveAdvertiserNotes(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(advertiserNoteStore.notes));
  } catch {
    // 메모리에는 남는다.
  }
}
