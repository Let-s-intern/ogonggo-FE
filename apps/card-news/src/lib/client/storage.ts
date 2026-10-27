import type { CardContent, CardSettings, Layer, SlideEdits, VariantId } from '../card/types';
import { getImage } from './imageStore';

/**
 * 편집 중인 카드를 이 브라우저에 공고별로 남긴다. 서버에는 저장하지 않는다 — 로그인이 없는
 * 앱이라 서버에 두면 주소를 아는 누구나 고칠 수 있다.
 *
 * 로고·썸네일은 남기지 않는다. data URL 이 커서 저장소 한도(약 5MB)를 금방 넘긴다. 자유 요소 이미지는
 * id 만 남기고 data URL 은 IndexedDB 에 둔다(`./imageStore.ts`).
 */
// v2: 시안 여러 개로 바뀌며 테마 대신 공용 설정을 남긴다. v1 편집본은 읽지 않는다.
const KEY_PREFIX = 'ogonggo.card-news.draft.v2.';

/** 템플릿별·장별 요소 편집값. */
export type CardEdits = Partial<Record<VariantId, SlideEdits[]>>;

/** 템플릿별·장별 자유 요소. */
export type CardLayers = Partial<Record<VariantId, Layer[][]>>;

export interface SavedCard {
  content: CardContent;
  settings: CardSettings;
  /** 예전 편집본에는 없다. */
  edits?: CardEdits;
  /** 예전 편집본에는 없다. 이미지 요소의 `src` 는 비어 있다. */
  layers?: CardLayers;
  savedAt: string;
}

export function loadCard(jobId: number): SavedCard | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${jobId}`);
    return raw ? (JSON.parse(raw) as SavedCard) : null;
  } catch {
    return null;
  }
}

export function saveCard(
  jobId: number,
  content: CardContent,
  settings: CardSettings,
  edits: CardEdits,
  layers: CardLayers,
): void {
  const { photo: _photo, ...rest } = settings;
  const saved: SavedCard = {
    content,
    settings: rest,
    edits,
    layers: mapLayers(layers, (layer) => (layer.kind === 'image' ? { ...layer, src: '' } : layer)),
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(`${KEY_PREFIX}${jobId}`, JSON.stringify(saved));
  } catch {
    // 저장소가 막혔거나 가득 찼다. 편집은 그대로 이어진다.
  }
}

function mapLayers(layers: CardLayers, map: (layer: Layer) => Layer | null): CardLayers {
  return Object.fromEntries(
    Object.entries(layers).map(([variant, slides]) => [
      variant,
      (slides ?? []).map((slide) => (slide ?? []).flatMap((layer) => map(layer) ?? [])),
    ]),
  ) as CardLayers;
}

/** 남긴 자유 요소에 이미지를 다시 채운다. 이미지를 찾지 못한 이미지 요소는 뺀다. */
export async function restoreLayers(layers: CardLayers | undefined): Promise<CardLayers> {
  const ids = new Set<string>();
  mapLayers(layers ?? {}, (layer) => {
    if (layer.kind === 'image') {
      ids.add(layer.imageId);
    }
    return layer;
  });
  const images = new Map(
    await Promise.all([...ids].map(async (id) => [id, await getImage(id)] as const)),
  );
  return mapLayers(layers ?? {}, (layer) => {
    if (layer.kind !== 'image') {
      return layer;
    }
    const src = images.get(layer.imageId);
    return src ? { ...layer, src } : null;
  });
}

export function clearCard(jobId: number): void {
  try {
    localStorage.removeItem(`${KEY_PREFIX}${jobId}`);
  } catch {
    // 위와 같다.
  }
}
