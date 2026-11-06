import type {
  AdminAdChannelFormatResponse,
  AdminAdChannelResponse,
  AdminChannelAdResponse,
} from '../../ad-channels';

/**
 * 채널 광고 목의 저장소(이슈 #573). 채널·게재 유형·채널 광고 세 가지다. 어드민 채널 핸들러(`../admin/ad-channels.ts`), 계약
 * 핸들러(이어 둔 수), 캘린더 핸들러가 같이 본다. 브라우저에서는 `localStorage` 에 적어 새로고침해도 남긴다(배너 목과 같다).
 *
 * 처음에는 인스타그램만 있어 `instagram*` 키에 적었다. 그 키가 남은 브라우저는 처음 읽을 때 새 키로 옮기고(인스타 계정·유형·
 * 광고는 플랫폼 `INSTAGRAM` 이 된다), 오픈채팅 시드 채널·유형을 뒤에 붙인 뒤 옛 키를 지운다(`migrateInstagram`).
 */

/** 저장하는 값. 광고 수와 광고주·계약·채널·유형 요약, 광고의 플랫폼은 응답할 때 붙인다. */
export type AdChannelRecord = Omit<AdminAdChannelResponse, 'adCount'>;
export type AdChannelFormatRecord = Omit<AdminAdChannelFormatResponse, 'adCount'>;
export type ChannelAdRecord = Omit<
  AdminChannelAdResponse,
  'advertiser' | 'contract' | 'platform' | 'channel' | 'format'
>;

const CHANNELS_KEY = 'ogonggo.mock.admin.adChannels';
const FORMATS_KEY = 'ogonggo.mock.admin.adChannelFormats';
const ADS_KEY = 'ogonggo.mock.admin.channelAds';
/** 인스타 광고 때의 키. 옮긴 뒤 지운다. */
const LEGACY_KEYS = {
  accounts: 'ogonggo.mock.admin.instagramAccounts',
  formats: 'ogonggo.mock.admin.instagramFormats',
  ads: 'ogonggo.mock.admin.instagramAds',
} as const;
const SEED_TIME = '2026-11-06T09:00:00';

const seedChannel = (
  channel: Pick<
    AdChannelRecord,
    'platform' | 'name' | 'handle' | 'url' | 'profileImageUrl' | 'memo'
  >,
): Omit<AdChannelRecord, 'id'> => ({
  ...channel,
  memberCount: null,
  enabled: true,
  createdAt: SEED_TIME,
  updatedAt: SEED_TIME,
});

/**
 * 웹 커뮤니티 화면(`apps/web/src/views/community/model/content.ts`)에 나오는 우리 인스타그램 계정 다섯 개. 프로필 이미지도 그
 * 화면의 것을 웹 경로로 쓴다.
 */
const SEED_INSTAGRAM_CHANNELS = [
  seedChannel({
    platform: 'INSTAGRAM',
    handle: 'letscareer.job',
    name: '렛츠커리어 오공고',
    url: 'https://www.instagram.com/letscareer.job',
    profileImageUrl: '/community/instagram-job-profile-ogonggo.jpg',
    memo: '채용공고·직무 인사이트',
  }),
  seedChannel({
    platform: 'INSTAGRAM',
    handle: 'letscareer.official',
    name: '렛츠커리어 공식',
    url: 'https://www.instagram.com/letscareer.official',
    profileImageUrl: '/community/instagram-official-profile.jpg',
    memo: '매일 오전 10시 취준 소식',
  }),
  seedChannel({
    platform: 'INSTAGRAM',
    handle: 'letscareer.univ',
    name: '렛츠커리어 대외활동',
    url: 'https://www.instagram.com/letscareer.univ/',
    profileImageUrl: '/community/instagram-univ-profile.jpg',
    memo: '대외활동·공모전',
  }),
  seedChannel({
    platform: 'INSTAGRAM',
    handle: 'letscareer.qna',
    name: '렛츠커리어 QNA',
    url: 'https://www.instagram.com/letscareer.qna',
    profileImageUrl: '/community/instagram-qna-profile.jpg',
    memo: null,
  }),
  seedChannel({
    platform: 'INSTAGRAM',
    handle: 'letscareer.gongchae',
    name: '렛츠커리어 공채',
    url: 'https://www.instagram.com/letscareer.gongchae/',
    profileImageUrl: '/community/instagram-gongchae-profile.jpg',
    memo: '신입 공채 일정',
  }),
];

/** 같은 화면의 직무별 오픈채팅방 넷(`OPEN_CHAT_ROOM_CARDS`). 방 이름과 참여 주소가 그 화면과 같다. */
const SEED_KAKAO_CHANNELS = [
  seedChannel({
    platform: 'KAKAO_OPENCHAT',
    handle: null,
    name: '세일즈 채용공고 큐레이션',
    url: 'https://open.kakao.com/o/gZgMRSFh',
    profileImageUrl: null,
    memo: '영업·세일즈 직무 채용공고',
  }),
  seedChannel({
    platform: 'KAKAO_OPENCHAT',
    handle: null,
    name: '마케팅 채용공고 큐레이션',
    url: 'https://open.kakao.com/o/g9JmRSFh',
    profileImageUrl: null,
    memo: '마케팅 직무 채용공고·취업 정보',
  }),
  seedChannel({
    platform: 'KAKAO_OPENCHAT',
    handle: null,
    name: '인사/HR/경영관리 채용공고 큐레이션',
    url: 'https://open.kakao.com/o/ghzwTSFh',
    profileImageUrl: null,
    memo: '인사·HR·경영관리 직무 채용 소식',
  }),
  seedChannel({
    platform: 'KAKAO_OPENCHAT',
    handle: null,
    name: '기획/운영 채용공고 큐레이션',
    url: 'https://open.kakao.com/o/gPDpSSFh',
    profileImageUrl: null,
    memo: '기획·서비스 운영 직무 채용공고',
  }),
];

type SeedFormat = Pick<
  AdChannelFormatRecord,
  'platform' | 'name' | 'description' | 'defaultPrice' | 'channelIds'
>;

const SEED_INSTAGRAM_FORMATS: SeedFormat[] = [
  {
    platform: 'INSTAGRAM',
    name: '피드 게시물',
    description: '이미지 한 장 게시물. 피드에 계속 남는다.',
    defaultPrice: 300_000,
    channelIds: [],
  },
  {
    platform: 'INSTAGRAM',
    name: '릴스(숏츠)',
    description: '세로 영상. 광고주가 준 영상이나 우리가 만든 영상을 올린다.',
    defaultPrice: 500_000,
    channelIds: [],
  },
  {
    platform: 'INSTAGRAM',
    name: '스토리',
    description: '24시간 노출. 링크 스티커를 붙일 수 있다.',
    defaultPrice: 100_000,
    channelIds: [],
  },
  {
    platform: 'INSTAGRAM',
    name: '하이라이트 고정',
    description: '스토리를 프로필 하이라이트에 정한 기간 동안 고정한다.',
    defaultPrice: 200_000,
    channelIds: [],
  },
  {
    platform: 'INSTAGRAM',
    name: '캐러셀',
    description: '여러 장 넘겨 보는 게시물. 카드 뉴스 형식.',
    defaultPrice: 350_000,
    // 카드 뉴스를 만드는 계정만 받는다(시드 예시).
    channelIds: [1, 2, 5],
  },
];

/** 오픈채팅방에 올리는 방식. 단가는 예시 값이다. */
const SEED_KAKAO_FORMATS: SeedFormat[] = [
  {
    platform: 'KAKAO_OPENCHAT',
    name: '일반 글',
    description: '방에 홍보 글을 한 번 올린다. 공지로 올리지 않아 대화에 밀려 올라간다.',
    defaultPrice: 50_000,
    channelIds: [],
  },
  {
    platform: 'KAKAO_OPENCHAT',
    name: '이미지 글',
    description: '광고주가 준 이미지와 글을 함께 한 번 올린다.',
    defaultPrice: 70_000,
    channelIds: [],
  },
  {
    platform: 'KAKAO_OPENCHAT',
    name: '공지 등록',
    description: '글을 방 공지로 올린다. 다음 공지를 올리면 내려간다.',
    defaultPrice: 100_000,
    channelIds: [],
  },
  {
    platform: 'KAKAO_OPENCHAT',
    name: '공지 고정(기간)',
    description: '정한 기간 동안 방 공지로 고정한다. 노출 끝 날을 적는다.',
    defaultPrice: 200_000,
    channelIds: [],
  },
];

function withIds<T>(items: T[], firstId: number): (T & { id: number })[] {
  return items.map((item, index) => ({ ...item, id: firstId + index }));
}

function toFormatRecords(items: SeedFormat[], firstId: number): AdChannelFormatRecord[] {
  return items.map((format, index) => ({
    ...format,
    id: firstId + index,
    enabled: true,
    displayOrder: index + 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  }));
}

/** 인스타 1~5, 오픈채팅 6~9. */
const SEED_CHANNELS: AdChannelRecord[] = withIds(
  [...SEED_INSTAGRAM_CHANNELS, ...SEED_KAKAO_CHANNELS],
  1,
);

/** 인스타 1~5, 오픈채팅 6~9. 순서는 플랫폼마다 1부터다. */
const SEED_FORMATS: AdChannelFormatRecord[] = [
  ...toFormatRecords(SEED_INSTAGRAM_FORMATS, 1),
  ...toFormatRecords(SEED_KAKAO_FORMATS, 6),
];

const seedAd = (
  ad: Omit<ChannelAdRecord, 'createdAt' | 'updatedAt' | 'postUrl' | 'creativeMemo' | 'adminMemo'> &
    Partial<Pick<ChannelAdRecord, 'postUrl' | 'creativeMemo' | 'adminMemo'>>,
): ChannelAdRecord => ({
  postUrl: null,
  creativeMemo: null,
  adminMemo: null,
  ...ad,
  createdAt: SEED_TIME,
  updatedAt: SEED_TIME,
});

/**
 * 광고주 id 는 `./advertisers.ts` 의 것(1 그로우랩, 2 코드스테이션, 100104 회원). 그로우랩 11월 계약(1번)에 셋을 잇는다.
 * 예정·게시 완료·취소, 하루짜리·기간 있는 것, 인스타·오픈채팅이 하나씩은 보이게 둔다.
 */
const SEED_ADS: ChannelAdRecord[] = [
  seedAd({
    id: 1,
    advertiserId: 1,
    contractId: 1,
    channelId: 1,
    formatId: 2,
    postDate: '2026-11-04',
    endDate: null,
    status: 'PUBLISHED',
    postUrl: 'https://www.instagram.com/reel/growlab-1104/',
    creativeMemo: '그로우랩 데이터 분석 부트캠프 15초 영상. 첫 문구 "문과도 SQL"',
    adminMemo: '오후 7시 게시',
  }),
  seedAd({
    id: 2,
    advertiserId: 1,
    contractId: 1,
    channelId: 2,
    formatId: 3,
    postDate: '2026-11-12',
    endDate: '2026-11-13',
    status: 'SCHEDULED',
    creativeMemo: '링크 스티커: 그로우랩 신청 페이지',
  }),
  seedAd({
    id: 3,
    advertiserId: 100104,
    contractId: null,
    channelId: 5,
    formatId: 5,
    postDate: '2026-11-18',
    endDate: null,
    status: 'SCHEDULED',
    creativeMemo: '하반기 공채 일정 카드 뉴스 6장',
    adminMemo: '소재 11.14 까지 받기로 함',
  }),
  seedAd({
    id: 4,
    advertiserId: 2,
    contractId: null,
    channelId: 3,
    formatId: 4,
    postDate: '2026-11-09',
    endDate: '2026-11-22',
    status: 'SCHEDULED',
  }),
  seedAd({
    id: 5,
    advertiserId: 2,
    contractId: null,
    channelId: 4,
    formatId: 1,
    postDate: '2026-11-03',
    endDate: null,
    status: 'CANCELED',
    adminMemo: '광고주 요청으로 취소',
  }),
  seedAd({
    id: 6,
    advertiserId: 1,
    contractId: 1,
    channelId: 7,
    formatId: 6,
    postDate: '2026-11-10',
    endDate: null,
    status: 'SCHEDULED',
    creativeMemo: '그로우랩 마케팅 데이터 부트캠프 모집 글. 신청 링크 끝에 붙이기',
  }),
  seedAd({
    id: 7,
    advertiserId: 2,
    contractId: null,
    channelId: 6,
    formatId: 9,
    postDate: '2026-11-16',
    endDate: '2026-11-20',
    status: 'SCHEDULED',
    adminMemo: '공지 고정은 방장 계정으로',
  }),
];

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function read<T>(key: string): T[] | null {
  try {
    const raw = storage()?.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}

interface LegacyAccount {
  id: number;
  handle: string;
  displayName: string;
  profileUrl: string;
  profileImageUrl: string | null;
  enabled: boolean;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}
type LegacyFormat = Omit<AdChannelFormatRecord, 'platform' | 'channelIds'> & {
  accountIds: number[];
};
type LegacyAd = Omit<ChannelAdRecord, 'channelId'> & { accountId: number };

interface Stored {
  channels: AdChannelRecord[];
  formats: AdChannelFormatRecord[];
  ads: ChannelAdRecord[];
}

const nextId = (items: { id: number }[]) => Math.max(0, ...items.map((item) => item.id)) + 1;

/**
 * 인스타 광고 키를 채널 키로 옮긴다. 계정·유형·광고의 id 는 그대로 두어(계약의 `instagramFormatIds` 도 그대로 맞는다) 인스타
 * 플랫폼으로 옮기고, 오픈채팅 시드 채널·유형은 그 뒤 id 로 붙인다. 오픈채팅 시드 광고는 붙이지 않는다 — 옮긴 데이터와 이어지는
 * 계약이 없다. 옛 키가 하나도 없으면 `null`.
 */
function migrateInstagram(): Stored | null {
  const accounts = read<LegacyAccount>(LEGACY_KEYS.accounts);
  const formats = read<LegacyFormat>(LEGACY_KEYS.formats);
  const ads = read<LegacyAd>(LEGACY_KEYS.ads);
  if (!accounts && !formats && !ads) {
    return null;
  }
  const channels: AdChannelRecord[] = (
    accounts ?? SEED_CHANNELS.filter((channel) => channel.platform === 'INSTAGRAM')
  ).map((account) =>
    'platform' in account
      ? account
      : {
          id: account.id,
          platform: 'INSTAGRAM',
          name: account.displayName,
          handle: account.handle,
          url: account.profileUrl,
          profileImageUrl: account.profileImageUrl,
          memberCount: null,
          enabled: account.enabled,
          memo: account.memo,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        },
  );
  channels.push(...withIds(SEED_KAKAO_CHANNELS, nextId(channels)));

  const migratedFormats: AdChannelFormatRecord[] = (
    formats ?? SEED_FORMATS.filter((format) => format.platform === 'INSTAGRAM')
  ).map((format) => {
    if ('platform' in format) {
      return format as AdChannelFormatRecord;
    }
    const { accountIds, ...rest } = format;
    return { ...rest, platform: 'INSTAGRAM', channelIds: accountIds };
  });
  migratedFormats.push(...toFormatRecords(SEED_KAKAO_FORMATS, nextId(migratedFormats)));

  const migratedAds: ChannelAdRecord[] = (
    ads ?? SEED_ADS.filter((ad) => ad.channelId <= SEED_INSTAGRAM_CHANNELS.length)
  ).map((ad) => {
    if ('channelId' in ad) {
      return ad as ChannelAdRecord;
    }
    const { accountId, ...rest } = ad;
    return { ...rest, channelId: accountId };
  });
  return { channels, formats: migratedFormats, ads: migratedAds };
}

function load(): Stored {
  const channels = read<AdChannelRecord>(CHANNELS_KEY);
  const formats = read<AdChannelFormatRecord>(FORMATS_KEY);
  const ads = read<ChannelAdRecord>(ADS_KEY);
  if (channels || formats || ads) {
    return {
      channels: channels ?? structuredClone(SEED_CHANNELS),
      formats: formats ?? structuredClone(SEED_FORMATS),
      ads: ads ?? structuredClone(SEED_ADS),
    };
  }
  const migrated = migrateInstagram();
  if (migrated) {
    // 새 키에 적은 뒤에만 옛 키를 지운다. 적지 못했으면 옛 키가 남아 다음에 다시 옮긴다.
    if (persist(migrated)) {
      try {
        for (const key of Object.values(LEGACY_KEYS)) storage()?.removeItem(key);
      } catch {
        // 옛 키가 남아도 새 키를 먼저 읽는다.
      }
    }
    return migrated;
  }
  return {
    channels: structuredClone(SEED_CHANNELS),
    formats: structuredClone(SEED_FORMATS),
    ads: structuredClone(SEED_ADS),
  };
}

/** 적었으면 `true`. 저장소가 없거나 막혔으면 `false` 이고 메모리에만 남는다. */
function persist(data: Stored): boolean {
  const target = storage();
  if (!target) {
    return false;
  }
  try {
    target.setItem(CHANNELS_KEY, JSON.stringify(data.channels));
    target.setItem(FORMATS_KEY, JSON.stringify(data.formats));
    target.setItem(ADS_KEY, JSON.stringify(data.ads));
    return true;
  } catch {
    return false;
  }
}

export const adChannelStore: Stored = load();

export function saveAdChannels(): void {
  void persist(adChannelStore);
}
