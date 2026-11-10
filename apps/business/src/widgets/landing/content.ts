/**
 * 광고 안내(랜딩) 문구와 수치. 출처는 디자인 시안 `.claude/tasks/todo/오공고 비즈니스/image.png` 다.
 * 가격·CTR·팔로워 수는 시안 값이며, 바꿀 때는 이 파일만 고친다.
 */

export const HERO_STATS = [
  { value: '월 10만명+', label: '매달 찾아오는 취준생' },
  { value: '6.7만명+', label: '인스타그램 팔로워' },
  { value: '1만명+', label: '카카오톡 오픈채팅 참여자' },
  { value: '24시간 이내', label: '광고 문의 답변' },
  { value: '48시간', label: '소재 제작부터 집행까지' },
];

export const REASONS = [
  {
    no: '01',
    eyebrow: '지원 중인',
    title: '취준생 중심 유저풀',
    /** 카드 오른쪽 아래 배경 그림(사용자 제공, 2026-11-09). */
    icon: '/landing/reasons/users.png',
    body: '렛츠커리어가 취업 준비부터 실제 지원 단계까지 함께해요. 높은 지원 의사와 완성된 서류를 갖춘 타겟에게 바로 닿아요.',
  },
  {
    no: '02',
    eyebrow: '단순 광고가 아닌',
    title: '추천하는 채널',
    icon: '/landing/reasons/thumbs-up.png',
    body: '취업 교육부터 공고 큐레이션까지 쌓아온 신뢰 덕분에, 광고 콘텐츠도 팔로워 대부분이 챙겨 봐요.',
  },
  {
    no: '03',
    eyebrow: '소재 제작까지',
    title: '48시간',
    icon: '/landing/reasons/clock.png',
    body: "공고 링크만 있으면 '카드뉴스' · '카카오톡 소재' · '오공고 해석 한 줄'까지 직접 만들어 빠르게 집행해요.",
  },
];

export interface PlacementProduct {
  id: string;
  /** 탭 이름. */
  tab: string;
  title: string;
  description: string[];
  tags: { label: string; highlight?: boolean }[];
  price: number;
  ctr: string;
  /** 광고 신청 API 의 `categories` 값. */
  category: 'JOB_POSTING' | 'BANNER';
}

export const PLACEMENTS: PlacementProduct[] = [
  {
    id: 'recommend-card',
    tab: '인기 채용공고',
    title: '오늘의 공고 추천 카드 1슬롯 노출',
    description: [
      '채용공고 홈의 상단 공고 추천 위치에 노출됩니다.',
      '일반 추천 카드와 동일한 형태로 제공되며, AD 라벨이 표시됩니다.',
    ],
    tags: [{ label: '피드 게시물' }, { label: '공고 링크' }, { label: '해석 한 줄(40자 이내)' }],
    price: 400000,
    ctr: '2.5 ~ 4%',
    category: 'JOB_POSTING',
  },
  {
    id: 'list-top-fixed',
    tab: '리스트 상단 고정 공고',
    title: '리스트 상단 고정 1슬롯 노출',
    description: [
      '직무 탭별 공고 리스트 1페이지의 상단 위치에 고정됩니다.',
      '직렬과 무관하게 노출되며, 2페이지부터 비노출됩니다.',
    ],
    tags: [
      { label: '직무당 1슬롯' },
      { label: '로고' },
      { label: '공고 링크' },
      { label: '무료 쿠폰 적용 대상', highlight: true },
    ],
    price: 300000,
    ctr: '3 ~ 5%',
    category: 'JOB_POSTING',
  },
  {
    id: 'active-hiring-card',
    tab: '적극 채용중 공고',
    title: '적극 채용중 공고 카드 1슬롯 노출',
    description: [
      '리스트 최상단 "적극 채용중" 영역에 공고 카드 4개의 슬롯 중 한 곳에 노출됩니다.',
      '일반 공고 카드와 동일한 형태로 제공되며, AD 라벨이 표시됩니다.',
    ],
    tags: [{ label: '4슬롯' }, { label: '공고 카드 자동 구성' }],
    price: 400000,
    ctr: '3 ~ 5%',
    category: 'JOB_POSTING',
  },
  {
    id: 'main-top-banner',
    tab: '메인 상단 배너',
    title: '메인 상단 배너 1슬롯 노출',
    description: [
      '적극 채용중과 채용 공고 리스트 사이에 배치된 가로 배너입니다.',
      '4개 소재가 새로고침마다 롤링됩니다.',
    ],
    tags: [{ label: '4슬롯 롤링' }, { label: 'PC 1200×120 · MO 750×200' }],
    price: 500000,
    ctr: '1 ~ 1.8%',
    category: 'BANNER',
  },
  {
    id: 'main-bottom-banner',
    tab: '메인 하단 배너',
    title: '메인 하단 배너 1슬롯 노출',
    description: [
      '리스트 끝, 페이지네이션 위 단독 배너.',
      '리스트를 끝까지 본 적극 탐색 유저에게 닿아요.',
    ],
    tags: [{ label: '1슬롯' }, { label: 'PC 1200×120 · MO 750×200' }],
    price: 300000,
    ctr: '0.8 ~ 1.5%',
    category: 'BANNER',
  },
];

type Rect = { top: number; left: number; width: number; height: number };

/** 광고가 놓이는 자리 하나. 시뮬레이터 오른쪽 리스트의 한 줄이고, `id` 는 `#id` 앵커다. */
export interface PlacementSpot {
  id: string;
  name: string;
  /** 가격·CTR·설명·태그를 가져올 상품. 없으면 아래 값을 쓰고 가격은 견적 문의로 보인다. */
  productId?: string;
  title?: string;
  description?: string[];
  tags?: string[];
  /** 스크린샷(1280×1800) 안의 영역, 이미지 크기 대비 %. */
  rect: Rect;
  /**
   * 배너 소재 자리. `push` 는 화면 사이에 끼어들어 아래를 밀어내고(가로 배너), `end` 는 끼어든 곳 아래를
   * 감춰 화면 끝처럼 보이고, `overlay` 는 빈 자리 위에 나타난다(사이드바 세로 배너).
   */
  banner?: { mode: 'push' | 'end' | 'overlay'; size: string };
  /** 스크린샷에 광고 카드가 없을 때 그 자리에 시안 카드를 그린다. */
  mockCard?: boolean;
}

/** 시뮬레이터 위쪽 탭 하나. 오늘의 공고 페이지 하나와 그 안의 광고 자리들이다. */
export interface PlacementPage {
  id: string;
  tab: string;
  url: string;
  image: string;
  imageAlt: string;
  spots: PlacementSpot[];
}

const WIDE_BANNER = { mode: 'push', size: 'PC 1200×120' } as const;

/**
 * 자리 위치는 웹의 실제 배치를 따른다: 배너는 `packages/api/src/banners.ts` 의 `BannerPlacement`,
 * 공고 카드는 `packages/api/src/ad-postings.ts` 의 `AdPostingPlacement`.
 */
export const PLACEMENT_PAGES: PlacementPage[] = [
  {
    id: 'home',
    tab: '채용공고 홈',
    url: 'ogonggo.co.kr',
    image: '/landing/jobs-list.webp',
    imageAlt: '오늘의 공고 채용공고 홈 화면',
    spots: [
      {
        id: 'recommend-card',
        name: '인기 채용공고',
        productId: 'recommend-card',
        rect: { top: 27.4, left: 10, width: 19.1, height: 20.4 },
      },
      {
        id: 'list-top-fixed',
        name: '리스트 상단 고정 공고',
        productId: 'list-top-fixed',
        rect: { top: 56.4, left: 23.9, width: 23.2, height: 17.4 },
      },
      {
        id: 'main-top-banner',
        name: '메인 상단 배너',
        productId: 'main-top-banner',
        rect: { top: 52.2, left: 3.9, width: 92.2, height: 6.6 },
        banner: WIDE_BANNER,
      },
      {
        id: 'main-bottom-banner',
        name: '메인 하단 배너',
        productId: 'main-bottom-banner',
        // 스크린샷이 목록 중간에서 끝나서, 두 번째 줄 아래를 목록 끝으로 보고 그 아래는 감춘다.
        rect: { top: 94.9, left: 3.9, width: 92.2, height: 6.6 },
        banner: { mode: 'end', size: 'PC 1200×120' },
      },
    ],
  },
  {
    id: 'bootcamps',
    tab: '교육·부트캠프',
    url: 'ogonggo.co.kr/bootcamps',
    image: '/landing/bootcamps-list.webp',
    imageAlt: '오늘의 공고 교육·부트캠프 목록 화면',
    spots: [
      {
        id: 'bootcamp-top-banner',
        name: '부트캠프 상단 배너',
        title: '부트캠프 상단 배너 1슬롯 노출',
        description: [
          '교육·부트캠프 목록 바로 위에 놓이는 가로 배너입니다.',
          '목록 첫 페이지에서만 보여요.',
        ],
        tags: ['PC 1200×120 · MO 750×200'],
        rect: { top: 25, left: 3.9, width: 92.2, height: 6.6 },
        banner: WIDE_BANNER,
      },
      {
        id: 'bootcamp-bottom-banner',
        name: '부트캠프 하단 배너',
        title: '부트캠프 하단 배너 1슬롯 노출',
        description: [
          '부트캠프 목록 끝, FOR BUSINESS 배너 위에 놓이는 가로 배너입니다.',
          '목록의 모든 페이지에서 보여요.',
        ],
        tags: ['PC 1200×120 · MO 750×200'],
        rect: { top: 89.3, left: 3.9, width: 92.2, height: 6.6 },
        banner: WIDE_BANNER,
      },
    ],
  },
  {
    id: 'calendar',
    tab: '공고 달력',
    url: 'ogonggo.co.kr/calendar',
    image: '/landing/calendar.webp',
    imageAlt: '오늘의 공고 공고 달력 화면',
    spots: [
      {
        id: 'calendar-day-card',
        name: '공고 달력 날짜별 공고',
        title: '공고 달력 날짜별 목록 노출',
        description: [
          '공고 달력에서 고른 날짜의 공고 목록 맨 앞에 노출됩니다.',
          '일반 공고 카드와 같은 모양에 광고 라벨이 표시됩니다.',
        ],
        tags: ['공고 카드 자동 구성'],
        rect: { top: 16.9, left: 72.2, width: 23.9, height: 7.4 },
      },
    ],
  },
  {
    id: 'mypage',
    tab: '마이페이지',
    url: 'ogonggo.co.kr/mypage/scraps',
    image: '/landing/mypage-scraps.webp',
    imageAlt: '오늘의 공고 마이페이지 지원 관리 보드 화면',
    spots: [
      {
        id: 'mypage-scrap-card',
        name: '마이페이지 스크랩 칸',
        title: '마이페이지 스크랩 칸 노출',
        description: [
          '마이페이지 지원 관리 보드의 채용공고 스크랩 칸 맨 앞에 노출됩니다.',
          '스크랩한 공고와 같은 카드 모양이고, 모바일 리스트 보기에는 노출되지 않아요.',
        ],
        tags: ['공고 카드 자동 구성', 'PC 보드 보기'],
        rect: { top: 24.8, left: 4.8, width: 21.9, height: 8.4 },
        mockCard: true,
      },
    ],
  },
  {
    id: 'job-detail',
    tab: '공고 상세',
    url: 'ogonggo.co.kr/jobs',
    image: '/landing/job-detail.webp',
    imageAlt: '오늘의 공고 공고 상세 화면',
    spots: [
      {
        id: 'job-detail-side-banner',
        name: '공고 상세 사이드 배너',
        title: '공고 상세 사이드 배너 1슬롯 노출',
        description: [
          '공고 상세 오른쪽 사이드바, 비슷한 공고 아래에 놓이는 세로 배너입니다.',
          '화면이 좁으면 본문 아래로 내려가 가로형으로 바뀌어요.',
        ],
        tags: ['PC 400×500 · MO 750×200'],
        rect: { top: 48.3, left: 69.5, width: 26.6, height: 23.7 },
        banner: { mode: 'overlay', size: 'PC 400×500' },
      },
    ],
  },
];

/** 수치는 `6.7만`, `3만`처럼 만 단위로 적고, 설명에는 숫자를 넣지 않는다(2026-11-10 사용자). */
export const CHANNEL_STATS = [
  { value: '6.7만+', label: '인스타그램 팔로워', sub: '메인 · 오늘의 공고 두 계정' },
  { value: '3만+', label: '렛츠커리어 월 방문자', sub: '홈페이지 기준' },
  { value: '7천+', label: '카카오톡 오픈채팅', sub: 'Q&A방 · 직무별 큐레이션방' },
  { value: '2만명+', label: '마케팅 수신 동의 유저', sub: '카카오톡 채널 · 뉴스레터' },
  { value: '2만명+', label: '누적 교육 고객', sub: '교육 프로그램 · B2B 파트너' },
];

export interface ChannelProduct {
  badge: 'SNS' | 'CRM' | 'WEB';
  title: string;
  body: string;
  tags: string[];
  specs: { label: string; value: string }[];
  images: string[];
}

export const CHANNEL_GROUPS: { id: string; title: string; products: ChannelProduct[] }[] = [
  {
    id: 'instagram',
    title: '인스타그램 광고',
    products: [
      {
        badge: 'SNS',
        title: '인스타그램 메인 계정 피드 게시물 광고',
        body: '인스타그램 메인 계정(@letscareer.official)의 피드에 콘텐츠 형태로 게시되어, 브랜드와 공고 정보를 알립니다.',
        tags: ['피드 게시물', '브랜드 인지도 · 모집 홍보'],
        specs: [
          { label: '게시 형태', value: '게시글 + 프로필 링크 2주' },
          { label: '게시 기간', value: '최초 게재일로부터 6개월' },
          { label: '예상 성과', value: '일평균 조회 3만+ · 도달 4천+' },
        ],
        images: ['/landing/insta-official-2.png', '/landing/insta-official-1.png'],
      },
      {
        badge: 'SNS',
        title: '인스타그램 오늘의 공고 계정 피드 게시물 광고',
        body: '인스타그램 오늘의 공고 계정(@letscareer.job)의 피드에 콘텐츠 형태로 게시되어, 관심사 기반의 팔로워에게 채용·교육 관련 소식을 알립니다.',
        tags: ['피드 게시물', '관심 타겟 도달'],
        specs: [
          { label: '게시 형태', value: '게시글 + 프로필 링크 2주' },
          { label: '게시 기간', value: '최초 게재일로부터 6개월' },
          { label: '예상 성과', value: '평균 조회 2~3만 · 도달 1만+' },
        ],
        images: ['/landing/insta-job-2.png', '/landing/insta-job-1.png'],
      },
      {
        badge: 'SNS',
        title: '인스타그램 스토리',
        body: '인스타그램 메인 계정 또는 오늘의 공고 계정으로(택1) 24시간동안 스토리가 세로 전체 화면에서 짧고 집중도 있게 메시지와 링크를 노출합니다.',
        tags: ['스토리', '빠른 주목 · 랜딩 유도'],
        specs: [
          { label: '게시 형태', value: '스토리 + 링크 CTA' },
          { label: '게시 기간', value: '24시간' },
          { label: '예상 성과', value: '평균 조회 1.8천 · 도달 1.5천' },
        ],
        images: ['/landing/insta-story-1.png', '/landing/insta-story-2.png'],
      },
    ],
  },
  {
    id: 'crm',
    title: 'CRM 광고',
    products: [
      {
        badge: 'CRM',
        title: '취업준비 Q&A 카카오톡 오픈채팅방',
        body: "쥬디와 신뢰 관계를 쌓아온 취업준비생 2,509명이 참여하는 '쥬디의 취업QNA방'에 홍보글을 1회 게시합니다. 채용·취업에 관심이 높은 커뮤니티에 맞춤형 메시지로 모집 소식을 전달합니다.",
        tags: ['커뮤니티 메시지', '관심 타겟에게 직접 전달'],
        specs: [
          { label: '형태', value: '카카오톡 홍보글' },
          { label: '발송', value: '2,509명 · 1회' },
        ],
        images: ['/landing/crm-qna-1.png', '/landing/crm-qna-2.png'],
      },
      {
        badge: 'CRM',
        title: '직무별 큐레이션 카카오톡 오픈채팅방',
        body: '매일 공고를 공유하며 신뢰를 쌓아온 직무별 커뮤니티에 관심사에 맞춘 메시지로 모집 정보를 소개합니다. 마케팅 · 기획/운영 · HR · 세일즈 4개 톡방에 각 1회씩 전달합니다.',
        tags: ['커뮤니티 메시지', '직무별 정밀 타겟에게 직접 전달'],
        specs: [
          { label: '형태', value: '카카오톡 홍보글 · 4개 방' },
          {
            label: '발송',
            value: '총 4,628명 (마케팅 2,030명 · 기획 1,145명 · HR 1,117명 · 세일즈 336명)',
          },
        ],
        images: ['/landing/crm-job-1.png', '/landing/crm-job-2.png'],
      },
      {
        badge: 'CRM',
        title: '카카오 채널톡 DM',
        body: '렛츠커리어 카카오 채널 친구 전체에게 이벤트·모집 소식을 메시지로 직접 전달합니다. 단기간에 많은 사람에게 소식을 알리고 싶을 때 추천합니다.',
        tags: ['채널 메시지', '정보 전달 · 클릭 유도'],
        specs: [
          { label: '형태', value: '카카오 채널 DM' },
          { label: '발송', value: '3,375명 · 1회' },
        ],
        images: ['/landing/crm-dm-1.png'],
      },
    ],
  },
  {
    id: 'web',
    title: 'WEB 광고',
    products: [
      {
        badge: 'WEB',
        title: '렛츠커리어 홈페이지 메인 배너',
        body: '렛츠커리어 홈페이지 메인 상단 배너(PC · MO)에 노출합니다. 렛츠커리어의 첫 페이지에서 모든 유저에게 정보를 알립니다.',
        tags: ['웹 배너', '사이트 방문자 노출'],
        specs: [
          { label: '노출 규격', value: 'PC 1120×180 · MO 320×180' },
          { label: '게시 기간', value: '1주' },
          { label: '예상 규모', value: '홈 페이지 · MAU 3만+' },
        ],
        images: ['/landing/web-banner-1.png', '/landing/web-banner-2.png'],
      },
    ],
  },
];

export const COMBO_CARDS = [
  {
    eyebrow: '<오늘의 공고> 지면',
    title: '지원 직전 유저에게 도달',
    body: '취준생이 공고를 탐색하는 순간 자연스럽게 노출되어요. 관심도가 높은 잠재 지원자의 클릭과 지원을 유도할 수 있어 전환율이 높아요.',
  },
  {
    eyebrow: '<렛츠커리어> 채널',
    title: '넓게 알리고 관심을 만들기',
    body: '인스타그램 피드는 1회 게시만으로도 약 1만 계정 도달·3만 조회를 기록해요. 공고에 대한 첫 관심을 만들고, 잠재 지원자에게 자연스럽게 브랜드를 알릴 수 있어요.',
  },
  {
    eyebrow: '<오늘의 공고> 지면 + <렛츠커리어> 채널',
    title: '인지 → 추천 → 지원',
    body: '인스타그램·오픈채팅에서 공고를 접한 취준생에게 오늘의 공고의 추천 카드와 상단 고정 영역에서 한 번 더 노출되어요. 반복 노출로 공고 인지도를 높이고, 지원 전환을 유도해요.',
    best: true,
  },
];

export const PACKAGE = {
  name: '지원자 빨리 모으기',
  caption: '빠른 유입이 필요할 때 추천(채용 시 마감 · 마감 임박)',
  items: [
    {
      channel: '렛츠커리어',
      title: '인스타그램 스토리 2계정 + 직무 톡방 4개',
      body: '문의 후 당일 집행 가능 · 링크 클릭 CTA',
      when: 'D-day',
    },
    {
      channel: '오늘의공고',
      title: 'A2 리스트 상단 고정 + A6 달력 하이라이트',
      body: '직무 탭 첫 카드 + 마감일 달력 핀으로 반복 노출',
      when: '1주',
    },
    {
      channel: '렛츠커리어',
      title: '카카오 채널 DM',
      body: '현재 약 3,375명에게 마감 리마인드',
      when: '마감 3일 전',
    },
  ],
  steps: [
    { title: '톡방·스토리로 알리기', body: '직무 톡방 4,628명 + 스토리로 공고를 처음 접해요' },
    { title: '오공고에서 다시 만나기', body: '직무 탭을 열면 상단 고정 카드, 달력에선 마감일 핀' },
    { title: 'DM 리마인드 → 지원', body: '마감 3일 전 DM이 마지막 한 번을 밀어줘요' },
  ],
  effect: '기대 효과 · 사례 기준 링크 유입 100건+ · 24분 만에 톡방 홍보 시작 (레브잇)',
};

/** 시안의 로고 줄에서 이름이 온전히 보이는 회사만 옮겼다. 로고 파일을 받으면 이미지로 바꾼다. */
/** 로고 파일은 `public/landing/partners/`. 크기는 파일의 실제 픽셀이고, 화면에서는 높이만 맞춘다. */
export const PARTNERS = [
  { name: '토스페이먼츠', logo: '/landing/partners/tosspayments.webp', width: 591, height: 96 },
  { name: 'LEVIT', logo: '/landing/partners/levit.webp', width: 451, height: 96 },
  { name: '모두닥', logo: '/landing/partners/modoodoc.webp', width: 197, height: 51 },
  { name: 'InBody', logo: '/landing/partners/inbody.svg', width: 806, height: 240 },
  { name: '달라스윗', logo: '/landing/partners/dalasweet.webp', width: 333, height: 63 },
  { name: 'KT', logo: '/landing/partners/kt.svg', width: 118, height: 96 },
  { name: '한컴', logo: '/landing/partners/hancom.webp', width: 510, height: 85 },
  { name: '강남언니', logo: '/landing/partners/gangnamunni.webp', width: 170, height: 33 },
];

export const PROCESS = [
  {
    no: '01',
    title: '접수',
    body: '예산 · 목표 · 관심 구좌만 알려주세요. 가입 없이 3분이면 끝나고, 24시간 이내 세일즈 매니저가 연락드려요.',
  },
  {
    no: '02',
    title: '확정',
    body: '오늘의 공고와 렛츠커리어를 묶은 예산 맞춤 제안서를 2~3안으로 받고, 전자계약과 입금으로 확정해요.',
  },
  {
    no: '03',
    title: '집행',
    body: '확정한 주 월요일부터 게재돼요. 오늘의 공고 카드 지면은 공고 정보로 자동 구성되고, 인스타그램·톡방 소재는 렛츠커리어가 만들어요.',
  },
  {
    no: '04',
    title: '종료',
    body: '노출, 클릭, 지원 클릭을 집계해 종료 7일 뒤 성과 리포트를 드려요.',
  },
];

export const FAQ = [
  {
    q: '소재를 직접 만들어야 하나요?',
    a: '아니요. 오늘의 공고 카드형 지면은 공고 정보로 자동 구성되고, 인스타그램·톡방 소재는 렛츠커리어가 만들어요. 배너만 이미지를 주시면 돼요.',
  },
  {
    q: '예산이 적어도 상담할 수 있나요?',
    a: '네. 50만 원 미만도 가능해요. 예산 범위만 알려주시면 그 안에서 효율이 가장 좋은 조합을 제안드려요.',
  },
  {
    q: '오늘의 공고 지면만 따로 할 수 있나요?',
    a: '네. 광고 신청에서 오늘의 공고 지면만 골라도 돼요.',
  },
  {
    q: '어떤 공고든 광고할 수 있나요?',
    a: '정규직·인턴 공고를 우선해요. 급여·근무지·기간이 불명확하면 상담 때 세일즈 매니저가 보완할 점을 안내드려요.',
  },
  {
    q: '처음이면 무료로 해볼 수 있나요?',
    a: '신규 기업회원에게 리스트 상단 고정 1주 무료 쿠폰을 드려요.',
  },
];

/**
 * 고객 사례 4건. 소개서 17~20쪽을 옮겼다(2026-11-10 사용자). 이미지는 그 쪽의 실제 집행 소재를 잘라 낸 것이다
 * (`public/landing/cases`). 처음에는 모자이크했다가 회사명이 이미 드러나 가릴 이유가 없어 뺐다.
 */
export const CASES = [
  {
    image: '/landing/cases/tosspayments.jpg',
    kind: '채용공고 광고',
    company: '토스페이먼츠',
    title: '세일즈 계약직 채용',
    situation: '마감이 촉박해 직무 적합도 높은 지원자가 빠르게 필요했어요.',
    channels: ['오늘의 공고 인스타그램 피드·스토리', '직무 큐레이션 톡방 4곳'],
  },
  {
    image: '/landing/cases/levit.jpg',
    kind: '채용공고 광고',
    company: '레브잇',
    title: '콘텐츠 마케팅 인턴 채용',
    situation: '채용 시 마감이라 빠른 유입이 필요했어요. 문의 24분 만에 톡방 홍보를 시작했어요.',
    channels: ['마케팅·세일즈 톡방', '인스타 2개 계정 스토리'],
  },
  {
    image: '/landing/cases/modoodoc.jpg',
    kind: '채용공고 광고',
    company: '모두닥',
    title: '전환형 인턴 채용',
    situation: '지원자 수와 함께 후보자의 적합도까지 확보해야 했어요.',
    channels: ['오늘의 공고 인스타그램 피드 1회'],
  },
  {
    image: '/landing/cases/inbody.jpg',
    kind: '채용공고 광고',
    company: '인바디',
    title: 'GBD 통합 직무 인턴',
    situation: '채용 시 마감이라 빠르게, 적합한 지원자를 모아야 했어요.',
    channels: ['오늘의 공고 인스타그램 피드 1회'],
  },
];
