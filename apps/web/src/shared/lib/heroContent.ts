export type HeroScreen = 'jobs' | 'bootcamps' | 'side-studies' | 'concerns';

/** 헤드라인 한 조각. `accent`가 있으면 강조색으로 그린다(지금은 jobs의 "딱!"·"쏙!"뿐이다). */
export interface HeroSegment {
  text: string;
  accent?: boolean;
  /** 강조 조각을 살짝 돌려 띄운다. 목업에서 "딱!"만 그렇고 "쏙!"은 똑바로 서 있다. */
  tilted?: boolean;
}

export interface HeroTheme {
  /** 박스 배경 이미지(`public/hero/`). 흐릿한 원형 블롭이 이미지 안에 들어 있다. */
  backgroundImage: string;
  /** 배지 pill 배경·글자색. 돋보기 아이콘도 글자색을 따른다. */
  badgeBg: string;
  badgeText: string;
}

export interface HeroConfig {
  badge: string;
  /** 줄 단위 배열. 각 줄은 강조 여부가 다른 조각들의 배열이다. */
  lines: HeroSegment[][];
  theme: HeroTheme;
}

/**
 * 배경 이미지가 아직 없는 화면에 까는 단색. `HomeHero` 는 `backgroundImage` 를 `url(...)` 에 넣어 그리므로
 * 한 칸짜리 SVG 를 data URL 로 만들어 넘기면 같은 자리에서 단색이 된다 — 이미지가 오면 `/hero/<이름>.png`
 * 한 줄로 바꾼다.
 */
function solidBackground(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="${color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * 히어로 네 화면의 문구·색. v8 목업(`docs/asset/v8 히어로/`)에서 배경은 PNG 그대로 쓰고,
 * 배지와 헤드라인은 같은 폴더의 SVG(글자가 윤곽선으로 변환돼 있다)에서 색과 크기를 읽어
 * 코드로 옮겼다 — 문구가 이미지 안에 있으면 검색 봇이 `<h1>`을 읽지 못한다.
 *
 * `tokens.css`에 있는 색(`blue-100`·`blue-500`·`gray-600`)은 토큰으로 쓰고, 민트 두 색과
 * 틸 글자색은 토큰에 스케일이 없어 목업의 hex를 그대로 쓴다.
 */
export const HERO_CONTENT: Record<HeroScreen, HeroConfig> = {
  jobs: {
    badge: '지원해볼 만한 공고만 엄선했어요',
    lines: [
      [{ text: '커리어 여정에 ' }, { text: '딱!', accent: true, tilted: true }, { text: ' 맞는' }],
      [{ text: '채용공고만 ' }, { text: '쏙!', accent: true }, { text: ' 보여드려요' }],
    ],
    theme: {
      backgroundImage: '/hero/jobs.png',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-500',
    },
  },
  bootcamps: {
    badge: '부트캠프 · KDT · 무료 교육까지',
    lines: [[{ text: '실무를 배울 수 있는' }], [{ text: '교육만 골라 모았어요' }]],
    theme: {
      backgroundImage: '/hero/bootcamps.png',
      badgeBg: 'bg-[#BBEDD8]',
      badgeText: 'text-[#009C89]',
    },
  },
  'side-studies': {
    badge: '사이드 프로젝트 · 스터디 모집 게시판',
    lines: [[{ text: '혼자 말고,' }], [{ text: '함께할 사람을 찾아보세요' }]],
    theme: {
      backgroundImage: '/hero/side-studies.png',
      badgeBg: 'bg-[#D1F3E5]',
      badgeText: 'text-gray-600',
    },
  },
  /**
   * `docs/asset/v13 취준고민/목록.webp`. 시안의 초록 배경 이미지는 아직 받지 못해 시안 오른쪽 면의
   * 연한 민트(`#EBFAF2`) 단색으로 둔다. 배지 바탕은 시안 그대로(`#D1F3E6`)이고, 글자는 시안의 옅은
   * 초록이 이 바탕에서 읽히지 않아 `오공고 답변` 배지와 같은 `emerald-700` 으로 둔다.
   */
  concerns: {
    badge: '공고부터 면접까지, 취준생들의 이야기를 살펴보세요.',
    lines: [[{ text: '취업 준비하다 막히는 순간' }], [{ text: '여기서 물어보세요' }]],
    theme: {
      backgroundImage: solidBackground('#EBFAF2'),
      badgeBg: 'bg-[#D1F3E6]',
      badgeText: 'text-emerald-700',
    },
  },
};

/**
 * `HeroSkeleton`이 자리를 잡는 높이(px). 목업 배경 PNG의 높이다 — 부트캠프·사이드스터디가
 * 308, 채용공고만 강조 글자("딱!"·"쏙!")가 커서 328이다. 스켈레톤은 목록 두 화면과 홈이
 * 같이 쓰므로 둘 중 많은 쪽인 308을 둔다.
 */
export const HERO_HEIGHT = 308;
