export type HeroScreen = 'jobs' | 'bootcamps' | 'side-studies';

/** 헤드라인 한 조각. `accent`가 있으면 강조색으로 그린다(지금은 jobs의 "딱!"·"쏙!"뿐이다). */
export interface HeroSegment {
  text: string;
  accent?: boolean;
}

export interface HeroTheme {
  /** 박스 배경 그라디언트. */
  background: string;
  /** 배지 pill 배경·글자색. */
  badgeBg: string;
  badgeText: string;
  /** 배경에 흐릿하게 깔리는 블롭 색. */
  blob: string;
}

export interface HeroConfig {
  badge: string;
  /** 줄 단위 배열. 각 줄은 강조 여부가 다른 조각들의 배열이다. */
  lines: HeroSegment[][];
  theme: HeroTheme;
}

/**
 * 히어로 세 화면의 문구·색. v3 목업(`docs/asset/v3 변경사항/hero/`)에서 배경·배지·헤드라인이
 * 합성된 PNG 한 장이던 것을, 벡터 소스가 없어 손으로 다시 코드로 옮긴 것이다 — 흐릿한 원형
 * 블롭까지는 재현하지만, 하단에 아주 옅게 깔린 마스코트 실루엣은 옮기지 않았다.
 *
 * 민트/틸 색은 `tokens.css`에 스케일이 없다. `packages/ui`의 `Badge`(`success` 톤)가 같은
 * 이유로 이미 Tailwind 기본 팔레트(`emerald-*`)를 그대로 쓰고 있어 그 관례를 따른다 — 여기서
 * 새 토큰을 만들면 같은 초록인데 출처가 둘로 갈린다. jobs의 강조색은 새로 고르지 않고 기존
 * 시맨틱 토큰 `--color-success`(Tailwind `emerald-500`과 같은 값)를 쓰는 `text-success`다.
 */
export const HERO_CONTENT: Record<HeroScreen, HeroConfig> = {
  jobs: {
    badge: '지원해볼 만한 공고만 엄선했어요',
    lines: [
      [{ text: '커리어 여정에 ' }, { text: '딱!', accent: true }, { text: ' 맞는' }],
      [{ text: '채용공고만 ' }, { text: '쏙!', accent: true }, { text: ' 보여드려요' }],
    ],
    theme: {
      background: 'bg-gradient-to-br from-blue-50 via-white to-blue-100',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700',
      blob: 'bg-blue-300',
    },
  },
  bootcamps: {
    badge: '부트캠프 · KDT · 무료 교육까지',
    lines: [[{ text: '실무를 배울 수 있는' }], [{ text: '교육만 골라 모았어요' }]],
    theme: {
      background: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      blob: 'bg-emerald-300',
    },
  },
  'side-studies': {
    badge: '사이드 프로젝트 · 스터디 모집 게시판',
    lines: [[{ text: '혼자 말고,' }], [{ text: '함께할 사람을 찾아보세요' }]],
    theme: {
      background: 'bg-gradient-to-br from-blue-50 via-white to-emerald-50',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-blue-800',
      blob: 'bg-blue-200',
    },
  },
};

/**
 * `HeroSkeleton`이 자리를 잡는 높이(px). 세 화면 모두 배지 한 줄 + 헤드라인 두 줄로 구조가
 * 같아져 화면별로 다른 값을 둘 이유가 없다 — PNG 시절엔 이미지 비율이 갈려서 홈만 20px 더
 * 높았다.
 */
export const HERO_HEIGHT = 288;
