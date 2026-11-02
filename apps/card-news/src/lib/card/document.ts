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

/**
 * 장 목록·받기에 보이는 장 이름(`2. 자격·우대 요건`). `name` 은 `slideName()` 이다. `index` 는 문서의
 * 몇 번째 장인가(0부터).
 */
export function slideLabel(name: string, index: number): string {
  return `${index + 1}. ${name}`;
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
  /**
   * 템플릿별 요소 편집값. 템플릿을 바꿔도 각자 남는다. 틀을 쓰는 묶음 공고 장은 이 값 대신
   * `CardDocument.jobTemplateEdits` 를 쓴다(`slideEditsOf()`).
   */
  edits: Partial<Record<VariantId, SlideEdits>>;
  /** 묶음 공고 장을 공고별 장 틀에서 뗐는가(`이 장만 따로`). */
  detached?: boolean;
  /** 템플릿별 자유 요소(글자·이미지). */
  layers: Partial<Record<VariantId, Layer[]>>;
  /**
   * 이 장에만 덮어쓴 템플릿(템플릿 서랍의 `한 장씩`). 없으면 문서 템플릿(`CardDocument.variant`)이다.
   * 편집값·자유 요소는 템플릿별로 남으므로 이 템플릿 것을 읽고 쓴다.
   */
  variant?: VariantId;
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
  /** 문서 템플릿. 모든 장을 이 시안으로 그린다(장에 덮어쓴 템플릿이 있으면 그 장은 그것으로). */
  variant: VariantId;
  /** 모든 장이 같이 쓴다. */
  settings: CardSettings;
  /** 1~`MAX_SLIDES` 장. */
  slides: DocumentSlide[];
  /** 인스타그램 게시물 본문. 카드에는 그리지 않는다. */
  caption: string;
  /** 묶음 표지. 묶음 문서에만 있다. */
  cover?: DocumentCover;
  /**
   * 묶음 공고 장 틀의 템플릿별 요소 편집값. 뗀 장(`detached`)이 아닌 공고 장은 모두 이 값을 같이 쓴다 —
   * 한 장에서 로고를 옮기면 다른 공고 장도 옮겨지고, 실행 취소 한 번에 같이 돌아간다. 자유 요소와 문구는
   * 장마다 따로다.
   */
  jobTemplateEdits?: Partial<Record<VariantId, SlideEdits>>;
  /** 편집 화면을 열 때의 캔버스 크기. 빈 캔버스에서 고른다. 없으면 피드 4:5 다. */
  size?: CardSizeId;
  /** 사람이 고친 문서 제목. 비어 있으면 묶은 회사 이름이다(`documentTitle()`). */
  title?: string;
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

/**
 * 묶음 공고 장의 표지 표 줄(직무, 모집 분야). 표 줄이 모자라면 그 공고의 직무명을 쓴다. 묶음 문서의
 * 공고 장이 아니면 `undefined`.
 */
function bundleRowOf(doc: CardDocument, slide: DocumentSlide): [string, string] | undefined {
  if (slide.role !== 'job' || !doc.cover) {
    return undefined;
  }
  const index = slide.jobIndex ?? 0;
  return doc.cover.rows[index] ?? [doc.jobs[index]?.content.roleTitle ?? '', ''];
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
  const bundleRow = bundleRowOf(doc, slide);
  // 로고는 첫 공고 것 하나다. 회사가 다른 공고 장은 로고 대신 회사명을 글자로 쓴다.
  const sameCompany = !job || job.companyName === doc.jobs[0]?.companyName;
  return {
    spec: {
      variant,
      content: documentContent(doc, slide),
      settings: variantOf(variant).image && photo ? { ...shared, photo } : shared,
      logo: sameCompany ? logo : undefined,
      companyName: job?.companyName ?? '',
      edits: slideEditsOf(doc, slide)[variant],
      layers: slide.layers[variant],
      ...(cover ? { cover } : {}),
      ...(bundleRow ? { bundleRow } : {}),
    },
    id: slide.id,
    role: slide.role,
  };
}

/** 장이 쓰는 템플릿. 장에 덮어쓴 템플릿이 없으면 문서 템플릿(`variant`)이다. */
export function slideVariant(slide: DocumentSlide, variant: VariantId): VariantId {
  return slide.variant ?? variant;
}

/** 문서 템플릿을 바꾼 문서. 한 벌 통째로 바꾸므로 장마다 덮어쓴 템플릿도 지운다. */
export function withTemplate(doc: CardDocument, variant: VariantId): CardDocument {
  return {
    ...doc,
    variant,
    slides: doc.slides.map(({ variant: _override, ...slide }) => slide),
  };
}

/**
 * 장 하나에만 템플릿을 덮어쓴 문서(`한 장씩`). `null` 이거나 문서 템플릿과 같으면 덮어쓴 것을 지워 문서
 * 템플릿을 따른다.
 */
export function withSlideTemplate(
  doc: CardDocument,
  slideId: string,
  variant: VariantId | null,
): CardDocument {
  return withSlide(doc, slideId, ({ variant: _override, ...slide }) =>
    variant && variant !== doc.variant ? { ...slide, variant } : slide,
  );
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

/**
 * 묶음 공고 장이 공고별 장 틀(`CardDocument.jobTemplateEdits`)을 쓰는가. `이 장만 따로` 로 뗀 장은 자기
 * 편집값을 쓴다.
 */
export function usesJobTemplate(doc: CardDocument, slide: DocumentSlide): boolean {
  return doc.kind === 'bundle' && slide.role === 'job' && !slide.detached;
}

/** 장이 그리는 템플릿별 요소 편집값. 틀을 쓰는 묶음 공고 장은 틀의 값이다. */
export function slideEditsOf(
  doc: CardDocument,
  slide: DocumentSlide,
): Partial<Record<VariantId, SlideEdits>> {
  return usesJobTemplate(doc, slide) ? (doc.jobTemplateEdits ?? {}) : slide.edits;
}

/**
 * 장 하나의 템플릿 편집값을 바꾼 문서. 틀을 쓰는 묶음 공고 장이면 틀을 바꿔 다른 공고 장도 같이
 * 바뀐다. 없는 id 면 그대로다.
 */
function withEditsOf(
  doc: CardDocument,
  slideId: string,
  variant: VariantId,
  change: (edits: SlideEdits) => SlideEdits,
): CardDocument {
  const slide = doc.slides.find((item) => item.id === slideId);
  if (!slide) {
    return doc;
  }
  if (usesJobTemplate(doc, slide)) {
    const template = doc.jobTemplateEdits ?? {};
    return {
      ...doc,
      jobTemplateEdits: { ...template, [variant]: change(template[variant] ?? {}) },
    };
  }
  return withSlide(doc, slideId, (current) => ({
    ...current,
    edits: { ...current.edits, [variant]: change(current.edits[variant] ?? {}) },
  }));
}

/** 요소 하나의 편집값을 바꾼 문서. `null` 이면 템플릿 원래 배치로 돌린다. */
export function withSlideEdit(
  doc: CardDocument,
  slideId: string,
  variant: VariantId,
  id: ElementId,
  edit: ElementEdit | null,
): CardDocument {
  return withEditsOf(doc, slideId, variant, (edits) => {
    const { [id]: _previous, ...others } = edits;
    return edit ? { ...others, [id]: edit } : others;
  });
}

/** 장 하나의 편집값을 통째로 바꾼 문서. */
export function withSlideEdits(
  doc: CardDocument,
  slideId: string,
  variant: VariantId,
  edits: SlideEdits,
): CardDocument {
  return withEditsOf(doc, slideId, variant, () => edits);
}

/**
 * 묶음 공고 장을 틀에서 뗀 문서(`이 장만 따로`). 지금 틀의 편집값을 그 장에 옮겨 적어 겉모습은 그대로이고,
 * 이후 이 장을 고쳐도 다른 공고 장은 바뀌지 않는다.
 */
export function detachSlide(doc: CardDocument, slideId: string): CardDocument {
  return withSlide(doc, slideId, (slide) => ({
    ...slide,
    detached: true,
    edits: { ...doc.jobTemplateEdits },
  }));
}

/** 뗀 묶음 공고 장을 틀로 되돌린 문서. 그 장에만 있던 템플릿 편집값은 버린다(자유 요소는 남긴다). */
export function attachSlide(doc: CardDocument, slideId: string): CardDocument {
  return withSlide(doc, slideId, ({ detached: _detached, ...slide }) => ({ ...slide, edits: {} }));
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

/**
 * 문서 제목. 사람이 고친 제목이 있으면 그것을, 없으면 묶은 회사 이름이다(같은 회사는 한 번). 공고가
 * 없으면 `빈 캔버스` 다.
 */
export function documentTitle(doc: CardDocument): string {
  if (doc.title?.trim()) {
    return doc.title.trim();
  }
  const names = [...new Set(doc.jobs.map((job) => job.companyName))];
  return names.length > 0 ? names.join(' · ') : '빈 캔버스';
}

/**
 * 장 이름. 묶음은 `표지`, 공고 장은 그 공고의 직무(표지 표 줄), `프로필 안내` 다. 공고 하나·빈 캔버스는
 * 장 종류 이름이다.
 */
export function slideName(doc: CardDocument, slide: DocumentSlide): string {
  if (doc.kind !== 'bundle') {
    return ROLE_LABELS[slide.role];
  }
  if (slide.role === 'cover') {
    return '표지';
  }
  if (slide.role === 'job') {
    return jobName(doc, slide.jobIndex ?? 0);
  }
  return ROLE_LABELS[slide.role];
}

/** 묶은 공고 하나의 이름. 표지 표의 직무, 없으면 직무명, 그것도 없으면 `공고 <n>`. */
export function jobName(doc: CardDocument, jobIndex: number): string {
  return (
    doc.cover?.rows[jobIndex]?.[0]?.trim() ||
    doc.jobs[jobIndex]?.content.roleTitle.trim() ||
    `공고 ${jobIndex + 1}`
  );
}

/** 새 장. 공고 장은 `jobIndex` 의 공고를 그린다. */
export function newSlide(role: SlideRole, jobIndex?: number): DocumentSlide {
  return {
    id: newSlideId(),
    role,
    ...(role === 'job' ? { jobIndex: jobIndex ?? 0 } : {}),
    edits: {},
    layers: {},
  };
}

/**
 * 공고 장 순서에 맞춰 `jobs` 와 표지 표 줄을 다시 줄 세운 문서. 공고 장에 처음 나오는 순서이고, 장이 없는
 * 공고는 원래 순서대로 뒤에 둔다. 장의 `jobIndex` 도 새 순서로 고친다.
 */
function withJobOrder(doc: CardDocument): CardDocument {
  const seen = doc.slides.flatMap((slide) =>
    slide.role === 'job' && slide.jobIndex !== undefined ? [slide.jobIndex] : [],
  );
  const order = [...new Set([...seen, ...doc.jobs.map((_, index) => index)])].filter(
    (index) => index < doc.jobs.length,
  );
  if (order.every((from, to) => from === to)) {
    return doc;
  }
  const moved = (index: number) => order.indexOf(index);
  return {
    ...doc,
    jobs: order.map((index) => doc.jobs[index]!),
    ...(doc.cover
      ? {
          cover: {
            ...doc.cover,
            rows: order.flatMap((index) => {
              const row = doc.cover?.rows[index];
              return row ? [row] : [];
            }),
          },
        }
      : {}),
    slides: doc.slides.map((slide) =>
      slide.role === 'job' && slide.jobIndex !== undefined
        ? { ...slide, jobIndex: moved(slide.jobIndex) }
        : slide,
    ),
  };
}

/** 장 하나를 `to` 자리로 옮긴 문서. 공고 장 순서가 바뀌면 `jobs` 와 표지 표 줄 순서도 따라간다. */
export function moveSlide(doc: CardDocument, slideId: string, to: number): CardDocument {
  const from = doc.slides.findIndex((slide) => slide.id === slideId);
  const target = Math.max(0, Math.min(doc.slides.length - 1, to));
  if (from < 0 || from === target) {
    return doc;
  }
  const slides = doc.slides.filter((slide) => slide.id !== slideId);
  slides.splice(target, 0, doc.slides[from]!);
  return withJobOrder({ ...doc, slides });
}

/** `at` 자리에 장을 넣은 문서. 장 상한이면 그대로다. */
export function insertSlide(doc: CardDocument, slide: DocumentSlide, at: number): CardDocument {
  if (doc.slides.length >= MAX_SLIDES) {
    return doc;
  }
  const slides = [...doc.slides];
  slides.splice(Math.max(0, Math.min(slides.length, at)), 0, slide);
  return withJobOrder({ ...doc, slides });
}

/** 장 하나를 바로 뒤에 복제한 문서. 편집값과 자유 요소를 같이 옮긴다. 장 상한이면 그대로다. */
export function duplicateSlide(doc: CardDocument, slideId: string): CardDocument {
  const index = doc.slides.findIndex((slide) => slide.id === slideId);
  const source = doc.slides[index];
  if (!source) {
    return doc;
  }
  return insertSlide(doc, { ...structuredClone(source), id: newSlideId() }, index + 1);
}

/** 장 하나를 지운 문서. 마지막 한 장은 지우지 않는다. 공고는 문서에 남는다(표지 표 줄도). */
export function removeSlide(doc: CardDocument, slideId: string): CardDocument {
  if (doc.slides.length <= 1) {
    return doc;
  }
  return withJobOrder({ ...doc, slides: doc.slides.filter((slide) => slide.id !== slideId) });
}
