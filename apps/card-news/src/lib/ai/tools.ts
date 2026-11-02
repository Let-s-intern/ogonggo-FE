import {
  type CardDocument,
  type DocumentSlide,
  ROLE_LABELS,
  slideName,
  firstJobIndex,
  slideJobIndices,
  documentContent,
  slideVariant,
  withSlideContent,
  withTemplate,
  withSlideEdit,
  slideEditsOf,
  withSlideEdits,
  withSlideLayers,
  withBackground,
} from '../card/document';
import { contentFromDraft, draftFromContent } from '../card/fromJob';
import { textScale } from '../card/layout';
import {
  BACKGROUND_PATTERNS,
  CARD_SIZES,
  type CardBackground,
  type CardContent,
  type CardSection,
  type CardSettings,
  type CardSizeId,
  elementLabel,
  type ElementEdit,
  type ElementId,
  LAYER_WEIGHTS,
  type Layer,
  type Selection,
  type TextLayer,
  type SlideEdits,
  type VariantId,
  isElementId,
  isLayerRef,
  layerLabel,
  layerRef,
} from '../card/types';
import { visibleSectionLabels } from '../card/render/slides';
import { VARIANTS, variantOf } from '../card/variants';
import {
  type EditSnapshot,
  type LoadedCard,
  fetchCardJob,
  requestDraft,
} from '../client/useCardEditor';

/**
 * 편집 비서의 도구 실행기. 모델이 부른 도구를 브라우저에서 편집 상태에 실행한다. 도구의 이름과 인자
 * 모양은 `app/api/assistant/route.ts` 의 `TOOLS` 와 같다.
 *
 * 한 요청(사람이 보낸 말 하나) 안의 변경은 실행 취소 한 단계다 — 처음 바꾸기 전에 한 번만 기록에 쌓고
 * 그 뒤로는 쌓지 않고 바꾼다(`ToolSession`). 템플릿 바꾸기도 문서 변경이라 같이 되돌아간다.
 *
 * 실행기는 모델에게 돌려줄 글(JSON)을 만든다. 실패도 글로 돌려줘 모델이 고치거나 사용자에게 설명하게 한다.
 */

/** 캔버스에서 잰 요소 상자(1080 폭 좌표, 편집값이 걸린 자리). */
export interface MeasuredBox {
  /** 템플릿 요소 id, 자유 요소는 `layer:<id>`. */
  id: Selection;
  /** 이 요소를 감싼 요소(흰 판 안 섹션, 섹션 안 칩). 감싼 요소를 옮기면 같이 움직인다. */
  parent: ElementId | null;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 요소가 놓인 부모의 배율(1080 폭 기준). 상자를 옮긴 거리를 이 값으로 나누면 저장할 이동값이다. */
  factor: number;
}

export interface SlideMeasure {
  boxes: MeasuredBox[];
  overflow: boolean;
}

/** 편집 화면이 실행기에 넘기는 것. 모두 부를 때의 최신 값을 준다. */
export interface ToolContext {
  readLoaded: () => LoadedCard | null;
  /** 바꾸기 직전 값을 실행 취소 기록에 쌓는다. */
  remember: () => void;
  /** 기록에 쌓지 않고 바꾼다. */
  apply: (doc: EditSnapshot) => void;
  /** 문서 템플릿. 장에 덮어쓴 템플릿이 있으면 그 장은 그것이다(`slideVariant()`). */
  variant: () => VariantId;
  size: () => CardSizeId;
  /** 보고 있는 장(문서 장 순서, 0부터)과 고른 요소. */
  slide: () => number;
  selected: () => Selection | null;
  /** 지금 그려진 문서 장마다의 요소 상자와 넘침. 아직 그려지지 않았으면 `null`. */
  measure: () => SlideMeasure[] | null;
  /** AI 입력창 위 범위 알약. 범위 밖을 바꾸는 도구는 실행 전에 거절한다(`outOfScope()`). */
  scope: () => AssistantScope;
}

/** AI 로 고칠 범위. 고른 요소만, 보고 있는 장만, 모든 장. */
export type AssistantScope = 'selected' | 'slide' | 'all';

/** 요청 하나 동안 이어지는 실행기 상태. 첫 변경 앞에서만 기록에 쌓는다. */
export interface ToolSession {
  remembered: boolean;
}

/** 모델에게 돌려줄 결과의 최대 길이. */
const MAX_RESULT_LENGTH = 12_000;
/** 상태를 바꾼 뒤 화면이 다시 그려지기를 기다리는 시간. 상자를 재기 전에 둔다. */
const SETTLE_MS = 80;
/** 겹침·밖으로 나감을 따질 때 봐주는 px. 글자 상자가 몇 px 걸치는 것은 겹침이 아니다. */
const TOLERANCE = 2;
const MAX_OFFSET = 2000;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
const NO_EDIT: ElementEdit = { dx: 0, dy: 0, scale: 1 };

const HEX = /^#[0-9a-fA-F]{6}$/;
const HIGHLIGHTS = ['tint', 'brand', 'black', 'custom'] as const;
const LOGO_STYLES = ['auto', 'mono', 'original', 'plate'] as const;
const BRAND_MARKS = [
  'ogonggo',
  'ogonggoSymbol',
  'ogonggoClassic',
  'letscareer',
  'custom',
  'none',
] as const;
const TEXT_FIELDS = ['badge', 'headline', 'roleTitle', 'note', 'ctaHeadline', 'ctaSub', 'caption'];

/** 사용자에게 보일 진행 문구. 모델이 무엇을 하고 있는지 채팅 창에 한 줄로 적는다. */
export function describeToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'read_card':
      return '카드 읽기';
    case 'list_variants':
      return '템플릿 목록 보기';
    case 'pick_variant':
      return `템플릿 바꾸기: ${VARIANTS.find((v) => v.id === args.variant)?.label ?? String(args.variant)}`;
    case 'set_content':
      return `문구 바꾸기: ${Object.keys(args).join(', ')}`;
    case 'rewrite_copy':
      return `문구 다시 쓰기: ${String(args.instruction ?? '')}`;
    case 'set_settings':
      return `설정 바꾸기: ${Object.keys(args).join(', ')}`;
    case 'edit_elements': {
      const changes = Array.isArray(args.changes)
        ? (args.changes as Record<string, unknown>[])
        : [];
      const names = changes.map(
        (change) =>
          `${String(change.slide)}장 ${isElementId(change.id) ? elementLabel(change.id) : String(change.id)}`,
      );
      return `요소 바꾸기: ${names.join(', ')}`;
    }
    case 'reset_elements':
      return '요소 처음으로';
    case 'add_text':
      return `글자 넣기: ${String(args.text ?? '')}`;
    case 'edit_layers':
      return '자유 요소 바꾸기';
    case 'set_background':
      return describeBackgroundCall(args);
    default:
      return name;
  }
}

/** 모델에게 보내는 지금 화면 한 줄. "이거" 를 풀 때 쓴다. */
export function describeScreen(context: ToolContext): string {
  const selected = context.selected();
  const loaded = context.readLoaded();
  const slide = loaded?.doc.slides[context.slide()];
  const variant = variantOf(slide ? slideVariant(slide, context.variant()) : context.variant());
  const labels =
    loaded && slide
      ? visibleSectionLabels(
          { variant: variant.id, content: documentContent(loaded.doc, slide) },
          slide.role,
        )
      : [];
  const layer = isLayerRef(selected)
    ? slide?.layers[variant.id]?.find((item) => layerRef(item.id) === selected)
    : undefined;
  const name = !selected
    ? ''
    : isLayerRef(selected)
      ? layer
        ? layerLabel(layer)
        : '자유 요소'
      : elementLabel(selected, labels);
  const slides = loaded?.doc.slides ?? [];
  const doc = loaded?.doc;
  const here = context.slide() + 1;
  return [
    `템플릿 ${variant.id}(${variant.label})`,
    `크기 ${CARD_SIZES[context.size()].label}`,
    `장 ${slides.length}개(${slides.map((item, index) => `${index + 1} ${doc ? slideAlias(doc, item) : ROLE_LABELS[item.role]}`).join(' · ')})`,
    `보고 있는 장 ${here}`,
    `고른 요소 ${selected ? `${selected}(${name})` : '없음'}`,
    `범위 ${scopeLabel(context.scope(), selected ? `${selected}(${name})` : '', here)}`,
  ].join(', ');
}

/** 화면 설명의 장 이름. 묶음은 `표지`, `공고 2(영업)`, `안내` 로 도구의 장 지정과 같은 이름이다. */
function slideAlias(doc: CardDocument, slide: DocumentSlide): string {
  if (doc.kind !== 'bundle') {
    return ROLE_LABELS[slide.role];
  }
  if (slide.role === 'job') {
    return `공고 ${slideJobIndices(slide)
      .map((index) => index + 1)
      .join('·')}(${slideName(doc, slide)})`;
  }
  return slide.role === 'cover' ? '표지' : slide.role === 'profile' ? '안내' : ROLE_LABELS.free;
}

/** 범위 한 줄. 고른 것이 없으면 `선택한 요소` 범위도 `이 장 전체` 다. */
function scopeLabel(scope: AssistantScope, selected: string, slide: number): string {
  if (scope === 'all') {
    return '모든 장';
  }
  return scope === 'selected' && selected
    ? `선택한 요소 ${selected}, ${slide}장(이 요소만 바꾼다)`
    : `이 장 전체(${slide}장만 바꾼다)`;
}

function clip(text: string): string {
  return text.length > MAX_RESULT_LENGTH
    ? `${text.slice(0, MAX_RESULT_LENGTH)}\n(이하 생략)`
    : text;
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * 모델이 준 장 번호(문서 장 순서, 1부터)나 장 이름(`표지`, `공고 2`, `안내`)을 0부터의 장 순서로. 문서에
 * 없는 장이면 `null`. 장은 이 번호로 문서에서
 * 찾아 장 id 로 바꾼다 — 편집값은 장 id 에 붙는다.
 */
function asSlide(value: unknown, doc: CardDocument): number | null {
  if (typeof value === 'string') {
    const name = value.trim();
    if (/^\d+$/.test(name)) {
      return asSlide(Number(name), doc);
    }
    const job = /^공고\s*(\d+)$/.exec(name);
    const found = doc.slides.findIndex((slide) =>
      job
        ? slideJobIndices(slide).includes(Number(job[1]) - 1)
        : name === '표지'
          ? slide.role === 'cover'
          : (name === '안내' || name === '프로필 안내') && slide.role === 'profile',
    );
    return found >= 0 ? found : null;
  }
  const slide = asNumber(value);
  return slide !== null && Number.isInteger(slide) && slide >= 1 && slide <= doc.slides.length
    ? slide - 1
    : null;
}

function asElementId(value: unknown): ElementId | null {
  return isElementId(value) ? value : null;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 첫 변경 앞에서만 기록에 쌓고 바꾼다. */
function change(context: ToolContext, session: ToolSession, doc: CardDocument) {
  if (!session.remembered) {
    context.remember();
    session.remembered = true;
  }
  context.apply(doc);
}

function inside(a: MeasuredBox, b: MeasuredBox): boolean {
  return (
    a.x >= b.x - TOLERANCE &&
    a.y >= b.y - TOLERANCE &&
    a.x + a.width <= b.x + b.width + TOLERANCE &&
    a.y + a.height <= b.y + b.height + TOLERANCE
  );
}

/** 서로 걸친 요소 쌍. 한쪽이 다른 쪽 안에 통째로 든 것(흰 카드 안 로고)은 빼고, 숨긴 요소도 뺀다. */
function overlaps(boxes: MeasuredBox[], edits: SlideEdits | undefined): string[] {
  const shown = boxes.filter((box) => isLayerRef(box.id) || !edits?.[box.id]?.hidden);
  const pairs: string[] = [];
  shown.forEach((a, index) => {
    for (const b of shown.slice(index + 1)) {
      const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (width > TOLERANCE && height > TOLERANCE && !inside(a, b) && !inside(b, a)) {
        pairs.push(`${a.id}·${b.id}`);
      }
    }
  });
  return pairs;
}

/** 한 장의 요소 상자를 모델에게 줄 모양으로. */
function slideSummary(
  context: ToolContext,
  loaded: LoadedCard,
  { boxes, overflow }: SlideMeasure,
  slide: number,
) {
  const size = CARD_SIZES[context.size()];
  const docSlide = loaded.doc.slides[slide];
  const variant = docSlide ? slideVariant(docSlide, context.variant()) : context.variant();
  const edits = docSlide ? slideEditsOf(loaded.doc, docSlide)[variant] : undefined;
  const labels = docSlide
    ? visibleSectionLabels(
        { variant, content: documentContent(loaded.doc, docSlide) },
        docSlide.role,
      )
    : [];
  const outside = (box: MeasuredBox) =>
    box.x < -TOLERANCE ||
    box.y < -TOLERANCE ||
    box.x + box.width > size.width + TOLERANCE ||
    box.y + box.height > size.height + TOLERANCE;
  const layers = (docSlide?.layers[variant] ?? []).map((layer) => {
    const box = boxes.find((item) => item.id === layerRef(layer.id));
    const {
      src: _src,
      imageId: _imageId,
      ...shown
    } = layer.kind === 'image' ? layer : { ...layer, src: '', imageId: '' };
    return {
      ...shown,
      name: layerLabel(layer),
      height: Math.round(box?.height ?? (layer.kind === 'image' ? layer.height : 0)),
      outside: box ? outside(box) : false,
    };
  });
  const elements = boxes.flatMap((box) => {
    if (isLayerRef(box.id)) {
      return [];
    }
    const edit = edits?.[box.id] ?? NO_EDIT;
    return {
      id: box.id,
      name: elementLabel(box.id, labels),
      ...(box.parent ? { in: box.parent } : {}),
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
      edit: {
        dx: edit.dx,
        dy: edit.dy,
        scale: edit.scale,
        hidden: Boolean(edit.hidden),
        locked: Boolean(edit.locked),
      },
      outside: !edit.hidden && outside(box),
    };
  });
  return {
    slide: slide + 1,
    // 이 장에만 덮어쓴 템플릿. 없으면 문서 템플릿이다.
    ...(docSlide?.variant ? { variant } : {}),
    overflow,
    elements,
    layers,
    overlaps: overlaps(boxes, edits),
  };
}

/**
 * 바꾼 뒤의 확인. 다시 그려지기를 기다려 장마다 넘침, 캔버스 밖으로 나간 요소, 겹친 요소만 추린다.
 * 바꾸는 도구의 결과에 붙여 모델이 `read_card` 를 다시 부르지 않아도 되게 한다.
 */
async function check(context: ToolContext) {
  await settle();
  const loaded = context.readLoaded();
  const measured = context.measure();
  if (!loaded || !measured) {
    return null;
  }
  return measured.map((slide, index) => {
    const summary = slideSummary(context, loaded, slide, index);
    return {
      slide: summary.slide,
      overflow: summary.overflow,
      outside: [
        ...summary.elements.filter((element) => element.outside).map((element) => element.id),
        ...summary.layers.filter((layer) => layer.outside).map((layer) => layerRef(layer.id)),
      ],
      overlaps: summary.overlaps,
    };
  });
}

async function readCard(context: ToolContext): Promise<string> {
  await settle();
  const loaded = context.readLoaded();
  const measured = context.measure();
  if (!loaded || !measured) {
    return '카드가 아직 그려지지 않았습니다. 잠시 뒤 다시 읽어 주세요.';
  }
  const variant = context.variant();
  const size = CARD_SIZES[context.size()];
  const { photo, brandImage, background, ...settings } = loaded.doc.settings;
  return JSON.stringify({
    job: loaded.job ? { company: loaded.job.companyName, title: loaded.job.title } : null,
    variant: { id: variant, label: variantOf(variant).label },
    size: { id: context.size(), width: size.width, height: size.height },
    screen: { slide: context.slide() + 1, selected: context.selected() },
    settings: {
      ...settings,
      headlineScale: textScale(settings.headlineScale),
      bodyScale: textScale(settings.bodyScale),
      brandMark: settings.brandMark ?? 'ogonggo',
      photo: Boolean(photo),
      brandImage: Boolean(brandImage),
      logo: Boolean(loaded.logo),
    },
    background: backgroundSummary(loaded.doc, background),
    content: documentContent(loaded.doc),
    slides: measured.map((slide, index) => slideSummary(context, loaded, slide, index)),
  });
}

function listVariants(): string {
  return JSON.stringify(
    VARIANTS.map((variant) => ({
      id: variant.id,
      label: variant.label,
      description: variant.description,
    })),
  );
}

function pickVariant(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): string {
  const found = VARIANTS.find((variant) => variant.id === args.variant);
  const loaded = context.readLoaded();
  if (!found) {
    return `없는 템플릿입니다: ${String(args.variant)}`;
  }
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  change(context, session, withTemplate(loaded.doc, found.id));
  return `템플릿을 ${found.id}(${found.label}) 로 바꿨습니다. 요소 자리가 바뀌었으니 옮기기 전에 read_card 로 다시 읽으세요.`;
}

function asSections(value: unknown): CardSection[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const sections = value.flatMap((raw) => {
    const { label, items } = (raw ?? {}) as Record<string, unknown>;
    return typeof label === 'string' && Array.isArray(items)
      ? [{ label, items: items.filter((item): item is string => typeof item === 'string') }]
      : [];
  });
  return sections.length === value.length ? sections : null;
}

function setContent(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): string {
  const loaded = context.readLoaded();
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  // 장을 주지 않으면 보고 있는 장이다. 그 장이 그리는 공고(묶음 표지면 표지)의 문구를 고친다.
  const index = args.slide === undefined ? context.slide() : asSlide(args.slide, loaded.doc);
  const docSlide = index === null ? undefined : loaded.doc.slides[index];
  if (index === null || !docSlide) {
    return `없는 장입니다: ${String(args.slide)}`;
  }
  const patch: Partial<CardContent> = {};
  const rejected: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    if (key === 'slide') {
      continue;
    }
    if (TEXT_FIELDS.includes(key) && typeof value === 'string') {
      Object.assign(patch, { [key]: value.replace(/\\n/g, '\n') });
    } else if (key === 'summarySections' || key === 'detailSections') {
      const sections = asSections(value);
      if (sections) {
        patch[key] = sections;
      } else {
        rejected.push(key);
      }
    } else {
      rejected.push(key);
    }
  }
  if (Object.keys(patch).length > 0) {
    change(
      context,
      session,
      withSlideContent(loaded.doc, docSlide, {
        ...documentContent(loaded.doc, docSlide),
        ...patch,
      }),
    );
  }
  return JSON.stringify({ slide: index + 1, changed: Object.keys(patch), rejected });
}

async function rewriteCopy(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): Promise<string> {
  const loaded = context.readLoaded();
  const instruction = typeof args.instruction === 'string' ? args.instruction.trim() : '';
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  if (!instruction) {
    return 'instruction 이 비었습니다.';
  }
  // 장을 주지 않으면 보고 있는 장이다. 그 장이 그리는 공고의 원문으로 다시 쓴다.
  const index = args.slide === undefined ? context.slide() : asSlide(args.slide, loaded.doc);
  const docSlide = index === null ? undefined : loaded.doc.slides[index];
  if (index === null || !docSlide) {
    return `없는 장입니다: ${String(args.slide)}`;
  }
  if (loaded.doc.kind === 'bundle' && docSlide.role === 'cover') {
    return '묶음 표지는 공고 하나의 문구가 아니라 다시 쓸 수 없습니다. 표지 뱃지·제목·표는 set_content 로 고치세요.';
  }
  const documentJob = loaded.doc.jobs[firstJobIndex(docSlide)];
  if (!documentJob) {
    return '공고가 없는 문서라 문구를 다시 쓸 수 없습니다. set_content 로 고치세요.';
  }
  const job =
    loaded.job?.id === documentJob.jobId ? loaded.job : (await fetchCardJob(documentJob.jobId)).job;
  const result = await requestDraft({
    jobId: job.id,
    instruction,
    current: draftFromContent(documentContent(loaded.doc, docSlide)),
  });
  // 모델 없이 원문을 잘라 만든 초안은 지금 문구보다 거칠다. 바꾸지 않고 알린다.
  if (result.source === 'fallback') {
    return `다시 쓰지 못해 문구를 그대로 두었습니다. ${result.message ?? ''}`;
  }
  const latest = context.readLoaded() ?? loaded;
  const latestSlide = latest.doc.slides.find((slide) => slide.id === docSlide.id) ?? docSlide;
  const previous = documentContent(latest.doc, latestSlide);
  const rewritten = contentFromDraft(job, result.draft, previous);
  // 묶음은 게시물 본문이 하나이고, 공고 장의 직무명 자리는 표지 표의 모집 분야라 그대로 둔다. 게시물
  // 본문은 범위가 `모든 장` 일 때만 바꾸고, `선택한 요소` 범위면 그 요소의 문구 칸만 바꾼다.
  const kept: Partial<CardContent> = {
    ...(latest.doc.kind === 'bundle' ? { roleTitle: previous.roleTitle } : {}),
    ...(latest.doc.kind === 'bundle' || context.scope() !== 'all'
      ? { caption: previous.caption }
      : {}),
  };
  const selected = context.selected();
  const only = context.scope() === 'selected' && isElementId(selected) ? fieldsOf(selected) : null;
  const content: CardContent = only
    ? {
        ...previous,
        ...Object.fromEntries(only.map((key) => [key, rewritten[key]])),
        ...kept,
      }
    : { ...rewritten, ...kept };
  change(context, session, withSlideContent(latest.doc, latestSlide, content));
  return JSON.stringify({ slide: index + 1, changed: true, content });
}

function setSettings(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): string {
  const loaded = context.readLoaded();
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  const patch: Partial<CardSettings> = {};
  const rejected: string[] = [];
  const pick = <T extends string>(value: unknown, options: readonly T[]): T | null =>
    options.includes(value as T) ? (value as T) : null;
  for (const [key, value] of Object.entries(args)) {
    if ((key === 'brandColor' || key === 'highlightColor') && HEX.test(String(value))) {
      patch[key] = String(value).toUpperCase();
    } else if (key === 'highlight' && pick(value, HIGHLIGHTS)) {
      patch.highlight = pick(value, HIGHLIGHTS)!;
    } else if (key === 'logoStyle' && pick(value, LOGO_STYLES)) {
      patch.logoStyle = pick(value, LOGO_STYLES)!;
    } else if (key === 'brandMark' && pick(value, BRAND_MARKS)) {
      patch.brandMark = pick(value, BRAND_MARKS)!;
    } else if ((key === 'headlineScale' || key === 'bodyScale') && asNumber(value) !== null) {
      patch[key] = round(textScale(asNumber(value)!));
    } else {
      rejected.push(key);
    }
  }
  if (Object.keys(patch).length > 0) {
    change(context, session, { ...loaded.doc, settings: { ...loaded.doc.settings, ...patch } });
  }
  return JSON.stringify({ changed: patch, rejected });
}

/**
 * 요소를 옮기고 키운다. 모델은 상자 좌표(x, y)나 옮길 거리(dx, dy)로 말하고, 저장은 템플릿 자리에서
 * 옮긴 거리다. 요소 가운데가 움직인 거리를 부모 배율로 나눠 이동값에 더한다 — 배율은 가운데 기준이라
 * 크기를 바꿔도 가운데는 그대로다.
 */
async function editElements(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): Promise<string> {
  await settle();
  const loaded = context.readLoaded();
  const measured = context.measure();
  if (!loaded || !measured) {
    return '카드가 아직 그려지지 않았습니다. 잠시 뒤 다시 해 주세요.';
  }
  const changes = Array.isArray(args.changes) ? (args.changes as Record<string, unknown>[]) : [];
  if (changes.length === 0) {
    return 'changes 가 비었습니다.';
  }
  const size = CARD_SIZES[context.size()];
  let doc = loaded.doc;
  const results: unknown[] = [];
  const changed = new Set<string>();
  for (const raw of changes) {
    const slide = asSlide(raw.slide, doc);
    const id = asElementId(raw.id);
    const docSlide = slide === null ? undefined : doc.slides[slide];
    const boxes = slide === null ? [] : (measured[slide]?.boxes ?? []);
    const box = boxes.find((b) => b.id === id);
    if (slide === null || !docSlide || !id || !box) {
      results.push({ slide: raw.slide, id: raw.id, error: '그 장에 없는 요소입니다.' });
      continue;
    }
    // 감싼 요소를 옮기면 안쪽 요소는 따라 움직인다. 같은 호출에서 안쪽 요소까지 옮기면 두 번 옮겨진다.
    let parent = box.parent;
    while (parent && !changed.has(`${slide}:${parent}`)) {
      parent = boxes.find((b) => b.id === parent)?.parent ?? null;
    }
    if (parent) {
      results.push({
        slide: slide + 1,
        id,
        error: `${parent} 를 바꾸면 그 안의 ${id} 는 같이 움직입니다. 따로 옮길 때만 따로 부릅니다.`,
      });
      continue;
    }
    const variant = slideVariant(docSlide, context.variant());
    const edit = slideEditsOf(doc, docSlide)[variant]?.[id] ?? NO_EDIT;
    if (edit.locked) {
      results.push({ slide: slide + 1, id, error: '잠김. 사람이 잠근 요소라 바꾸지 않았습니다.' });
      continue;
    }
    changed.add(`${slide}:${id}`);
    const scale = clamp(asNumber(raw.scale) ?? edit.scale, MIN_SCALE, MAX_SCALE);
    const ratio = scale / edit.scale;
    const width = box.width * ratio;
    const height = box.height * ratio;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const align = String(raw.align ?? '');
    const target = (
      absolute: number | null,
      relative: number | null,
      center: number,
      half: number,
      aligned: boolean,
      middle: number,
    ) =>
      absolute !== null
        ? absolute + half
        : relative !== null
          ? center + relative
          : aligned
            ? middle
            : center;
    const nextX = target(
      asNumber(raw.x),
      asNumber(raw.dx),
      centerX,
      width / 2,
      align === 'horizontal' || align === 'both',
      size.width / 2,
    );
    const nextY = target(
      asNumber(raw.y),
      asNumber(raw.dy),
      centerY,
      height / 2,
      align === 'vertical' || align === 'both',
      size.height / 2,
    );
    const hidden = typeof raw.hidden === 'boolean' ? raw.hidden : edit.hidden;
    const next: ElementEdit = {
      dx: Math.round(clamp(edit.dx + (nextX - centerX) / box.factor, -MAX_OFFSET, MAX_OFFSET)),
      dy: Math.round(clamp(edit.dy + (nextY - centerY) / box.factor, -MAX_OFFSET, MAX_OFFSET)),
      scale: round(scale),
      ...(hidden ? { hidden: true } : {}),
    };
    doc = withSlideEdit(doc, docSlide.id, variant, id, next);
    // 같은 요소를 한 번 더 바꾸면 방금 옮긴 자리에서 이어 계산한다.
    Object.assign(box, {
      x: nextX - width / 2,
      y: nextY - height / 2,
      width,
      height,
    });
    results.push({
      slide: slide + 1,
      id,
      box: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(width),
        height: Math.round(height),
      },
      edit: next,
    });
  }
  if (doc !== loaded.doc) {
    change(context, session, doc);
  }
  return JSON.stringify({ results });
}

function resetElements(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): string {
  const loaded = context.readLoaded();
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  const slide = args.slide === undefined ? null : asSlide(args.slide, loaded.doc);
  if (args.slide !== undefined && slide === null) {
    return `없는 장입니다: ${String(args.slide)}`;
  }
  const ids = Array.isArray(args.ids)
    ? args.ids.map(asElementId).filter((id) => id !== null)
    : null;
  let doc = loaded.doc;
  loaded.doc.slides.forEach((docSlide, index) => {
    if (slide !== null && index !== slide) {
      return;
    }
    const variant = slideVariant(docSlide, context.variant());
    // 잠근 요소는 처음으로 돌리지 않는다.
    const edits = Object.fromEntries(
      Object.entries(slideEditsOf(loaded.doc, docSlide)[variant] ?? {}).filter(
        ([id, edit]) => edit?.locked || (ids !== null && !ids.includes(id as ElementId)),
      ),
    ) as SlideEdits;
    doc = withSlideEdits(doc, docSlide.id, variant, edits);
  });
  change(context, session, doc);
  return JSON.stringify({
    reset: { slide: slide === null ? 'all' : slide + 1, ids: ids ?? 'all' },
  });
}

/** 글자 요소 값 가운데 모델이 준 것만 검사해 꺼낸다. 틀린 값은 `rejected` 에 이름을 남긴다. */
function textPatch(raw: Record<string, unknown>, rejected: string[]): Partial<TextLayer> {
  const patch: Partial<TextLayer> = {};
  const number = (key: 'x' | 'y' | 'width' | 'fontSize', min: number, max: number) => {
    if (raw[key] === undefined) {
      return;
    }
    const value = asNumber(raw[key]);
    if (value === null) {
      rejected.push(key);
    } else {
      patch[key] = Math.round(clamp(value, min, max));
    }
  };
  number('x', -MAX_OFFSET, MAX_OFFSET);
  number('y', -MAX_OFFSET, MAX_OFFSET);
  number('width', 40, 2000);
  number('fontSize', 12, 300);
  if (typeof raw.text === 'string') {
    patch.text = raw.text.replace(/\\n/g, '\n').slice(0, 1000);
  }
  if (raw.fontWeight !== undefined) {
    const weight = asNumber(raw.fontWeight);
    if (weight === null) {
      rejected.push('fontWeight');
    } else {
      patch.fontWeight = LAYER_WEIGHTS.reduce((best, value) =>
        Math.abs(value - weight) < Math.abs(best - weight) ? value : best,
      );
    }
  }
  if (raw.color !== undefined) {
    if (HEX.test(String(raw.color))) {
      patch.color = String(raw.color).toUpperCase();
    } else {
      rejected.push('color');
    }
  }
  if (raw.align !== undefined) {
    if (raw.align === 'left' || raw.align === 'center' || raw.align === 'right') {
      patch.align = raw.align;
    } else {
      rejected.push('align');
    }
  }
  if (raw.lineHeight !== undefined) {
    const lineHeight = asNumber(raw.lineHeight);
    if (lineHeight === null) {
      rejected.push('lineHeight');
    } else {
      patch.lineHeight = round(clamp(lineHeight, 0.8, 3));
    }
  }
  return patch;
}

/** 글자 요소를 넣는다. 빠진 값은 편집 화면의 `텍스트 추가` 와 같다. */
function addText(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): string {
  const loaded = context.readLoaded();
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  const slide = asSlide(args.slide, loaded.doc);
  const docSlide = slide === null ? undefined : loaded.doc.slides[slide];
  if (slide === null || !docSlide) {
    return `없는 장입니다: ${String(args.slide)}`;
  }
  const rejected: string[] = [];
  const patch = textPatch(args, rejected);
  if (!patch.text?.trim()) {
    return 'text 가 비었습니다.';
  }
  const size = CARD_SIZES[context.size()];
  const width = patch.width ?? 840;
  const layer: TextLayer = {
    id: crypto.randomUUID().slice(0, 8),
    kind: 'text',
    text: patch.text,
    fontSize: 64,
    fontWeight: 700,
    color: '#111111',
    align: 'left',
    lineHeight: 1.3,
    width,
    x: Math.round((size.width - width) / 2),
    y: Math.round(size.height / 2),
    ...patch,
  };
  const variant = slideVariant(docSlide, context.variant());
  const layers = [...(docSlide.layers[variant] ?? []), layer];
  change(context, session, withSlideLayers(loaded.doc, docSlide.id, variant, layers));
  return JSON.stringify({ added: { slide: slide + 1, id: layer.id }, rejected });
}

/** 자유 요소를 고치거나 지운다. 이미지는 자리만 옮기거나 지운다(그림은 바꾸지 못한다). */
function editLayers(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): string {
  const loaded = context.readLoaded();
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  const changes = Array.isArray(args.changes) ? (args.changes as Record<string, unknown>[]) : [];
  if (changes.length === 0) {
    return 'changes 가 비었습니다.';
  }
  let next = loaded.doc;
  const results: unknown[] = [];
  for (const raw of changes) {
    const slide = asSlide(raw.slide, next);
    const id = String(raw.id ?? '').replace(/^layer:/, '');
    const docSlide = slide === null ? undefined : next.slides[slide];
    const variant = docSlide ? slideVariant(docSlide, context.variant()) : context.variant();
    const layers = docSlide?.layers[variant] ?? [];
    const layer = layers.find((item) => item.id === id);
    if (slide === null || !docSlide || !layer) {
      results.push({ slide: raw.slide, id: raw.id, error: '그 장에 없는 자유 요소입니다.' });
      continue;
    }
    if (layer.locked) {
      results.push({ slide: slide + 1, id, error: '잠김. 사람이 잠근 요소라 바꾸지 않았습니다.' });
      continue;
    }
    if (raw.remove === true) {
      next = withSlideLayers(
        next,
        docSlide.id,
        variant,
        layers.filter((item) => item !== layer),
      );
      results.push({ slide: slide + 1, id, removed: true });
      continue;
    }
    const rejected: string[] = [];
    const patch = textPatch(raw, rejected);
    // 글자를 바꾸면 공고 값과의 연결을 끊는다(사람이 캔버스에서 고칠 때와 같다).
    const updated: Layer =
      layer.kind === 'text'
        ? {
            ...layer,
            ...patch,
            ...(patch.text === undefined ? {} : { bind: undefined }),
          }
        : {
            ...layer,
            ...(patch.x !== undefined ? { x: patch.x } : {}),
            ...(patch.y !== undefined ? { y: patch.y } : {}),
          };
    next = withSlideLayers(
      next,
      docSlide.id,
      variant,
      layers.map((item) => (item === layer ? updated : item)),
    );
    results.push({ slide: slide + 1, id, changed: Object.keys(patch), rejected });
  }
  if (next !== loaded.doc) {
    change(context, session, next);
  }
  return JSON.stringify({ results });
}

/** 템플릿 글자 요소가 고치는 문구 칸. 글자가 아닌 요소(로고, 흰 판)면 빈 배열이다. */
function fieldsOf(id: ElementId): (keyof CardContent)[] {
  switch (id) {
    case 'badge':
    case 'headline':
    case 'roleTitle':
    case 'note':
    case 'ctaHeadline':
    case 'ctaSub':
      return [id];
    case 'jobTable':
      return ['summarySections'];
  }
  return id.startsWith('section-') ? ['summarySections', 'detailSections'] : [];
}

/** 고른 요소이거나 그 안의 요소(섹션의 칩·목록)인가. */
function withinSelected(target: string, selected: Selection): boolean {
  return target === selected || (!isLayerRef(selected) && target.startsWith(`${selected}-`));
}

/**
 * 범위 밖을 바꾸는 도구 호출이면 모델에게 돌려줄 거절 사유, 아니면 `null`. 실행 전에 막는다 — 라우트는
 * 편집본을 모르므로 브라우저가 막는다. 읽는 도구는 늘 된다. 모든 장에 걸리는 것(템플릿, 공통 설정)은
 * `모든 장` 에서만 바꾼다.
 */
export function outOfScope(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
): string | null {
  const loaded = context.readLoaded();
  const scope = context.scope();
  if (scope === 'all' || !loaded || name === 'read_card' || name === 'list_variants') {
    return null;
  }
  const selected = context.selected();
  const only = scope === 'selected' && selected ? selected : null;
  const here = context.slide();
  const where = only ? `선택한 요소 ${only}` : `이 장 전체(${here + 1}장)`;
  const refuse = (what: string) =>
    `범위 밖이라 실행하지 않았습니다: ${what}. 지금 범위는 ${where}입니다. 다른 곳을 대신 바꾸지 말고, 범위를 넓히려면 입력창 위 범위 알약을 바꾸라고 사용자에게 알리세요.`;
  /** 장을 주지 않으면 보고 있는 장으로 치는 도구가 있다. */
  const elsewhere = (value: unknown, defaultHere: boolean) =>
    (value === undefined ? (defaultHere ? here : null) : asSlide(value, loaded.doc)) !== here;
  switch (name) {
    case 'pick_variant':
      return refuse('템플릿은 모든 장에 걸립니다');
    case 'set_settings':
      return refuse(
        '색·로고·글자 배율은 모든 장에 걸립니다. 요소 하나의 크기는 edit_elements 의 scale 로 바꿉니다',
      );
    case 'add_text':
      return only
        ? refuse('새 글자 요소 넣기')
        : elsewhere(args.slide, false)
          ? refuse(`${String(args.slide)}장에 넣기`)
          : null;
    case 'edit_elements':
    case 'edit_layers': {
      const changes = Array.isArray(args.changes)
        ? (args.changes as Record<string, unknown>[])
        : [];
      for (const change of changes) {
        const target =
          name === 'edit_layers'
            ? layerRef(String(change.id ?? '').replace(/^layer:/, ''))
            : String(change.id ?? '');
        if (elsewhere(change.slide, false)) {
          return refuse(`${String(change.slide)}장의 ${target}`);
        }
        if (only && !withinSelected(target, only)) {
          return refuse(target);
        }
      }
      return null;
    }
    case 'reset_elements': {
      if (elsewhere(args.slide, false)) {
        return refuse(args.slide === undefined ? '모든 장 요소' : `${String(args.slide)}장 요소`);
      }
      const ids = Array.isArray(args.ids) ? args.ids.map(String) : null;
      return only && (!ids || !ids.every((id) => withinSelected(id, only)))
        ? refuse('고른 요소 밖의 요소')
        : null;
    }
    case 'set_content': {
      if (elsewhere(args.slide, true)) {
        return refuse(`${String(args.slide)}장 문구`);
      }
      const allowed = only && isElementId(only) ? fieldsOf(only) : null;
      const outside = Object.keys(args).filter(
        (key) => key !== 'slide' && allowed !== null && !allowed.includes(key as keyof CardContent),
      );
      return only && (!allowed || outside.length > 0)
        ? refuse(`문구 칸 ${outside.join(', ') || '(고른 요소는 문구 칸이 아님)'}`)
        : null;
    }
    case 'rewrite_copy':
      if (elsewhere(args.slide, true)) {
        return refuse(`${String(args.slide)}장 문구`);
      }
      return only && !(isElementId(only) && fieldsOf(only).length > 0)
        ? refuse('고른 요소는 글자가 아닙니다')
        : null;
    case 'set_background':
      return backgroundOutOfScope(args, only, elsewhere, refuse);
    default:
      return null;
  }
}

/** 카드를 바꾸는 도구. 결과에 바꾼 뒤의 확인(`check`)을 붙인다. */
const CHANGING_TOOLS = new Set([
  'set_content',
  'rewrite_copy',
  'set_settings',
  'edit_elements',
  'reset_elements',
  'add_text',
  'edit_layers',
  'set_background',
]);

function execute(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
  session: ToolSession,
): string | Promise<string> {
  switch (name) {
    case 'read_card':
      return readCard(context);
    case 'list_variants':
      return listVariants();
    case 'pick_variant':
      return pickVariant(context, session, args);
    case 'set_content':
      return setContent(context, session, args);
    case 'rewrite_copy':
      return rewriteCopy(context, session, args);
    case 'set_settings':
      return setSettings(context, session, args);
    case 'edit_elements':
      return editElements(context, session, args);
    case 'reset_elements':
      return resetElements(context, session, args);
    case 'add_text':
      return addText(context, session, args);
    case 'edit_layers':
      return editLayers(context, session, args);
    case 'set_background':
      return setBackground(context, session, args);
    default:
      return `모르는 도구입니다: ${name}`;
  }
}

/** 도구 하나를 실행하고 모델에게 돌려줄 글을 만든다. */
export async function runTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
  session: ToolSession,
): Promise<string> {
  try {
    const refused = outOfScope(name, args, context);
    if (refused) {
      return refused;
    }
    const result = await execute(name, args, context, session);
    // 실패는 글이다. 바꾼 경우(JSON)에만 확인을 붙인다.
    if (!CHANGING_TOOLS.has(name) || !result.startsWith('{')) {
      return clip(result);
    }
    const parsed = JSON.parse(result) as Record<string, unknown>;
    return clip(JSON.stringify({ ...parsed, check: await check(context) }));
  } catch (error) {
    return `도구 실행이 실패했습니다: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// 배경(배경 서랍과 같은 일). `set_background` 의 실행·범위·설명과 `read_card` 의 배경 요약을 여기 모은다.

/** 사진 배경의 처음 진하기. 배경 서랍과 같다. */
const BACKGROUND_PHOTO_OPACITY = 0.6;

function backgroundLabel(background: CardBackground | undefined): string | null {
  if (!background) {
    return null;
  }
  if (background.kind === 'color') {
    return `단색 ${background.color}`;
  }
  if (background.kind === 'pattern') {
    return `무늬 ${background.pattern}(${BACKGROUND_PATTERNS.find((item) => item.id === background.pattern)?.label ?? ''})`;
  }
  return `사진 ${background.imageId ? '올린 이미지' : '공고 대표 이미지'} 진하기 ${round(background.opacity)}`;
}

/** `read_card` 의 배경. 모든 장 배경과 장마다 덮어쓴 배경이고, 덮어쓰지 않았으면 템플릿 배경이다. */
function backgroundSummary(doc: CardDocument, background: CardBackground | undefined) {
  return {
    all: backgroundLabel(background) ?? '템플릿 배경',
    slides: doc.slides.flatMap((slide, index) => {
      const label = backgroundLabel(slide.background);
      return label ? [{ slide: index + 1, background: label }] : [];
    }),
  };
}

function describeBackgroundCall(args: Record<string, unknown>): string {
  const where = args.slide === undefined ? '모든 장' : `${String(args.slide)}장`;
  return `배경 바꾸기(${where}): ${String(args.kind)}${args.pattern ? ` ${String(args.pattern)}` : ''}${args.color ? ` ${String(args.color)}` : ''}`;
}

/** 장을 빼면 모든 장이라 `모든 장` 에서만, 장을 주면 보고 있는 장만. 고른 요소 범위에서는 막는다. */
function backgroundOutOfScope(
  args: Record<string, unknown>,
  only: Selection | null,
  elsewhere: (value: unknown, defaultHere: boolean) => boolean,
  refuse: (what: string) => string,
): string | null {
  if (args.slide === undefined) {
    return refuse(
      'slide 를 뺀 배경은 모든 장에 걸립니다. 이 장만 바꾸려면 slide 에 보고 있는 장을 줍니다',
    );
  }
  if (only) {
    return refuse('배경은 고른 요소가 아닙니다');
  }
  return elsewhere(args.slide, false) ? refuse(`${String(args.slide)}장 배경`) : null;
}

function setBackground(
  context: ToolContext,
  session: ToolSession,
  args: Record<string, unknown>,
): string {
  const loaded = context.readLoaded();
  if (!loaded) {
    return '편집 중인 카드가 없습니다.';
  }
  let slideId: string | undefined;
  if (args.slide !== undefined) {
    const index = asSlide(args.slide, loaded.doc);
    if (index === null) {
      return `없는 장입니다: ${String(args.slide)}`;
    }
    slideId = loaded.doc.slides[index]!.id;
  }
  let background: CardBackground | null;
  switch (args.kind) {
    case 'clear':
      background = null;
      break;
    case 'color':
      if (!HEX.test(String(args.color))) {
        return `색은 #RRGGBB 로 줍니다: ${String(args.color)}`;
      }
      background = { kind: 'color', color: String(args.color).toUpperCase() };
      break;
    case 'pattern': {
      const pattern = BACKGROUND_PATTERNS.find((item) => item.id === args.pattern);
      if (!pattern) {
        return `없는 무늬입니다: ${String(args.pattern)}`;
      }
      background = { kind: 'pattern', pattern: pattern.id };
      break;
    }
    case 'photo':
      if (!loaded.doc.settings.photo) {
        return '공고 대표 이미지가 없어 사진 배경을 깔 수 없습니다.';
      }
      background = {
        kind: 'photo',
        src: '',
        opacity: round(clamp(asNumber(args.opacity) ?? BACKGROUND_PHOTO_OPACITY, 0.1, 1)),
      };
      break;
    default:
      return `kind 는 color, pattern, photo, clear 중 하나입니다: ${String(args.kind)}`;
  }
  change(context, session, withBackground(loaded.doc, background, slideId));
  return JSON.stringify({
    changed: {
      where: slideId ? `${String(args.slide)}장` : '모든 장',
      background: backgroundLabel(background ?? undefined) ?? '덮어쓰기 지움',
    },
  });
}
