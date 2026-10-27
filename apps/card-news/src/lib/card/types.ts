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
  /** 인스타그램 게시물 본문. 카드에는 그리지 않고 편집 화면에서 복사한다. */
  caption: string;
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
  /** 0~1. 시안마다 이 값에 자기 배율을 곱해 쓴다(연한 시안은 더 흐리게). */
  opacity: number;
  /** 가로÷세로. 썸네일 카드가 이미지를 자르지 않고 통째로 보여 주는 데 쓴다. */
  aspect: number;
  /** 편집 화면에 "지금 들어간 뒷배경" 으로 보일 출처(`공고 원문 대표 이미지`, `직접 올린 이미지`). */
  label?: string;
}

/** 모든 시안에 같이 걸리는 설정. 한 번 바꾸면 모든 시안이 같이 바뀐다. */
export interface CardSettings {
  /** 처음 값은 로고에서 뽑은 색이다. */
  brandColor: string;
  highlight: HighlightPreset;
  highlightColor: string;
  logoStyle: LogoStyle;
  /** 썸네일 시안들의 이미지. 처음엔 공고 원문 대표 이미지이고, 사람이 바꾸거나 올릴 수 있다. */
  photo?: CardImage;
  /**
   * 자동으로 고른 글자 크기에 곱하는 배율(0.7~1.5). 제목은 큰 제목·직무명·3장 제목과 부제, 본문은
   * 칩·목록·안내에 건다. 예전 편집본에는 없다 — 없으면 1 이다.
   */
  headlineScale?: number;
  bodyScale?: number;
  /** 카드에 그리는 우리 로고. 예전 편집본에는 없다 — 없으면 `ogonggo` 다. */
  brandMark?: BrandMarkId;
  /** `brandMark` 가 `custom` 일 때 그리는 올린 로고. 없으면 오공고를 그린다. */
  brandImage?: BrandImage;
}

/** `custom` 은 사람이 올린 로고(`brandImage`), `none` 은 모든 장에서 그리지 않는다. */
export type BrandMarkId = 'ogonggo' | 'letscareer' | 'custom' | 'none';

export interface BrandImage {
  /** data URL. 편집 화면이 긴 변 600px 이하로 줄여 둔다. */
  dataUrl: string;
  /** 가로÷세로. */
  aspect: number;
}

/** 기업 로고. 한 색 판은 편집 화면이 캔버스로 칠해 둔다(서버는 이미지를 다시 칠하지 못한다). */
export interface CardLogo {
  original: string;
  white?: string;
  black?: string;
  /** 가로÷세로. 렌더가 로고 상자를 로고 크기에 꼭 맞추는 데 쓴다(흰 판이 남지 않게). */
  aspect?: number;
}

export type VariantId =
  | 'thumb'
  | 'thumbFade'
  | 'thumbDark'
  | 'thumbCard'
  | 'wave'
  | 'watermark'
  | 'frame'
  | 'panel'
  | 'tab'
  | 'dark';

/**
 * 사람이 옮기거나 크기를 바꾸거나 숨길 수 있는 요소. 렌더가 이 단위로 감싼다. 배경 도형(물결,
 * 워터마크, 프레임)은 고정이다. 칩과 목록은 섹션마다 따로다(`SectionElementId`).
 */
export const ELEMENT_IDS = [
  'badge',
  'companyLogo',
  'headline',
  'roleTitle',
  'thumbnail',
  'sectionsPanel',
  'note',
  'tabCard',
  'brandMark',
  'arrow',
  'ctaHeadline',
  'ctaSub',
  'profile',
] as const;

export type FixedElementId = (typeof ELEMENT_IDS)[number];

/**
 * 섹션 요소. `section-<n>` 은 칩과 목록 묶음, `-chip`·`-list` 는 그 안의 칩과 목록이다. `<n>` 은
 * 그 장에 보이는 섹션 순서(1부터, 항목이 빈 섹션은 세지 않는다)다.
 */
export type SectionElementId =
  | `section-${number}`
  | `section-${number}-chip`
  | `section-${number}-list`;

export type ElementId = FixedElementId | SectionElementId;

/** 섹션 번호는 1~9 까지 받는다. */
const SECTION_ELEMENT = /^section-([1-9])(?:-(chip|list))?$/;

export function sectionElementId(index: number, part?: 'chip' | 'list'): SectionElementId {
  return part ? `section-${index}-${part}` : `section-${index}`;
}

export function isElementId(value: unknown): value is ElementId {
  return (
    typeof value === 'string' &&
    ((ELEMENT_IDS as readonly string[]).includes(value) || SECTION_ELEMENT.test(value))
  );
}

/** 편집 화면에 보이는 요소 이름. */
export const ELEMENT_LABELS: Record<FixedElementId, string> = {
  badge: '뱃지',
  companyLogo: '회사 로고',
  headline: '큰 제목',
  roleTitle: '직무명',
  thumbnail: '썸네일 카드',
  sectionsPanel: '흰 판',
  note: '안내 문구',
  tabCard: '흰 카드',
  brandMark: '브랜드 로고',
  arrow: '화살표',
  ctaHeadline: '3장 제목',
  ctaSub: '3장 부제',
  profile: '프로필 카드',
};

/**
 * 요소 이름. 섹션은 `섹션 2 · 마감 기한`, `섹션 2 칩` 처럼 번호와 칩 제목을 붙인다. `sectionLabels` 는
 * 그 장에 보이는 섹션의 칩 제목이다(없으면 번호만).
 */
export function elementLabel(id: ElementId, sectionLabels?: string[]): string {
  const match = SECTION_ELEMENT.exec(id);
  if (!match) {
    return ELEMENT_LABELS[id as FixedElementId] ?? id;
  }
  const label = sectionLabels?.[Number(match[1]) - 1]?.trim();
  const name = `섹션 ${match[1]}`;
  if (match[2] === 'chip') {
    return `${name} 칩`;
  }
  if (match[2] === 'list') {
    return `${name} 목록`;
  }
  return label ? `${name} · ${label}` : name;
}

/**
 * 요소 하나의 편집값. 템플릿이 자동으로 잡은 자리에서 얼마나 옮겼는지(px, 1080 폭 기준)와 요소
 * 가운데를 기준으로 한 배율이다. 숨긴 요소도 자리는 그대로 차지한다 — 다른 요소가 따라 움직이지 않게.
 */
export interface ElementEdit {
  dx: number;
  dy: number;
  scale: number;
  hidden?: boolean;
}

/** 한 장의 편집값. 편집하지 않은 요소는 없다. */
export type SlideEdits = Partial<Record<ElementId, ElementEdit>>;

/**
 * 템플릿 위에 사람이 얹은 자유 요소. 장마다 따로이고 장을 넘어 공유하지 않는다. 좌표는 폭 1080 기준
 * 왼쪽 위, 배열 순서가 칠하는 순서다(뒤에 있을수록 위).
 */
interface LayerBase {
  id: string;
  x: number;
  y: number;
  width: number;
}

/** 글자 요소. 높이는 글자에 맞춰 늘어난다. 줄은 `\n` 으로 나누고 강조 표시(`*단어*`)는 쓰지 않는다. */
export interface TextLayer extends LayerBase {
  kind: 'text';
  text: string;
  fontSize: number;
  /** 500~900. 글꼴 파일이 있는 굵기만. */
  fontWeight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  /** 글자 크기에 곱하는 줄 간격. */
  lineHeight: number;
}

/** 이미지 요소. `src` 는 data URL, `imageId` 는 이 브라우저 이미지 저장소(IndexedDB)의 열쇠다. */
export interface ImageLayer extends LayerBase {
  kind: 'image';
  imageId: string;
  src: string;
  height: number;
  /** 0~1. */
  opacity: number;
  /** 모서리 둥글기(px). */
  radius: number;
}

export type Layer = TextLayer | ImageLayer;

export const LAYER_WEIGHTS = [500, 600, 700, 800, 900] as const;

/** 편집 화면에서 고른 것. 템플릿 요소는 id, 자유 요소는 `layer:<id>` 다. */
export type LayerRef = `layer:${string}`;
export type Selection = ElementId | LayerRef;

export function layerRef(id: string): LayerRef {
  return `layer:${id}`;
}

export function isLayerRef(value: unknown): value is LayerRef {
  return typeof value === 'string' && value.startsWith('layer:');
}

/** 자유 요소 이름. 글자 요소는 앞 글자 몇 개를 붙인다. */
export function layerLabel(layer: Layer): string {
  if (layer.kind === 'image') {
    return '이미지';
  }
  const head = layer.text.replace(/\s+/g, ' ').trim();
  return head ? `글자 · ${head.length > 12 ? `${head.slice(0, 12)}…` : head}` : '글자';
}

export interface CardSpec {
  variant: VariantId;
  content: CardContent;
  settings: CardSettings;
  /** 없으면 회사명을 글자로 쓴다. */
  logo?: CardLogo;
  companyName: string;
  /** 장 번호 순서의 편집값. 크기(4:5·1:1·9:16)끼리 같이 쓴다. */
  edits?: SlideEdits[];
  /** 장 번호 순서의 자유 요소. 크기끼리 같이 쓴다. */
  layers?: Layer[][];
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
