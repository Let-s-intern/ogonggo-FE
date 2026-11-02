import { DEFAULT_PROFILE } from './fromJob';
import type {
  BundleCard,
  BundleCompany,
  CardBackground,
  CardContent,
  CardLogo,
  CardSettings,
  CardSizeId,
  CardSpec,
  CoverTable,
  ElementEdit,
  ElementId,
  JobValueKey,
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
  /**
   * `role = job` 일 때 그리는 공고(`jobs` 의 몇 번째인가). 장 하나에 공고 여러 개를 놓는 배치(2열 카드,
   * 회사 블록)는 둘 이상이다. v3 편집본은 `jobIndex` 하나를 들고 있어 읽을 때 옮긴다(`migrateDocument()`).
   */
  jobIndices?: number[];
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
  /**
   * 이 장에만 덮어쓴 배경(배경 서랍에서 `모든 장에 같이 적용` 을 끄고 고른 것). 문서 배경
   * (`settings.background`)보다 앞선다. 없으면 문서 배경, 그것도 없으면 시안 배경이다. 템플릿을 바꿔도 남는다.
   */
  background?: CardBackground;
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
  /**
   * 직무 표 밑 일정 상자(`서류 합격 발표 : 10월 20일 …`). 한 줄에 하나, 빈 줄은 그리지 않는다. 없거나 모두
   * 비면 상자를 그리지 않는다. 표지 문구의 `note` 로 고친다(`documentContent()`).
   */
  schedule?: string[];
  /**
   * 여러 회사 묶음 표지 표의 열 이름. 여러 회사면 표지 표는 공고마다가 아니라 회사마다 한 줄(회사, 그 회사 직무를
   * `, ` 로 이은 것)이라 열도 따로다. 없으면 `COMPANY_COVER_COLUMNS` 다.
   */
  companyColumns?: [string, string];
}

/** 여러 회사 묶음 표지 표의 처음 열 이름. */
export const COMPANY_COVER_COLUMNS: [string, string] = ['회사', '채용 직무'];

/** 일정 상자에 그릴 줄. 빈 줄을 뺀다. */
export function scheduleLines(cover: DocumentCover | undefined): string[] {
  return (cover?.schedule ?? []).map((line) => line.trim()).filter(Boolean);
}

/**
 * 묶음 공고 장의 배치. `labels` 는 공고마다 한 장, 머리띠(직무·모집 분야)와 항목명 표(마감·업무·우대)다.
 * `columns` 는 한 회사 여러 직무이고 공고마다 카드 하나(직무 머리띠, 담당 업무 | 자격·우대 요건 2열)다.
 * `companies` 는 여러 회사 묶음이고 회사마다 블록 하나(로고, 회사명 머리띠, 부문·직무 2열 표)다.
 */
export type BundleLayoutKind = 'labels' | 'columns' | 'companies';

export const BUNDLE_LAYOUT_LABELS: Record<BundleLayoutKind, string> = {
  labels: '항목명 표',
  columns: '2열 카드',
  companies: '회사 블록',
};

/**
 * 묶음 공고 장을 어떻게 놓는가. `perSlide` 는 장 하나에 놓는 공고(회사 블록은 회사)의 최대 수다 — 둘이 장에
 * 들어가지 않으면 하나만 놓는다(`../card/bundle.ts`). `manual` 이면 사람이 고른 것이라 자동으로 바꾸지 않는다.
 */
export interface BundleLayout {
  kind: BundleLayoutKind;
  perSlide: 1 | 2;
  manual?: boolean;
}

/** 배치를 남기지 않은 묶음(v3 편집본)의 배치. 지금까지처럼 공고마다 한 장이고 자동으로 바꾸지 않는다. */
const LEGACY_BUNDLE_LAYOUT: BundleLayout = { kind: 'labels', perSlide: 1, manual: true };

/** 문서의 묶음 공고 장 배치. 묶음이 아니거나 남긴 배치가 없으면 공고마다 한 장의 항목명 표다. */
export function bundleLayoutOf(doc: CardDocument): BundleLayout {
  return (doc.kind === 'bundle' ? doc.bundleLayout : undefined) ?? LEGACY_BUNDLE_LAYOUT;
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
  /** 묶음 공고 장 배치. 없으면 공고마다 한 장의 항목명 표다(`bundleLayoutOf()`). */
  bundleLayout?: BundleLayout;
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
      ...(role === 'job' ? { jobIndices: [0] } : {}),
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
      jobIndices: [jobIndex],
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
  layout: BundleLayout,
): CardDocument {
  return {
    id,
    kind: 'bundle',
    bundleLayout: layout,
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
  return doc.jobs[slide ? firstJobIndex(slide) : 0] ?? doc.jobs[0];
}

/** 장이 그리는 공고들(`jobs` 의 몇 번째인가). 공고 장이 아니면 빈 배열이다. */
export function slideJobIndices(slide: DocumentSlide): number[] {
  return slide.role === 'job' ? (slide.jobIndices ?? [0]) : [];
}

/** 장이 그리는 첫 공고. 공고 장이 아니면(표지·안내) 0, 곧 첫 공고다. */
export function firstJobIndex(slide: DocumentSlide): number {
  return slideJobIndices(slide)[0] ?? 0;
}

/** v3 편집본의 장(`jobIndex` 하나). */
type LegacySlide = DocumentSlide & { jobIndex?: number };

/**
 * 남은 문서를 지금 모양으로 옮긴다. v3 편집본의 공고 장은 `jobIndex` 하나를 들고 있어 `jobIndices` 로
 * 바꾼다. 이미 지금 모양이면 그대로 돌려준다.
 */
export function migrateDocument(doc: CardDocument): CardDocument {
  const slides = doc.slides as LegacySlide[];
  if (!slides.some((slide) => 'jobIndex' in slide)) {
    return doc;
  }
  return {
    ...doc,
    slides: slides.map(({ jobIndex, ...slide }) =>
      slide.role === 'job' && !slide.jobIndices ? { ...slide, jobIndices: [jobIndex ?? 0] } : slide,
    ),
  };
}

/**
 * 장 하나가 그리는 문구. 인스타그램 본문은 문서 것을 붙인다. 묶음 표지 장은 첫 공고 문구에 표지
 * 뱃지·제목을 얹고, 섹션 자리에 직무 표의 두 열을 둔다 — 그림은 `CardSpec.cover` 로 그리고, 이 섹션은
 * 비서가 표지를 읽을 때 쓴다. 묶음 공고 장의 직무명은 그 장 머리 카드에 그리는 표지 표의 `모집 분야`다.
 *
 * 이 문구를 고친 값은 `withSlideContent()` 가 같은 자리(표지, 표 줄, 그 장의 공고)에 되돌려 넣는다.
 */
export function documentContent(doc: CardDocument, slide?: DocumentSlide): CardContent {
  const content = { ...(slideJob(doc, slide)?.content ?? EMPTY_CONTENT), caption: doc.caption };
  const row = slide ? bundleRowOf(doc, slide) : undefined;
  if (row) {
    return { ...content, roleTitle: row[1] };
  }
  if (slide?.role !== 'cover' || !doc.cover) {
    return content;
  }
  const { badge, headline, schedule } = doc.cover;
  const { columns, rows } = coverRows(doc);
  return {
    ...content,
    badge,
    headline,
    roleTitle: '',
    summarySections: columns.map((label, column) => ({
      label,
      items: rows.map((cells) => cells[column] ?? ''),
    })),
    note: (schedule ?? []).join('\n'),
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
  const schedule = scheduleLines(doc.cover);
  return {
    deadline: coverDeadline(doc),
    ...coverRows(doc),
    ...(schedule.length > 0 ? { schedule } : {}),
  };
}

/**
 * 묶음 표지에 그리는 직무 표. 한 회사면 문서의 표지 표 그대로(공고마다 한 줄)다. 여러 회사면 회사마다 한 줄이고
 * 칸은 회사명과 그 회사 공고의 직무(표지 표 줄의 직무, 없으면 직무명)를 `, ` 로 이은 것이다. 처음 나온 회사 순서다.
 */
export function coverRows(doc: CardDocument): Pick<CoverTable, 'columns' | 'rows'> {
  const cover = doc.cover;
  if (!cover) {
    return { columns: ['', ''], rows: [] };
  }
  const names = companyNames(doc);
  if (names.length <= 1) {
    return { columns: cover.columns, rows: cover.rows };
  }
  return {
    columns: cover.companyColumns ?? COMPANY_COVER_COLUMNS,
    rows: names.map((name) => [
      name,
      doc.jobs
        .flatMap((job, index) =>
          job.companyName === name
            ? [cover.rows[index]?.[0]?.trim() || job.content.roleTitle.trim()]
            : [],
        )
        .filter(Boolean)
        .join(', '),
    ]),
  };
}

/**
 * 묶음 공고 장의 표지 표 줄(직무, 모집 분야). 표 줄이 모자라면 그 공고의 직무명을 쓴다. 묶음 문서의
 * 공고 장이 아니면 `undefined`.
 */
function bundleRowOf(doc: CardDocument, slide: DocumentSlide): [string, string] | undefined {
  if (slide.role !== 'job' || !doc.cover || bundleLayoutOf(doc).kind !== 'labels') {
    return undefined;
  }
  const index = firstJobIndex(slide);
  return doc.cover.rows[index] ?? [doc.jobs[index]?.content.roleTitle ?? '', ''];
}

/** 공고 문구에서 섹션 하나의 항목. 이름으로 찾고, 없으면 그 자리 순서의 섹션이다. */
function sectionItems(
  content: DocumentJob['content'],
  from: 'summarySections' | 'detailSections',
  label: string,
  index: number,
): string[] {
  const section = content[from].find((item) => item.label.trim() === label) ?? content[from][index];
  return (section?.items ?? []).map((item) => item.trim()).filter(Boolean);
}

/**
 * 장이 그리는 공고의 값 하나(`공고 값 넣기`). 표지·안내 장은 첫 공고다. 목록 값은 줄마다 `• ` 를 붙인다.
 * 공고가 없으면 빈 글이다.
 */
export function jobValue(doc: CardDocument, slide: DocumentSlide, key: JobValueKey): string {
  const job = slideJob(doc, slide);
  if (!job) {
    return '';
  }
  const index = doc.jobs.indexOf(job);
  const row = doc.cover?.rows[index];
  const list = (items: string[]) => items.map((item) => `• ${item}`).join('\n');
  switch (key) {
    case 'company':
      return job.companyName;
    case 'role':
      return row?.[0]?.trim() || job.content.roleTitle;
    case 'field':
      return (
        row?.[1]?.trim() || sectionItems(job.content, 'summarySections', '채용 직무', 0).join(', ')
      );
    case 'deadline':
      return sectionItems(job.content, 'summarySections', '마감 기한', 1)[0] ?? '';
    case 'duties':
      return list(sectionItems(job.content, 'summarySections', '담당 업무', 2));
    case 'qualifications':
      return list(sectionItems(job.content, 'detailSections', '자격 요건', 0));
    case 'preferred':
      return list(sectionItems(job.content, 'detailSections', '우대 요건', 1));
  }
}

/** 공고 값과 이어진 글자 요소를 이 장의 공고 값으로 채운 목록. 값이 비면 원래 글자를 둔다. */
export function resolveLayers(
  doc: CardDocument,
  slide: DocumentSlide,
  layers: Layer[] | undefined,
): Layer[] | undefined {
  return layers?.map((layer) => {
    if (layer.kind !== 'text' || !layer.bind) {
      return layer;
    }
    const text = jobValue(doc, slide, layer.bind);
    return text && text !== layer.text ? { ...layer, text } : layer;
  });
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
  logos?: Partial<Record<string, CardLogo>>,
): RenderSlide {
  const job = slideJob(doc, slide);
  // 썸네일은 그것을 쓰는 시안(과 배경)에만 싣는다. 렌더 요청 본문이 가벼워진다.
  const { photo, background: _documentBackground, ...rest } = doc.settings;
  const background = slideBackground(doc, slide, photo);
  const shared: CardSettings = background ? { ...rest, background } : rest;
  const needsPhoto =
    variantOf(variant).image ||
    (background?.kind === 'pattern' && variantOf(background.pattern).image);
  const cover = coverTable(doc, slide);
  const bundleRow = bundleRowOf(doc, slide);
  const firstCompany = doc.jobs[0]?.companyName;
  // 로고는 첫 회사는 편집 화면의 로고, 다른 회사는 `logos` 에 받아 둔 것이다. 없으면 회사명을 글자로 쓴다.
  const logoOf = (name: string) => (name === firstCompany ? logo : logos?.[name]);
  const companies =
    slide.role === 'job' && doc.kind === 'bundle' && bundleLayoutOf(doc).kind === 'companies'
      ? companyBlocks(doc, slideJobIndices(slide)).map((block) => {
          // 회사 블록은 회사마다 받아 둔 로고(옅은 테두리까지 자른 것)를 먼저 쓴다.
          const found = logos?.[block.name] ?? logoOf(block.name);
          return found ? { ...block, logo: found } : block;
        })
      : undefined;
  const cards =
    slide.role === 'job' && doc.kind === 'bundle' && bundleLayoutOf(doc).kind === 'columns'
      ? bundleCards(doc, slideJobIndices(slide))
      : undefined;
  const names = companyNames(doc);
  const companyNameList = cover && names.length > 1 ? names : undefined;
  return {
    spec: {
      variant,
      content: documentContent(doc, slide),
      settings: needsPhoto && photo ? { ...shared, photo } : shared,
      logo: !job ? logo : companyNameList ? undefined : logoOf(job.companyName),
      companyName: job?.companyName ?? '',
      edits: slideEditsOf(doc, slide)[variant],
      layers: resolveLayers(doc, slide, slide.layers[variant]),
      ...(cover ? { cover } : {}),
      ...(bundleRow ? { bundleRow } : {}),
      ...(companies ? { bundleCompanies: companies } : {}),
      ...(cards ? { bundleCards: cards } : {}),
      ...(companyNameList ? { companyNames: companyNameList } : {}),
    },
    id: slide.id,
    role: slide.role,
  };
}

/**
 * 장 하나에 걸리는 덮어쓴 배경. 장 배경, 없으면 문서 배경이다. 썸네일 사진(`imageId` 없음)은 지금 썸네일로
 * 채우고, 그릴 사진이 없으면 배경을 덮어쓰지 않은 것으로 친다(시안 배경).
 */
export function slideBackground(
  doc: CardDocument,
  slide: DocumentSlide,
  photo = doc.settings.photo,
): CardBackground | undefined {
  const background = slide.background ?? doc.settings.background;
  if (background?.kind !== 'photo') {
    return background;
  }
  const src = background.imageId ? background.src : (photo?.dataUrl ?? '');
  return src ? { ...background, src } : undefined;
}

/**
 * 배경을 덮어쓴다. `slideId` 가 있으면 그 장에만이고 `null` 이면 그 장 것을 지운다(문서 배경으로). 없으면
 * 모든 장이다 — 문서 배경을 바꾸고 장마다 덮어쓴 배경은 지운다. `null` 이면 시안 배경으로 돌아간다
 * (`배경 덮어쓰기 지우기`).
 */
export function withBackground(
  doc: CardDocument,
  background: CardBackground | null,
  slideId?: string,
): CardDocument {
  const strip = <T extends { background?: CardBackground }>({
    background: _previous,
    ...item
  }: T): Omit<T, 'background'> => item;
  if (slideId) {
    return {
      ...doc,
      slides: doc.slides.map((slide) =>
        slide.id !== slideId ? slide : background ? { ...slide, background } : strip(slide),
      ),
    };
  }
  return {
    ...doc,
    settings: background ? { ...doc.settings, background } : strip(doc.settings),
    slides: doc.slides.map((slide) => strip(slide)),
  };
}

/** 묶은 회사 이름. 처음 나온 순서이고 같은 회사는 한 번이다. */
export function companyNames(doc: CardDocument): string[] {
  return [...new Set(doc.jobs.map((job) => job.companyName))];
}

/**
 * 회사 블록 배치에서 공고들(`jobs` 의 몇 번째인가)을 회사마다 묶은 블록. 처음 나온 회사 순서이고, 표는 표지
 * 표의 열 이름과 그 회사 공고의 표 줄이다(표 줄이 없으면 직무명과 빈 칸).
 */
export function companyBlocks(doc: CardDocument, indices: number[]): BundleCompany[] {
  const blocks: BundleCompany[] = [];
  for (const index of indices) {
    const job = doc.jobs[index];
    if (!job) {
      continue;
    }
    const row = doc.cover?.rows[index] ?? [job.content.roleTitle, ''];
    const block = blocks.find((item) => item.name === job.companyName);
    if (block) {
      block.rows.push(row);
    } else {
      blocks.push({
        name: job.companyName,
        columns: doc.cover?.columns ?? ['채용 직무', '모집 분야'],
        rows: [row],
      });
    }
  }
  return blocks;
}

/** 공고 문구의 섹션 하나가 어디 있는가. */
export interface SectionSource {
  from: 'summarySections' | 'detailSections';
  index: number;
}

/**
 * 2열 카드 왼쪽·오른쪽 열에 놓이는 공고 섹션의 자리. 왼쪽 열은 `담당 업무`, 오른쪽 열은 `자격 요건`·`우대 요건`
 * 이다. 섹션은 이름으로 찾고 없으면 그 자리 순서의 섹션이다. 항목이 모두 빈 섹션은 뺀다.
 */
export function cardSectionSources(
  content: Pick<CardContent, 'summarySections' | 'detailSections'>,
): {
  left: SectionSource[];
  right: SectionSource[];
} {
  const source = (from: SectionSource['from'], label: string, at: number): SectionSource[] => {
    const found = content[from].findIndex((item) => item.label.trim() === label);
    const index = found >= 0 ? found : at;
    const section = content[from][index];
    return section && section.items.some((item) => item.trim()) ? [{ from, index }] : [];
  };
  return {
    left: source('summarySections', '담당 업무', 2),
    right: [
      ...source('detailSections', '자격 요건', 0),
      ...source('detailSections', '우대 요건', 1),
    ],
  };
}

/**
 * 2열 카드 배치에서 공고들(`jobs` 의 몇 번째인가)의 카드. 머리띠는 표지 표의 직무(없으면 직무명), 열은
 * `cardSectionSources()` 의 섹션이다.
 */
export function bundleCards(doc: CardDocument, indices: number[]): BundleCard[] {
  return indices.flatMap((index) => {
    const job = doc.jobs[index];
    if (!job) {
      return [];
    }
    const { left, right } = cardSectionSources(job.content);
    const sections = (sources: SectionSource[]) =>
      sources.map(({ from, index: at }) => job.content[from][at]!);
    return [
      {
        title: doc.cover?.rows[index]?.[0]?.trim() || job.content.roleTitle,
        left: sections(left),
        right: sections(right),
      },
    ];
  });
}

/**
 * 묶음 공고 장(2열 카드·회사 블록)이 그리는 공고 순서. 회사 블록은 회사마다 모아 처음 나온 회사 순서다
 * (`companyBlocks()` 의 표 줄 순서). 요소 id `job-<k>-…` 의 `<k>` 가 이 순서다.
 */
export function bundleSlideJobs(doc: CardDocument, slide: DocumentSlide): number[] {
  const indices = slideJobIndices(slide).filter((index) => doc.jobs[index]);
  if (bundleLayoutOf(doc).kind !== 'companies') {
    return indices;
  }
  const names = [...new Set(indices.map((index) => doc.jobs[index]!.companyName))];
  return names.flatMap((name) => indices.filter((index) => doc.jobs[index]!.companyName === name));
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
 * 장 하나의 문구(`documentContent(doc, slide)`)를 고친 문서. 묶음 표지는 뱃지·제목을 표지에, 섹션 두 개를
 * 표지 표 열 이름과 줄에, 안내(`note`)를 일정 상자 줄에 넣는다(줄 수는 공고 수 그대로). 여러 회사 묶음의 표지
 * 표는 공고 문구에서 펴므로 열 이름만 넣고 줄은 버린다(직무는 공고 서랍에서 고친다). 묶음 공고 장의 직무명은 표지 표의 `모집 분야`
 * 에 넣는다. 나머지는 그 장의 공고 문구(공고를 가리키지 않는 장은 첫 공고)다.
 */
export function withSlideContent(
  doc: CardDocument,
  slide: DocumentSlide | undefined,
  content: CardContent,
): CardDocument {
  const cover = doc.cover;
  if (slide?.role === 'cover' && cover) {
    const [first, second] = content.summarySections;
    const { schedule: _schedule, ...rest } = cover;
    const schedule = content.note.split('\n');
    if (companyNames(doc).length > 1) {
      const columns = coverRows(doc).columns;
      return {
        ...doc,
        caption: content.caption,
        cover: {
          ...rest,
          ...(content.note.trim() ? { schedule } : {}),
          badge: content.badge,
          headline: content.headline,
          companyColumns: [first?.label ?? columns[0], second?.label ?? columns[1]],
        },
      };
    }
    return {
      ...doc,
      caption: content.caption,
      cover: {
        ...rest,
        ...(content.note.trim() ? { schedule } : {}),
        badge: content.badge,
        headline: content.headline,
        columns: [first?.label ?? cover.columns[0], second?.label ?? cover.columns[1]],
        rows: cover.rows.map((row, index) => [
          first?.items[index] ?? row[0],
          second?.items[index] ?? row[1],
        ]),
      },
    };
  }
  const jobIndex = slide ? firstJobIndex(slide) : 0;
  const row = slide ? bundleRowOf(doc, slide) : undefined;
  if (row && cover) {
    const previous = doc.jobs[jobIndex]?.content.roleTitle ?? '';
    return withContent(
      withCoverRow(doc, jobIndex, [row[0], content.roleTitle]),
      { ...content, roleTitle: previous },
      jobIndex,
    );
  }
  return withContent(doc, content, jobIndex);
}

/** 묶음 표지 표에서 공고 하나의 줄(직무, 모집 분야)을 바꾼 문서. */
export function withCoverRow(
  doc: CardDocument,
  jobIndex: number,
  row: [string, string],
): CardDocument {
  if (!doc.cover) {
    return doc;
  }
  const rows = [...doc.cover.rows];
  rows[jobIndex] = row;
  return { ...doc, cover: { ...doc.cover, rows } };
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
    return slideJobIndices(slide)
      .map((index) => jobName(doc, index))
      .join(' · ');
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
    ...(role === 'job' ? { jobIndices: [jobIndex ?? 0] } : {}),
    edits: {},
    layers: {},
  };
}

/**
 * 공고 장 순서에 맞춰 `jobs` 와 표지 표 줄을 다시 줄 세운 문서. 공고 장에 처음 나오는 순서이고, 장이 없는
 * 공고는 원래 순서대로 뒤에 둔다. 장의 `jobIndices` 도 새 순서로 고친다.
 */
function withJobOrder(doc: CardDocument): CardDocument {
  const seen = doc.slides.flatMap(slideJobIndices);
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
      slide.role === 'job' ? { ...slide, jobIndices: slideJobIndices(slide).map(moved) } : slide,
    ),
  };
}

/**
 * 묶은 공고 하나를 `to` 자리(0부터)로 옮긴 문서(공고 서랍의 순서 바꾸기). 공고 장들은 지금 공고 장이
 * 있던 자리에 새 공고 순서로 다시 놓이고, `jobs`·표지 표 줄·`jobIndices` 가 같이 바뀐다.
 */
export function moveJob(doc: CardDocument, from: number, to: number): CardDocument {
  const target = Math.max(0, Math.min(doc.jobs.length - 1, to));
  if (from === target || from < 0 || from >= doc.jobs.length) {
    return doc;
  }
  const order = doc.jobs.map((_, index) => index);
  order.splice(target, 0, ...order.splice(from, 1));
  const rank = (jobIndex: number) => order.indexOf(jobIndex);
  const positions = doc.slides.flatMap((slide, index) => (slide.role === 'job' ? [index] : []));
  const jobSlides = positions
    .map((index) => doc.slides[index]!)
    .sort((a, b) => rank(firstJobIndex(a)) - rank(firstJobIndex(b)));
  const slides = [...doc.slides];
  positions.forEach((position, index) => {
    const slide = jobSlides[index]!;
    slides[position] = {
      ...slide,
      jobIndices: slideJobIndices(slide)
        .map(rank)
        .sort((a, b) => a - b),
    };
  });
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
    slides,
  };
}

/**
 * 묶은 공고 하나를 뺀 문서(공고 서랍의 `빼기`). 그 공고 장과 표지 표 줄이 같이 사라진다. 마지막 공고와,
 * 빼면 장이 하나도 남지 않는 공고는 빼지 않는다.
 */
export function removeJob(doc: CardDocument, jobIndex: number): CardDocument {
  // 공고 여럿을 놓은 장은 그 공고만 빼고, 남는 공고가 없는 장은 지운다.
  const slides = doc.slides.flatMap((slide) => {
    if (slide.role !== 'job') {
      return [slide];
    }
    const rest = slideJobIndices(slide).filter((index) => index !== jobIndex);
    return rest.length > 0 ? [{ ...slide, jobIndices: rest }] : [];
  });
  if (doc.jobs.length <= 1 || slides.length === 0 || !doc.jobs[jobIndex]) {
    return doc;
  }
  return {
    ...doc,
    jobs: doc.jobs.filter((_, index) => index !== jobIndex),
    ...(doc.cover
      ? { cover: { ...doc.cover, rows: doc.cover.rows.filter((_, index) => index !== jobIndex) } }
      : {}),
    slides: slides.map((slide) =>
      slide.role === 'job'
        ? {
            ...slide,
            jobIndices: slideJobIndices(slide).map((index) =>
              index > jobIndex ? index - 1 : index,
            ),
          }
        : slide,
    ),
  };
}

/**
 * 공고를 더 묶은 문서(`공고 더 묶기`). 공고는 `jobs` 끝에, 표지 표 줄은 `row` 로, 공고 장은 마지막 공고
 * 장 뒤(없으면 안내 장 앞)에 넣는다. 이미 묶은 공고와 장·공고 수 상한을 넘는 공고는 넣지 않는다.
 */
export function addJobs(
  doc: CardDocument,
  added: { jobId: number; companyName: string; content: CardContent; row: [string, string] }[],
): CardDocument {
  const room = Math.min(MAX_SLIDES - doc.slides.length, MAX_BUNDLE_JOBS - doc.jobs.length);
  const taken = added
    .filter(({ jobId }) => !doc.jobs.some((job) => job.jobId === jobId))
    .slice(0, Math.max(0, room));
  if (taken.length === 0) {
    return doc;
  }
  const lastJob = doc.slides.map((slide) => slide.role).lastIndexOf('job');
  const profile = doc.slides.findIndex((slide) => slide.role === 'profile');
  const at = lastJob >= 0 ? lastJob + 1 : profile >= 0 ? profile : doc.slides.length;
  const slides = [...doc.slides];
  slides.splice(at, 0, ...taken.map((_, index) => newSlide('job', doc.jobs.length + index)));
  return {
    ...doc,
    jobs: [
      ...doc.jobs,
      ...taken.map(({ jobId, companyName, content: { caption: _caption, ...content } }) => ({
        jobId,
        companyName,
        content,
      })),
    ],
    ...(doc.cover
      ? { cover: { ...doc.cover, rows: [...doc.cover.rows, ...taken.map(({ row }) => row)] } }
      : {}),
    slides,
  };
}

/**
 * 묶음 공고 장 배치를 바꾼 문서(템플릿 서랍). 사람이 고른 것이라 `manual` 이 서고 자동 고르기를 멈춘다.
 * 배치 종류가 바뀌면 공고별 장 틀 편집값은 버린다 — 요소 자리가 배치마다 달라 옮긴 값이 엉뚱한 데 걸린다.
 * 공고 장을 다시 나누는 일은 `../card/bundle.ts` 의 `arrangeBundle()` 이 한다.
 */
export function withBundleLayout(doc: CardDocument, layout: BundleLayout): CardDocument {
  const { jobTemplateEdits: _template, ...rest } = doc;
  return {
    ...(layout.kind === bundleLayoutOf(doc).kind ? doc : rest),
    bundleLayout: layout,
  };
}

/**
 * 공고 장을 `groups`(장마다 놓을 공고들) 순서로 다시 나눈 문서. 지금 공고 장과 같으면 그대로 돌려준다. 새 공고
 * 장들은 첫 공고 장이 있던 자리에 놓고, 첫 공고가 같은 장은 그 장(id·편집값·자유 요소)을 이어 쓴다. 공고 순서는
 * 새 장 순서를 따른다(`withJobOrder()`).
 */
export function withJobGroups(doc: CardDocument, groups: number[][]): CardDocument {
  const current = doc.slides.filter((slide) => slide.role === 'job');
  const same =
    current.length === groups.length &&
    current.every((slide, index) => {
      const indices = slideJobIndices(slide);
      const group = groups[index]!;
      return indices.length === group.length && indices.every((value, at) => value === group[at]);
    });
  if (same) {
    return doc;
  }
  const unused = [...current];
  const slides = groups.map((group) => {
    const reuse = unused.findIndex((slide) => firstJobIndex(slide) === group[0]);
    const base = reuse >= 0 ? unused.splice(reuse, 1)[0]! : newSlide('job');
    return { ...base, jobIndices: group };
  });
  const first = doc.slides.findIndex((slide) => slide.role === 'job');
  const others = doc.slides.filter((slide) => slide.role !== 'job');
  const profile = others.findIndex((slide) => slide.role === 'profile');
  // 공고 장이 하나도 없던 문서면 안내 장 앞(없으면 끝)이다.
  const at =
    first >= 0
      ? doc.slides.slice(0, first).filter((slide) => slide.role !== 'job').length
      : profile >= 0
        ? profile
        : others.length;
  others.splice(at, 0, ...slides);
  return withJobOrder({ ...doc, slides: others });
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
