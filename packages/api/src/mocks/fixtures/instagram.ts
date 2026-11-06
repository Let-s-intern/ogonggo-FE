import type {
  AdminInstagramAccountResponse,
  AdminInstagramAdResponse,
  AdminInstagramFormatResponse,
} from '../../instagram';

/**
 * 인스타그램 광고 목의 저장소(이슈 #573). 계정·게재 유형·인스타 광고 세 가지다. 어드민 인스타 핸들러(`../admin/instagram.ts`),
 * 계약 핸들러(이어 둔 수), 캘린더 핸들러가 같이 본다. 브라우저에서는 `localStorage` 에 적어 새로고침해도 남긴다(배너 목과 같다).
 */

/** 저장하는 값. 광고 수와 광고주·계약·계정·유형 요약은 응답할 때 붙인다. */
export type InstagramAccountRecord = Omit<AdminInstagramAccountResponse, 'adCount'>;
export type InstagramFormatRecord = Omit<AdminInstagramFormatResponse, 'adCount'>;
export type InstagramAdRecord = Omit<
  AdminInstagramAdResponse,
  'advertiser' | 'contract' | 'account' | 'format'
>;

const ACCOUNTS_KEY = 'ogonggo.mock.admin.instagramAccounts';
const FORMATS_KEY = 'ogonggo.mock.admin.instagramFormats';
const ADS_KEY = 'ogonggo.mock.admin.instagramAds';
const SEED_TIME = '2026-11-06T09:00:00';

/**
 * 웹 커뮤니티 화면(`apps/web/src/views/community/model/content.ts`)에 나오는 우리 계정 다섯 개. 프로필 이미지도 그 화면의 것을
 * 웹 경로로 쓴다.
 */
const SEED_ACCOUNTS: InstagramAccountRecord[] = [
  {
    handle: 'letscareer.job',
    displayName: '렛츠커리어 오공고',
    profileUrl: 'https://www.instagram.com/letscareer.job',
    profileImageUrl: '/community/instagram-job-profile-ogonggo.jpg',
    memo: '채용공고·직무 인사이트',
  },
  {
    handle: 'letscareer.official',
    displayName: '렛츠커리어 공식',
    profileUrl: 'https://www.instagram.com/letscareer.official',
    profileImageUrl: '/community/instagram-official-profile.jpg',
    memo: '매일 오전 10시 취준 소식',
  },
  {
    handle: 'letscareer.univ',
    displayName: '렛츠커리어 대외활동',
    profileUrl: 'https://www.instagram.com/letscareer.univ/',
    profileImageUrl: '/community/instagram-univ-profile.jpg',
    memo: '대외활동·공모전',
  },
  {
    handle: 'letscareer.qna',
    displayName: '렛츠커리어 QNA',
    profileUrl: 'https://www.instagram.com/letscareer.qna',
    profileImageUrl: '/community/instagram-qna-profile.jpg',
    memo: null,
  },
  {
    handle: 'letscareer.gongchae',
    displayName: '렛츠커리어 공채',
    profileUrl: 'https://www.instagram.com/letscareer.gongchae/',
    profileImageUrl: '/community/instagram-gongchae-profile.jpg',
    memo: '신입 공채 일정',
  },
].map((account, index) => ({
  ...account,
  id: index + 1,
  enabled: true,
  createdAt: SEED_TIME,
  updatedAt: SEED_TIME,
}));

const SEED_FORMATS: InstagramFormatRecord[] = [
  {
    name: '피드 게시물',
    description: '이미지 한 장 게시물. 피드에 계속 남는다.',
    defaultPrice: 300_000,
    accountIds: [],
  },
  {
    name: '릴스(숏츠)',
    description: '세로 영상. 광고주가 준 영상이나 우리가 만든 영상을 올린다.',
    defaultPrice: 500_000,
    accountIds: [],
  },
  {
    name: '스토리',
    description: '24시간 노출. 링크 스티커를 붙일 수 있다.',
    defaultPrice: 100_000,
    accountIds: [],
  },
  {
    name: '하이라이트 고정',
    description: '스토리를 프로필 하이라이트에 정한 기간 동안 고정한다.',
    defaultPrice: 200_000,
    accountIds: [],
  },
  {
    name: '캐러셀',
    description: '여러 장 넘겨 보는 게시물. 카드 뉴스 형식.',
    defaultPrice: 350_000,
    // 카드 뉴스를 만드는 계정만 받는다(시드 예시).
    accountIds: [1, 2, 5],
  },
].map((format, index) => ({
  ...format,
  id: index + 1,
  enabled: true,
  displayOrder: index + 1,
  createdAt: SEED_TIME,
  updatedAt: SEED_TIME,
}));

/**
 * 광고주 id 는 `./advertisers.ts` 의 것(1 그로우랩, 2 코드스테이션, 100104 회원). 그로우랩 11월 계약(1번)에 둘을 잇는다.
 * 예정·게시 완료·취소, 하루짜리·기간 있는 것이 하나씩은 보이게 둔다.
 */
const SEED_ADS: InstagramAdRecord[] = [
  {
    id: 1,
    advertiserId: 1,
    contractId: 1,
    accountId: 1,
    formatId: 2,
    postDate: '2026-11-04',
    endDate: null,
    status: 'PUBLISHED',
    postUrl: 'https://www.instagram.com/reel/growlab-1104/',
    creativeMemo: '그로우랩 데이터 분석 부트캠프 15초 영상. 첫 문구 "문과도 SQL"',
    adminMemo: '오후 7시 게시',
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 2,
    advertiserId: 1,
    contractId: 1,
    accountId: 2,
    formatId: 3,
    postDate: '2026-11-12',
    endDate: '2026-11-13',
    status: 'SCHEDULED',
    postUrl: null,
    creativeMemo: '링크 스티커: 그로우랩 신청 페이지',
    adminMemo: null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 3,
    advertiserId: 100104,
    contractId: null,
    accountId: 5,
    formatId: 5,
    postDate: '2026-11-18',
    endDate: null,
    status: 'SCHEDULED',
    postUrl: null,
    creativeMemo: '하반기 공채 일정 카드 뉴스 6장',
    adminMemo: '소재 11.14 까지 받기로 함',
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 4,
    advertiserId: 2,
    contractId: null,
    accountId: 3,
    formatId: 4,
    postDate: '2026-11-09',
    endDate: '2026-11-22',
    status: 'SCHEDULED',
    postUrl: null,
    creativeMemo: null,
    adminMemo: null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: 5,
    advertiserId: 2,
    contractId: null,
    accountId: 4,
    formatId: 1,
    postDate: '2026-11-03',
    endDate: null,
    status: 'CANCELED',
    postUrl: null,
    creativeMemo: null,
    adminMemo: '광고주 요청으로 취소',
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
];

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load<T>(key: string, seed: T[]): T[] {
  try {
    const raw = storage()?.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T[];
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return structuredClone(seed);
}

export const instagramStore: {
  accounts: InstagramAccountRecord[];
  formats: InstagramFormatRecord[];
  ads: InstagramAdRecord[];
} = {
  accounts: load(ACCOUNTS_KEY, SEED_ACCOUNTS),
  formats: load(FORMATS_KEY, SEED_FORMATS),
  ads: load(ADS_KEY, SEED_ADS),
};

export function saveInstagram(): void {
  try {
    storage()?.setItem(ACCOUNTS_KEY, JSON.stringify(instagramStore.accounts));
    storage()?.setItem(FORMATS_KEY, JSON.stringify(instagramStore.formats));
    storage()?.setItem(ADS_KEY, JSON.stringify(instagramStore.ads));
  } catch {
    // 메모리에는 남는다.
  }
}
