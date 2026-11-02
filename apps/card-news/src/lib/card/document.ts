import type {
  CardContent,
  CardLogo,
  CardSettings,
  CardSpec,
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

export interface CardDocument {
  /** 저장 열쇠. `single` 은 `job-<jobId>`, 나머지는 무작위다. */
  id: string;
  kind: DocumentKind;
  /** 묶은 순서. `blank` 는 빈 배열이다. */
  jobs: DocumentJob[];
  /** 시작 화면에서 적은 요청사항·추가 정보. */
  request: string;
  /** 마지막으로 고른 시안. */
  variant: VariantId;
  /** 모든 장이 같이 쓴다. */
  settings: CardSettings;
  /** 1~`MAX_SLIDES` 장. */
  slides: DocumentSlide[];
  /** 인스타그램 게시물 본문. 카드에는 그리지 않는다. */
  caption: string;
}

export function newSlideId(): string {
  return crypto.randomUUID().slice(0, 8);
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

/** 장이 그리는 공고. 표지·안내처럼 공고를 가리키지 않는 장은 첫 공고다. */
function slideJob(doc: CardDocument, slide?: DocumentSlide): DocumentJob {
  const job = doc.jobs[slide?.jobIndex ?? 0] ?? doc.jobs[0];
  if (!job) {
    // 빈 캔버스 문서는 아직 만들지 않는다(시작 화면이 들어올 때 정한다).
    throw new Error('공고가 없는 문서는 아직 그리지 못합니다.');
  }
  return job;
}

/** 장 하나가 그리는 문구. 인스타그램 본문은 문서 것을 붙인다. */
export function documentContent(doc: CardDocument, slide?: DocumentSlide): CardContent {
  return { ...slideJob(doc, slide).content, caption: doc.caption };
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
  return {
    spec: {
      variant,
      content: documentContent(doc, slide),
      settings: variantOf(variant).image && photo ? { ...shared, photo } : shared,
      logo,
      companyName: job.companyName,
      edits: slide.edits[variant],
      layers: slide.layers[variant],
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
