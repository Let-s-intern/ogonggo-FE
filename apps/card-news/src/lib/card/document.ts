import { DEFAULT_PROFILE } from './fromJob';
import type {
  CardContent,
  CardLogo,
  CardSettings,
  CardSizeId,
  CardSpec,
  CoverTable,
  ElementEdit,
  ElementId,
  Layer,
  SlideEdits,
  VariantId,
} from './types';
import { variantOf } from './variants';

/**
 * 게시물 한 벌. 장 목록이고, 장마다 무엇을 그리는지(`role`)와 편집값을 든다. 편집 화면이 이 값을 들고
 * 있다가 장 하나를 그릴 때 `slideSpec()` 으로 렌더용 `CardSpec` 을 편다.
 *
 * 공고 하나로 만든 문서도 같은 모양이다(`single`, 장 3개). 화면 코드는 문서 종류로 갈래를 두지 않는다.
 */

export type DocumentKind = 'single' | 'bundle' | 'blank';

/**
 * 장 종류. `cover` 는 공고 요약(지금 1장), `job` 은 자격·우대 요건(지금 2장), `profile` 은 프로필 링크
 * 안내(지금 3장), `free` 는 시안 배경만 그린 빈 장이다.
 */
export type SlideRole = 'cover' | 'job' | 'profile' | 'free';

export const SLIDE_ROLES: readonly SlideRole[] = ['cover', 'job', 'profile', 'free'];

/** 장 종류 이름. 장 목록과 비서의 화면 설명에 쓴다. */
export const ROLE_LABELS: Record<SlideRole, string> = {
  cover: '공고 요약',
  job: '자격·우대 요건',
  profile: '프로필 안내',
  free: '빈 장',
};

/**
 * 한 문서의 장 수 상한. 인스타그램 캐러셀 한도는 확인하지 못했다 — 10장이면 묶음 공고 8개에 표지와
 * 안내가 들어간다.
 */
export const MAX_SLIDES = 10;

/** 묶음 하나에 넣는 공고 수. 표지와 안내 장을 빼고 장 상한까지다. 표 줄이 몇 개까지 읽히는지는 아직 보지 않았다. */
export const MIN_BUNDLE_JOBS = 2;
export const MAX_BUNDLE_JOBS = MAX_SLIDES - 2;

/** 장 목록에 보이는 장 이름(`2. 자격·우대 요건`). `index` 는 문서의 몇 번째 장인가(0부터). */
export function slideLabel(slide: Pick<DocumentSlide, 'role'>, index: number): string {
  return `${index + 1}. ${ROLE_LABELS[slide.role]}`;
}

/** 템플릿을 바꾸지 않을 때 쓰는 시안. 비서 도구가 템플릿을 모를 때와 같다. */
export const DEFAULT_VARIANT: VariantId = 'wave';

export interface DocumentJob {
  jobId: number;
  companyName: string;
  /** 그 공고의 문구. 인스타그램 본문은 문서에 하나라 여기 두지 않는다(`CardDocument.caption`). */
  content: Omit<CardContent, 'caption'>;
}

export interface DocumentSlide {
  /** 장을 옮겨도 편집값이 따라가는 열쇠. */
  id: string;
  role: SlideRole;
  /** `role = job` 일 때 `jobs` 의 몇 번째인가. */
  jobIndex?: number;
  /** 템플릿별 요소 편집값. 템플릿을 바꿔도 각자 남는다. */
  edits: Partial<Record<VariantId, SlideEdits>>;
  /** 템플릿별 자유 요소(글자·이미지). */
  layers: Partial<Record<VariantId, Layer[]>>;
}

/**
 * 묶음 표지의 제목과 직무 표(묶음 초안의 `cover`). 표 줄은 공고마다 하나, 묶은 순서다. `cover` 장은
 * 묶음 표지 배치로 그린다(`slideSpec()` 이 `CardSpec.cover` 로 편다).
 */
export interface DocumentCover {
  badge: string;
  headline: string;
  columns: [string, string];
  rows: [string, string][];
}

export interface CardDocument {
  /** 저장 열쇠. `single` 은 `job-<jobId>`, 나머지는 무작위다. */
  id: string;
  kind: DocumentKind;
  /** 묶은 순서. `blank` 는 빈 배열이다. */
  jobs: DocumentJob[];
  /** 시작 화면에서 적은 요청사항·추가 정보(참고 링크 포함). 초안 모델에 같이 넘긴다. */
  request: string;
  /**
   * 시작 화면에서 첨부한 이미지 id(IndexedDB, `../client/imageStore.ts`). 모델에는 보내지 않고 편집
   * 화면의 재료로 쓴다.
   */
  uploads?: string[];
  /** 마지막으로 고른 시안. */
  variant: VariantId;
  /** 모든 장이 같이 쓴다. */
  settings: CardSettings;
  /** 1~`MAX_SLIDES` 장. */
  slides: DocumentSlide[];
  /** 인스타그램 게시물 본문. 카드에는 그리지 않는다. */
  caption: string;
  /** 묶음 표지. 묶음 문서에만 있다. */
  cover?: DocumentCover;
  /** 편집 화면을 열 때의 캔버스 크기. 빈 캔버스에서 고른다. 없으면 피드 4:5 다. */
  size?: CardSizeId;
}

export function newSlideId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** 묶음·빈 캔버스 문서의 id. 공고 하나 문서는 `job-<공고 번호>` 다. */
export function newDocumentId(kind: Exclude<DocumentKind, 'single'>): string {
  return `${kind}-${crypto.randomUUID().slice(0, 8)}`;
}

/** 공고 하나로 만든 문서의 장. 지금 세 장과 같은 순서다. */
const SINGLE_ROLES: readonly SlideRole[] = ['cover', 'job', 'profile'];

/**
 * 공고 하나로 문서를 만든다. `edits`·`layers` 는 장 번호 순서로 남아 있던 템플릿별 편집값이다(예전
 * 편집본). 없으면 빈 장이다.
 */
export function singleDocument(
  job: { id: number; companyName: string },
  content: CardContent,
  settings: CardSettings,
  saved: {
    edits?: Partial<Record<VariantId, SlideEdits[]>>;
    layers?: Partial<Record<VariantId, Layer[][]>>;
  } = {},
): CardDocument {
  const { caption, ...jobContent } = content;
  const byVariant = <T>(source: Partial<Record<VariantId, T[]>> | undefined, index: number) =>
    Object.fromEntries(
      Object.entries(source ?? {}).flatMap(([variant, slides]) => {
        const value = (slides as T[] | undefined)?.[index];
        return value === undefined || value === null ? [] : [[variant, value]];
      }),
    ) as Partial<Record<VariantId, T>>;
  return {
    id: `job-${job.id}`,
    kind: 'single',
    jobs: [{ jobId: job.id, companyName: job.companyName, content: jobContent }],
    request: '',
    variant: DEFAULT_VARIANT,
    settings,
    slides: SINGLE_ROLES.map((role, index) => ({
      id: newSlideId(),
      role,
      ...(role === 'job' ? { jobIndex: 0 } : {}),
      edits: byVariant(saved.edits, index),
      layers: byVariant(saved.layers, index),
    })),
    caption: caption ?? '',
  };
}

/** 묶음 문서의 장. 표지, 묶은 순서대로 공고마다 한 장, 프로필 안내. */
function bundleSlides(count: number): DocumentSlide[] {
  return [
    { id: newSlideId(), role: 'cover', edits: {}, layers: {} },
    ...Array.from({ length: count }, (_, jobIndex) => ({
      id: newSlideId(),
      role: 'job' as const,
      jobIndex,
      edits: {},
      layers: {},
    })),
    { id: newSlideId(), role: 'profile', edits: {}, layers: {} },
  ];
}

/**
 * 여러 공고를 묶은 문서. `jobs` 는 묶은 순서이고 공고마다의 문구를 든다. 인스타그램 본문은 문서에
 * 하나라 공고 문구의 `caption` 은 버린다.
 */
export function bundleDocument(
  id: string,
  jobs: { jobId: number; companyName: string; content: CardContent }[],
  draft: { cover: DocumentCover; caption: string },
  settings: CardSettings,
  start: { request: string; uploads?: string[] },
): CardDocument {
  return {
    id,
    kind: 'bundle',
    jobs: jobs.map(({ jobId, companyName, content: { caption: _caption, ...content } }) => ({
      jobId,
      companyName,
      content,
    })),
    request: start.request,
    ...(start.uploads?.length ? { uploads: start.uploads } : {}),
    variant: DEFAULT_VARIANT,
    settings,
    slides: bundleSlides(jobs.length),
    caption: draft.caption,
    cover: draft.cover,
  };
}

/**
 * 빈 캔버스로 시작한 문서. 공고 없이 `free` 장 하나다. 시안 배경만 그리고 글은 자유 요소로 넣는다.
 */
export function blankDocument(id: string, settings: CardSettings, size: CardSizeId): CardDocument {
  return {
    id,
    kind: 'blank',
    jobs: [],
    request: '',
    variant: DEFAULT_VARIANT,
    settings,
    slides: [{ id: newSlideId(), role: 'free', edits: {}, layers: {} }],
    caption: '',
    size,
  };
}

/**
 * 공고가 없는 문서(빈 캔버스)의 문구. 템플릿 글자는 모두 비어 그리지 않는다. 안내 장을 더하면 기본
 * 프로필을 그린다.
 */
const EMPTY_CONTENT: DocumentJob['content'] = {
  badge: '',
  headline: '',
  roleTitle: '',
  summarySections: [],
  note: '',
  detailSections: [],
  ctaHeadline: '',
  ctaSub: '',
  profile: DEFAULT_PROFILE,
};

/**
 * 장이 그리는 공고. 표지·안내처럼 공고를 가리키지 않는 장은 첫 공고다. 공고가 없는 문서면
 * `undefined` 다.
 */
function slideJob(doc: CardDocument, slide?: DocumentSlide): DocumentJob | undefined {
  return doc.jobs[slide?.jobIndex ?? 0] ?? doc.jobs[0];
}

/**
 * 장 하나가 그리는 문구. 인스타그램 본문은 문서 것을 붙인다. 묶음 표지 장은 첫 공고 문구에 표지
 * 뱃지·제목을 얹고, 섹션 자리에 직무 표의 두 열을 둔다 — 그림은 `CardSpec.cover` 로 그리고, 이 섹션은
 * 비서가 표지를 읽을 때 쓴다.
 */
export function documentContent(doc: CardDocument, slide?: DocumentSlide): CardContent {
  const content = { ...(slideJob(doc, slide)?.content ?? EMPTY_CONTENT), caption: doc.caption };
  if (slide?.role !== 'cover' || !doc.cover) {
    return content;
  }
  const { badge, headline, columns, rows } = doc.cover;
  return {
    ...content,
    badge,
    headline,
    roleTitle: '',
    summarySections: columns.map((label, column) => ({
      label,
      items: rows.map((cells) => cells[column] ?? ''),
    })),
    note: '',
  };
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
/** 공고 문구의 마감 기한(`2026.11.09 (월) 23:59`, `2026.11.09 (월) 마감`). */
const DEADLINE = /^(\d{4})\.(\d{2})\.(\d{2})\s*\((.)\)(?:\s+(\d{2}:\d{2}))?/;

/**
 * 묶음 표지 마감 줄의 날짜. 공고마다 `마감 기한` 첫 항목을 읽어 가장 이른 날짜를 `~ 11월 9일(월) 23:59`
 * 로 쓴다(인스타 본문의 마감 줄과 같은 모양). 날짜로 읽히는 것이 없으면 첫 공고의 글 그대로, 그것도
 * 없으면 `채용 시 마감` 이다. 공고 문구에서 읽으므로 공고 마감을 고치면 표지도 따라간다.
 */
export function coverDeadline(doc: CardDocument): string {
  const texts = doc.jobs.map(
    (job) =>
      job.content.summarySections
        .find((section) => section.label.trim() === '마감 기한')
        ?.items.find((item) => item.trim())
        ?.trim() ?? '',
  );
  const dated = texts
    .map((text) => DEADLINE.exec(text))
    .filter((match): match is RegExpExecArray => match !== null)
    .sort((a, b) =>
      `${a[1]}${a[2]}${a[3]}${a[5] ?? '24:00'}`.localeCompare(
        `${b[1]}${b[2]}${b[3]}${b[5] ?? '24:00'}`,
      ),
    );
  const first = dated[0];
  if (!first) {
    return texts.find(Boolean) ?? '채용 시 마감';
  }
  const [, year = '', month = '', day = '', , time] = first;
  const weekday = WEEKDAYS[new Date(Number(year), Number(month) - 1, Number(day)).getDay()] ?? '';
  const date = `${Number(month)}월 ${Number(day)}일(${weekday})`;
  return time ? `~ ${date} ${time}` : `~ ${date}`;
}

/** 묶음 표지 장이 그리는 마감 줄과 직무 표. 묶음 문서의 표지 장이 아니면 `undefined`. */
function coverTable(doc: CardDocument, slide: DocumentSlide): CoverTable | undefined {
  if (slide.role !== 'cover' || !doc.cover) {
    return undefined;
  }
  return { deadline: coverDeadline(doc), columns: doc.cover.columns, rows: doc.cover.rows };
}

/** 렌더할 장 하나. `id` 는 문서 장의 id 다. */
export interface RenderSlide {
  id: string;
  role: SlideRole;
  spec: CardSpec;
}

/**
 * 장 하나를 렌더할 값으로 편다. 시안은 문서에 고른 것이 아니라 부르는 쪽이 준다 — 시안 고르기는
 * 같은 문서를 열 시안으로 그린다. 로고는 편집 화면이 칠한 판을 넘긴다(문서에 남기지 않는다).
 */
export function slideSpec(
  doc: CardDocument,
  slide: DocumentSlide,
  variant: VariantId,
  logo?: CardLogo,
): RenderSlide {
  const job = slideJob(doc, slide);
  // 썸네일은 그것을 쓰는 시안에만 싣는다. 렌더 요청 본문이 가벼워진다.
  const { photo, ...shared } = doc.settings;
  const cover = coverTable(doc, slide);
  return {
    spec: {
      variant,
      content: documentContent(doc, slide),
      settings: variantOf(variant).image && photo ? { ...shared, photo } : shared,
      logo,
      companyName: job?.companyName ?? '',
      edits: slide.edits[variant],
      layers: slide.layers[variant],
      ...(cover ? { cover } : {}),
    },
    id: slide.id,
    role: slide.role,
  };
}

/** 장 하나를 바꾼 문서. 없는 id 면 그대로다. */
function withSlide(
  doc: CardDocument,
  slideId: string,
  change: (slide: DocumentSlide) => DocumentSlide,
): CardDocument {
  return {
    ...doc,
    slides: doc.slides.map((slide) => (slide.id === slideId ? change(slide) : slide)),
  };
}

/** 요소 하나의 편집값을 바꾼 문서. `null` 이면 템플릿 원래 배치로 돌린다. */
export function withSlideEdit(
  doc: CardDocument,
  slideId: string,
  variant: VariantId,
  id: ElementId,
  edit: ElementEdit | null,
): CardDocument {
  return withSlide(doc, slideId, (slide) => {
    const { [id]: _previous, ...others } = slide.edits[variant] ?? {};
    return {
      ...slide,
      edits: { ...slide.edits, [variant]: edit ? { ...others, [id]: edit } : others },
    };
  });
}

/** 장 하나의 편집값을 통째로 바꾼 문서. */
export function withSlideEdits(
  doc: CardDocument,
  slideId: string,
  variant: VariantId,
  edits: SlideEdits,
): CardDocument {
  return withSlide(doc, slideId, (slide) => ({
    ...slide,
    edits: { ...slide.edits, [variant]: edits },
  }));
}

/** 장 하나의 자유 요소 목록을 바꾼 문서. */
export function withSlideLayers(
  doc: CardDocument,
  slideId: string,
  variant: VariantId,
  layers: Layer[],
): CardDocument {
  return withSlide(doc, slideId, (slide) => ({
    ...slide,
    layers: { ...slide.layers, [variant]: layers },
  }));
}

/** 문구를 바꾼 문서. 인스타그램 본문은 문서에, 나머지는 그 공고에 둔다. */
export function withContent(doc: CardDocument, content: CardContent, jobIndex = 0): CardDocument {
  const { caption, ...jobContent } = content;
  return {
    ...doc,
    caption,
    jobs: doc.jobs.map((job, index) =>
      index === jobIndex ? { ...job, content: jobContent } : job,
    ),
  };
}

/** 문서 제목. 묶은 회사 이름이다(같은 회사는 한 번). 공고가 없으면 `빈 캔버스` 다. */
export function documentTitle(doc: CardDocument): string {
  const names = [...new Set(doc.jobs.map((job) => job.companyName))];
  return names.length > 0 ? names.join(' · ') : '빈 캔버스';
}
