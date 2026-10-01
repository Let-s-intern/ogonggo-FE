/**
 * 카드뉴스 한 벌을 그리는 데 필요한 값. 편집 화면이 들고 있다가 렌더 API(`/api/render`)에 시안마다
 * 보낸다. 서버는 이 값만 보고 그린다 — 공고를 다시 읽지 않는다.
 *
 * 문구(`CardContent`)와 설정(`CardSettings`)은 모든 시안이 같이 쓴다. 시안마다 다른 것은 배경과
 * 배치뿐이고, 그건 `./variants.ts` 가 정한다.
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
  /** 칩에 들어가는 제목(`채용 직무`, `마감 기한`). */
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
   * 큰 제목. 줄은 `\n` 으로 나눈다. `*단어*` 는 강조 상자, `~단어~` 는 강조색 글자다
   * (`./markup.ts`).
   */
  headline: string;
  /** 탭 카드 시안의 흰 카드 맨 위 큰 제목(`[카카오스타일] 인플루언서 마케터`). */
  roleTitle: string;
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

/**
 * 강조 상자(`*단어*`)와 섹션 칩의 색. `tint` 는 연한 브랜드색 바탕에 검은 글자(아누아·오늘의집
 * 예시), `brand` 는 브랜드색 바탕에 흰 글자(동원 예시), `custom` 은 `highlightColor` 다.
 */
export type HighlightPreset = 'tint' | 'brand' | 'black' | 'custom';

/**
 * 로고를 그리는 방식. `auto` 는 시안이 고른다 — 브랜드색 바탕에서는 흰 판 위에 원래 색, 밝은
 * 바탕에서는 원래 색 그대로. `plate` 는 늘 흰 판 위에, `mono` 는 글자색 한 색으로 칠한다.
 */
export type LogoStyle = 'auto' | 'mono' | 'original' | 'plate';

export interface CardImage {
  /** data URL. 편집 화면이 긴 변 1350px 이하 JPEG 로 줄여 둔다. */
  dataUrl: string;
  /** 0~1. 글자가 읽히도록 흐리게 깐다. */
  opacity: number;
  /**
   * 위쪽(제목 자리)과 아래쪽(목록 자리)의 평균 밝기(0~1). 편집 화면이 올릴 때 재고, 시안이 글자색을
   * 고르는 데 쓴다.
   */
  tone: { top: number; bottom: number };
}

/** 모든 시안에 같이 걸리는 설정. 한 번 바꾸면 다섯 시안이 같이 바뀐다. */
export interface CardSettings {
  /** 처음 값은 로고에서 뽑은 색이다. */
  brandColor: string;
  highlight: HighlightPreset;
  highlightColor: string;
  logoStyle: LogoStyle;
  /** 관련 이미지 시안의 배경. */
  photo?: CardImage;
  /** 건물 시안의 배경. */
  building?: CardImage;
}

/** 기업 로고. 한 색 판은 편집 화면이 캔버스로 칠해 둔다(서버는 이미지를 다시 칠하지 못한다). */
export interface CardLogo {
  original: string;
  white?: string;
  black?: string;
}

export type VariantId = 'wave' | 'watermark' | 'photo' | 'building' | 'tab';

export interface CardSpec {
  variant: VariantId;
  content: CardContent;
  settings: CardSettings;
  /** 없으면 회사명을 글자로 쓴다. */
  logo?: CardLogo;
  companyName: string;
}

export interface RenderRequest {
  spec: CardSpec;
  slide: number;
  size: CardSizeId;
  /** PNG 축척. 다운로드는 1. */
  scale?: number;
  /** `svg` 면 PNG 로 굽지 않고 SVG 를 돌려준다(미리보기). */
  format?: 'png' | 'svg';
}
