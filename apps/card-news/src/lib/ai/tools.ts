import { contentFromDraft, draftFromContent } from '../card/fromJob';
import { textScale } from '../card/layout';
import {
  CARD_SIZES,
  type CardContent,
  type CardSection,
  type CardSettings,
  type CardSizeId,
  elementLabel,
  type ElementEdit,
  type ElementId,
  SLIDE_COUNT,
  type SlideEdits,
  type VariantId,
  isElementId,
} from '../card/types';
import { visibleSectionLabels } from '../card/render/slides';
import { VARIANTS, variantOf } from '../card/variants';
import type { CardEdits } from '../client/storage';
import { type EditSnapshot, type LoadedCard, requestDraft } from '../client/useCardEditor';

/**
 * 편집 비서의 도구 실행기. 모델이 부른 도구를 브라우저에서 편집 상태에 실행한다. 도구의 이름과 인자
 * 모양은 `app/api/assistant/route.ts` 의 `TOOLS` 와 같다.
 *
 * 한 요청(사람이 보낸 말 하나) 안의 변경은 실행 취소 한 단계다 — 처음 바꾸기 전에 한 번만 기록에 쌓고
 * 그 뒤로는 쌓지 않고 바꾼다(`ToolSession`). 고른 템플릿은 기록에 들지 않는다(사람이 고를 때와 같다).
 *
 * 실행기는 모델에게 돌려줄 글(JSON)을 만든다. 실패도 글로 돌려줘 모델이 고치거나 사용자에게 설명하게 한다.
 */

/** 캔버스에서 잰 요소 상자(1080 폭 좌표, 편집값이 걸린 자리). */
export interface MeasuredBox {
  id: ElementId;
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
  apply: (patch: Partial<EditSnapshot>) => void;
  variant: () => VariantId;
  pickVariant: (variant: VariantId) => void;
  size: () => CardSizeId;
  /** 보고 있는 장(0부터)과 고른 요소. */
  slide: () => number;
  selected: () => ElementId | null;
  /** 지금 그려진 세 장의 요소 상자와 넘침. 아직 그려지지 않았으면 `null`. */
  measure: () => SlideMeasure[] | null;
}

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
const BRAND_MARKS = ['ogonggo', 'letscareer'] as const;
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
    default:
      return name;
  }
}

/** 모델에게 보내는 지금 화면 한 줄. "이거" 를 풀 때 쓴다. */
export function describeScreen(context: ToolContext): string {
  const variant = variantOf(context.variant());
  const selected = context.selected();
  const loaded = context.readLoaded();
  const labels = loaded
    ? visibleSectionLabels({ variant: variant.id, content: loaded.content }, context.slide())
    : [];
  return [
    `템플릿 ${variant.id}(${variant.label})`,
    `크기 ${CARD_SIZES[context.size()].label}`,
    `보고 있는 장 ${context.slide() + 1}`,
    `고른 요소 ${selected ? `${selected}(${elementLabel(selected, labels)})` : '없음'}`,
  ].join(', ');
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

/** 1~3 장 번호를 0부터로. 아니면 `null`. */
function asSlide(value: unknown): number | null {
  const slide = asNumber(value);
  return slide !== null && Number.isInteger(slide) && slide >= 1 && slide <= SLIDE_COUNT
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
function change(context: ToolContext, session: ToolSession, patch: Partial<EditSnapshot>) {
  if (!session.remembered) {
    context.remember();
    session.remembered = true;
  }
  context.apply(patch);
}

function withEdit(
  edits: CardEdits,
  variant: VariantId,
  slide: number,
  id: ElementId,
  edit: ElementEdit | null,
): CardEdits {
  const slides: SlideEdits[] = [...(edits[variant] ?? [])];
  const { [id]: _previous, ...others } = slides[slide] ?? {};
  slides[slide] = edit ? { ...others, [id]: edit } : others;
  return { ...edits, [variant]: slides };
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
  const shown = boxes.filter((box) => !edits?.[box.id]?.hidden);
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
  const variant = context.variant();
  const edits = loaded.edits[variant]?.[slide];
  const labels = visibleSectionLabels({ variant, content: loaded.content }, slide);
  const elements = boxes.map((box) => {
    const edit = edits?.[box.id] ?? NO_EDIT;
    return {
      id: box.id,
      name: elementLabel(box.id, labels),
      ...(box.parent ? { in: box.parent } : {}),
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
      edit: { dx: edit.dx, dy: edit.dy, scale: edit.scale, hidden: Boolean(edit.hidden) },
      outside:
        !edit.hidden &&
        (box.x < -TOLERANCE ||
          box.y < -TOLERANCE ||
          box.x + box.width > size.width + TOLERANCE ||
          box.y + box.height > size.height + TOLERANCE),
    };
  });
  return { slide: slide + 1, overflow, elements, overlaps: overlaps(boxes, edits) };
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
      outside: summary.elements.filter((element) => element.outside).map((element) => element.id),
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
  const { photo, ...settings } = loaded.settings;
  return JSON.stringify({
    job: { company: loaded.job.companyName, title: loaded.job.title },
    variant: { id: variant, label: variantOf(variant).label },
    size: { id: context.size(), width: size.width, height: size.height },
    screen: { slide: context.slide() + 1, selected: context.selected() },
    settings: {
      ...settings,
      headlineScale: textScale(settings.headlineScale),
      bodyScale: textScale(settings.bodyScale),
      brandMark: settings.brandMark ?? 'ogonggo',
      photo: Boolean(photo),
      logo: Boolean(loaded.logo),
    },
    content: loaded.content,
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

function pickVariant(context: ToolContext, args: Record<string, unknown>): string {
  const found = VARIANTS.find((variant) => variant.id === args.variant);
  if (!found) {
    return `없는 템플릿입니다: ${String(args.variant)}`;
  }
  context.pickVariant(found.id);
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
  const patch: Partial<CardContent> = {};
  const rejected: string[] = [];
  for (const [key, value] of Object.entries(args)) {
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
    change(context, session, { content: { ...loaded.content, ...patch } });
  }
  return JSON.stringify({ changed: Object.keys(patch), rejected });
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
  const result = await requestDraft({
    jobId: loaded.job.id,
    instruction,
    current: draftFromContent(loaded.content),
  });
  // 모델 없이 원문을 잘라 만든 초안은 지금 문구보다 거칠다. 바꾸지 않고 알린다.
  if (result.source === 'fallback') {
    return `다시 쓰지 못해 문구를 그대로 두었습니다. ${result.message ?? ''}`;
  }
  const latest = context.readLoaded() ?? loaded;
  const content = contentFromDraft(latest.job, result.draft, latest.content);
  change(context, session, { content });
  return JSON.stringify({ changed: true, content });
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
    change(context, session, { settings: { ...loaded.settings, ...patch } });
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
  const variant = context.variant();
  const size = CARD_SIZES[context.size()];
  let edits = loaded.edits;
  const results: unknown[] = [];
  const changed = new Set<string>();
  for (const raw of changes) {
    const slide = asSlide(raw.slide);
    const id = asElementId(raw.id);
    const boxes = slide === null ? [] : (measured[slide]?.boxes ?? []);
    const box = boxes.find((b) => b.id === id);
    if (slide === null || !id || !box) {
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
    changed.add(`${slide}:${id}`);
    const edit = edits[variant]?.[slide]?.[id] ?? NO_EDIT;
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
    edits = withEdit(edits, variant, slide, id, next);
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
  if (edits !== loaded.edits) {
    change(context, session, { edits });
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
  const variant = context.variant();
  const slide = args.slide === undefined ? null : asSlide(args.slide);
  if (args.slide !== undefined && slide === null) {
    return `없는 장입니다: ${String(args.slide)}`;
  }
  const ids = Array.isArray(args.ids)
    ? args.ids.map(asElementId).filter((id) => id !== null)
    : null;
  const slides = (loaded.edits[variant] ?? []).map((edits, index) => {
    if (slide !== null && index !== slide) {
      return edits;
    }
    if (!ids) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(edits ?? {}).filter(([id]) => !ids.includes(id as ElementId)),
    ) as SlideEdits;
  });
  change(context, session, { edits: { ...loaded.edits, [variant]: slides } });
  return JSON.stringify({
    reset: { slide: slide === null ? 'all' : slide + 1, ids: ids ?? 'all' },
  });
}

/** 카드를 바꾸는 도구. 결과에 바꾼 뒤의 확인(`check`)을 붙인다. */
const CHANGING_TOOLS = new Set([
  'set_content',
  'rewrite_copy',
  'set_settings',
  'edit_elements',
  'reset_elements',
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
      return pickVariant(context, args);
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
