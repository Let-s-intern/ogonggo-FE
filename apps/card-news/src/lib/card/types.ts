/**
 * 카드뉴스 한 벌을 그리는 데 필요한 값. 편집 화면이 들고 있다가 렌더 API(`/api/render`)에 그대로
 * 보낸다. 서버는 이 값만 보고 그린다 — 공고를 다시 읽지 않는다.
 */

export type CardSizeId = 'post' | 'square' | 'story';

export interface CardSize {
  label: string;
  width: number;
  height: number;
}

/** 인스타그램이 자르지 않고 받는 크기. 예시 카드는 피드 4:5 다. */
export const CARD_SIZES: Record<CardSizeId, CardSize> = {
  post: { label: '피드 4:5', width: 1080, height: 1350 },
  square: { label: '정사각 1:1', width: 1080, height: 1080 },
  story: { label: '스토리 9:16', width: 1080, height: 1920 },
};

export const CARD_SIZE_IDS = Object.keys(CARD_SIZES) as CardSizeId[];

/** 한 벌은 세 장이다 — 공고 요약, 자격·우대 요건, 프로필 링크 안내. */
export const SLIDE_COUNT = 3;
export const SLIDE_LABELS = ['1. 공고 요약', '2. 자격·우대 요건', '3. 프로필 안내'] as const;

export interface CardSection {
  /** 검은 칩에 들어가는 제목(`채용 직무`, `마감 기한`). */
  label: string;
  /** 점 목록. 빈 줄은 그리지 않는다. */
  items: string[];
}

export interface CardProfile {
  handle: string;
  name: string;
  posts: string;
  followers: string;
  following: string;
  /** 여러 줄. 줄마다 한 줄씩 그린다. */
  bio: string;
}

export interface CardContent {
  /** 왼쪽 위 칩. */
  badge: string;
  /**
   * 큰 제목. 줄은 `\n` 으로 나눈다. `*단어*` 는 검은 상자, `~단어~` 는 강조색 글자다
   * (`./markup.ts`).
   */
  headline: string;
  /** 1장의 섹션(채용 직무·마감 기한·담당 업무). */
  summarySections: CardSection[];
  /** 1장 맨 아래 작은 안내. 비우면 그리지 않는다. */
  note: string;
  /** 2장의 섹션(자격 요건·우대 요건). */
  detailSections: CardSection[];
  ctaHeadline: string;
  ctaSub: string;
  profile: CardProfile;
}

export type BackgroundKind = 'solid' | 'gradient' | 'image';

export interface CardTheme {
  background: {
    kind: BackgroundKind;
    color: string;
    /** 그라데이션의 아래쪽 색. */
    color2: string;
    /** 배경 이미지(data URL). 색 위에 `imageOpacity` 로 얹는다. */
    imageDataUrl?: string;
    imageOpacity: number;
  };
  textColor: string;
  /** `*단어*` 상자와 섹션 칩의 바탕색. */
  boxColor: string;
  boxTextColor: string;
  /** `~단어~` 의 글자색. */
  accentColor: string;
  /** 로고 뒤에 흰 판을 깐다. 바탕을 로고 색으로 칠하면 로고가 묻히는 것을 막는다. */
  logoPlate: boolean;
}

export interface CardSpec {
  content: CardContent;
  theme: CardTheme;
  /** 기업 로고(data URL). 없으면 회사명을 글자로 쓴다. */
  logoDataUrl?: string;
  companyName: string;
}

export interface RenderRequest {
  spec: CardSpec;
  slide: number;
  size: CardSizeId;
}
