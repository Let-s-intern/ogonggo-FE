import type {
  AdminAdvertiserResponse,
  AdvertiserAdCounts,
  AdvertiserContractTotals,
  AdvertiserSummary,
} from '../../advertisers';
import { COMPANY_MEMBER_FIXTURES } from './admin-member';
import { LEGACY_MEMO_TITLE, advertiserNoteStore, saveAdvertiserNotes } from './advertiser-notes';

/**
 * 광고주 목(이슈 #573). 목록은 세 곳을 합친다.
 *
 * - 비즈니스 회원: 회원 픽스처(`./admin-member.ts`)에서 만든다. id 는 `MEMBER_ID_OFFSET + 사용자 id` 로 고정해 다른
 *   광고주와 겹치지 않게 한다. 백엔드는 광고주 표에 회원을 이어 두거나(회원 id 연결) 회원에서 바로 읽어도 된다.
 * - 광고 문의로 들어온 비회원 기업: 이 브랜치에는 광고 문의 목이 없어 몇 곳을 시드로 둔다(`adInquiryId` 가 있다).
 * - 운영자가 직접 더한 비회원 기업: `POST` 로 늘어난다. 브라우저에서는 `localStorage` 에 남긴다.
 */

/** 저장하는 광고주. 광고 수(`AdvertiserAdCounts`)는 저장하지 않고 응답할 때 배너·광고 공고에서 센다(`../admin/advertisers.ts`). */
export type AdvertiserRecord = Omit<
  AdminAdvertiserResponse,
  keyof AdvertiserAdCounts | keyof AdvertiserContractTotals
>;

const MEMBER_ID_OFFSET = 100_000;
const STORAGE_KEY = 'ogonggo.mock.admin.advertisers';

const SEED: AdvertiserRecord[] = [
  {
    id: 1,
    name: '그로우랩',
    type: 'NON_MEMBER',
    source: 'AD_INQUIRY',
    adInquiryId: 12,
    contactName: '정하늘',
    contactEmail: 'haneul@growlab.example.com',
    contactPhone: '010-2345-6789',
  },
  {
    id: 2,
    name: '코드스테이션',
    type: 'NON_MEMBER',
    source: 'AD_INQUIRY',
    adInquiryId: 15,
    contactName: '김도윤',
    contactEmail: 'doyoon@codestation.example.com',
    contactPhone: '010-3456-7890',
  },
  {
    id: 3,
    name: '새싹(서울시)',
    type: 'NON_MEMBER',
    source: 'MANUAL',
  },
];

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * 예전 저장 값의 한 칸짜리 `memo` 를 어드민 메모 한 건으로 옮기고 지운다(2026-11-06 사용자). 같은 광고주에 같은 내용의
 * `광고주 등록 메모` 가 이미 있으면 다시 만들지 않는다. 백엔드도 같은 이전을 한 번 해야 한다(백엔드 요청 문서 "어드민 메모").
 */
function migrateLegacyMemos(records: (AdvertiserRecord & { memo?: string })[]): AdvertiserRecord[] {
  let moved = false;
  const result = records.map(({ memo, ...record }) => {
    const content = memo?.trim();
    if (
      content &&
      !advertiserNoteStore.notes.some(
        (note) => note.advertiserId === record.id && note.content === content,
      )
    ) {
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
      advertiserNoteStore.notes.push({
        id: Math.max(0, ...advertiserNoteStore.notes.map((note) => note.id)) + 1,
        advertiserId: record.id,
        title: LEGACY_MEMO_TITLE,
        content,
        authorName: '관리자',
        createdAt: now,
        updatedAt: now,
      });
      moved = true;
    }
    return record;
  });
  if (moved) {
    saveAdvertiserNotes();
  }
  return result;
}

function load(): AdvertiserRecord[] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) {
      const records = migrateLegacyMemos(JSON.parse(raw) as AdvertiserRecord[]);
      storage()?.setItem(STORAGE_KEY, JSON.stringify(records));
      return records;
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return SEED.map((advertiser) => ({ ...advertiser }));
}

/** 비회원 광고주(광고 문의·직접 추가). 회원 광고주는 회원 픽스처에서 그때그때 만든다. */
export const nonMemberAdvertiserStore: { advertisers: AdvertiserRecord[] } = {
  advertisers: load(),
};

export function saveAdvertisers(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(nonMemberAdvertiserStore.advertisers));
  } catch {
    // 메모리에는 남는다.
  }
}

/** 탈퇴하지 않은 비즈니스 회원을 광고주로. */
function memberAdvertisers(): AdvertiserRecord[] {
  return COMPANY_MEMBER_FIXTURES.filter((member) => member.status !== 'WITHDRAWN').map(
    (member) => ({
      id: MEMBER_ID_OFFSET + member.id,
      name: member.companyName,
      type: 'MEMBER',
      source: 'COMPANY_MEMBER',
      companyMemberUserId: member.id,
      contactName: member.managerName,
      contactEmail: member.managerEmail,
    }),
  );
}

/** 합친 목록. 회원이 먼저, 그다음 비회원이 등록 순서대로다. */
export function allAdvertisers(): AdvertiserRecord[] {
  return [...memberAdvertisers(), ...nonMemberAdvertiserStore.advertisers];
}

export function findAdvertiser(id: number | null | undefined): AdvertiserRecord | undefined {
  return id === null || id === undefined
    ? undefined
    : allAdvertisers().find((advertiser) => advertiser.id === id);
}

/** 응답에 붙이는 요약. 지워졌거나 없으면 `null` 이다. */
export function advertiserSummary(id: number | null | undefined): AdvertiserSummary | null {
  const advertiser = findAdvertiser(id);
  return advertiser ? { id: advertiser.id, name: advertiser.name, type: advertiser.type } : null;
}
