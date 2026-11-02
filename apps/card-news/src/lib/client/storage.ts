import {
  type CardDocument,
  documentTitle,
  migrateDocument,
  singleDocument,
} from '../card/document';
import type {
  CardBackground,
  CardContent,
  CardSettings,
  Layer,
  SlideEdits,
  VariantId,
} from '../card/types';
import { getImage } from './imageStore';

/**
 * 편집 중인 문서를 이 브라우저에 문서별로 남긴다. 서버에는 저장하지 않는다 — 로그인이 없는
 * 앱이라 서버에 두면 주소를 아는 누구나 고칠 수 있다.
 *
 * 로고·썸네일은 남기지 않는다. data URL 이 커서 저장소 한도(약 5MB)를 금방 넘긴다. 자유 요소 이미지는
 * id 만 남기고 data URL 은 IndexedDB 에 둔다(`./imageStore.ts`).
 */
// v3: 공고 하나의 세 장 대신 장 목록 문서(`CardDocument`)를 문서 id 로 남긴다.
const DOC_PREFIX = 'ogonggo.card-news.doc.v3.';
/** 최근 문서 목록. 이어 하기에 쓸 id·제목·저장 시각만 둔다. */
const INDEX_KEY = 'ogonggo.card-news.docs.v3';
// v2: 시안 여러 개로 바뀌며 테마 대신 공용 설정을 남긴다. v1 편집본은 읽지 않는다. 처음 열 때 v3 로
// 옮기고 지우지 않는다.
const LEGACY_PREFIX = 'ogonggo.card-news.draft.v2.';

/** v2 편집본. 템플릿별·장 번호 순서의 편집값을 든다. */
interface LegacyCard {
  content: CardContent;
  settings: CardSettings;
  /** 예전 편집본에는 없다. */
  edits?: Partial<Record<VariantId, SlideEdits[]>>;
  /** 예전 편집본에는 없다. 이미지 요소의 `src` 는 비어 있다. */
  layers?: Partial<Record<VariantId, Layer[][]>>;
  savedAt: string;
}

export interface DocumentEntry {
  id: string;
  title: string;
  savedAt: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** 최근 문서 목록. 저장 시각이 늦은 것부터. */
export function listDocuments(): DocumentEntry[] {
  return read<DocumentEntry[]>(INDEX_KEY) ?? [];
}

/** 남은 문서. 없으면 `null`. 이미지 요소의 `src` 는 비어 있다(`restoreLayers`). */
export function loadDocument(id: string): CardDocument | null {
  const saved = read<CardDocument>(`${DOC_PREFIX}${id}`);
  return saved ? migrateDocument(saved) : null;
}

/**
 * 공고 하나로 만든 문서를 읽는다. v3 가 없고 v2 편집본이 있으면 `single` 문서로 옮겨 돌려준다 — 옮긴
 * 문서는 편집 화면이 고칠 때 v3 로 남긴다. 이미지 요소의 `src` 는 비어 있다(`restoreLayers`).
 */
export function loadSingleDocument(job: { id: number; companyName: string }): CardDocument | null {
  const saved = read<CardDocument>(`${DOC_PREFIX}job-${job.id}`);
  if (saved) {
    return migrateDocument(saved);
  }
  const legacy = read<LegacyCard>(`${LEGACY_PREFIX}${job.id}`);
  return legacy
    ? singleDocument(job, legacy.content, legacy.settings, {
        edits: legacy.edits,
        layers: legacy.layers,
      })
    : null;
}

function mapLayers(doc: CardDocument, map: (layer: Layer) => Layer | null): CardDocument {
  return {
    ...doc,
    slides: doc.slides.map((slide) => ({
      ...slide,
      layers: Object.fromEntries(
        Object.entries(slide.layers).map(([variant, layers]) => [
          variant,
          (layers ?? []).flatMap((layer) => map(layer) ?? []),
        ]),
      ),
    })),
  };
}

/** 문서 배경과 장 배경을 바꾼다. */
function mapBackgrounds(
  doc: CardDocument,
  map: (background: CardBackground) => CardBackground | undefined,
): CardDocument {
  const { background, ...settings } = doc.settings;
  const next = background && map(background);
  return {
    ...doc,
    settings: next ? { ...settings, background: next } : settings,
    slides: doc.slides.map(({ background: own, ...slide }) => {
      const mapped = own && map(own);
      return mapped ? { ...slide, background: mapped } : slide;
    }),
  };
}

export function saveDocument(doc: CardDocument): void {
  // 올린 브랜드 로고는 문서마다가 아니라 이 브라우저에 하나다. IndexedDB 에 둔다(`BRAND_IMAGE_ID`).
  const { photo: _photo, brandImage: _brandImage, ...settings } = doc.settings;
  const savedAt = new Date().toISOString();
  // 배경 사진도 id 만 남긴다(올린 이미지는 IndexedDB, 썸네일은 열 때 다시 받는다).
  const saved: CardDocument = mapLayers(
    mapBackgrounds({ ...doc, settings }, (background) =>
      background.kind === 'photo' ? { ...background, src: '' } : background,
    ),
    (layer) => (layer.kind === 'image' ? { ...layer, src: '' } : layer),
  );
  const entry: DocumentEntry = { id: doc.id, title: documentTitle(doc), savedAt };
  try {
    localStorage.setItem(`${DOC_PREFIX}${doc.id}`, JSON.stringify(saved));
    localStorage.setItem(
      INDEX_KEY,
      JSON.stringify([entry, ...listDocuments().filter((item) => item.id !== doc.id)]),
    );
  } catch {
    // 저장소가 막혔거나 가득 찼다. 편집은 그대로 이어진다.
  }
}

/**
 * 남긴 자유 요소와 배경 사진에 이미지를 다시 채운다. 이미지를 찾지 못한 이미지 요소는 빼고, 찾지 못한 배경
 * 사진은 덮어쓰기를 지운다(시안 배경).
 */
export async function restoreLayers(doc: CardDocument): Promise<CardDocument> {
  const ids = new Set<string>();
  mapLayers(doc, (layer) => {
    if (layer.kind === 'image') {
      ids.add(layer.imageId);
    }
    return layer;
  });
  mapBackgrounds(doc, (background) => {
    if (background.kind === 'photo' && background.imageId) {
      ids.add(background.imageId);
    }
    return background;
  });
  const images = new Map(
    await Promise.all([...ids].map(async (id) => [id, await getImage(id)] as const)),
  );
  const restored = mapBackgrounds(doc, (background) => {
    if (background.kind !== 'photo' || !background.imageId) {
      return background;
    }
    const src = images.get(background.imageId);
    return src ? { ...background, src } : undefined;
  });
  return mapLayers(restored, (layer) => {
    if (layer.kind !== 'image') {
      return layer;
    }
    const src = images.get(layer.imageId);
    return src ? { ...layer, src } : null;
  });
}

const NOTICE_KEY = 'ogonggo.card-news.notice.';

/**
 * 편집 화면을 열 때 한 번 보일 알림을 남긴다. 시작 화면에서 묶음을 만들고 바로 편집 화면으로 가면
 * 시작 화면의 알림(묶음 초안이 대체 초안이었다)이 사라져서다. 이 탭에만 남는다(sessionStorage).
 */
export function rememberNotice(docId: string, message: string): void {
  try {
    sessionStorage.setItem(`${NOTICE_KEY}${docId}`, message);
  } catch {
    // 남기지 못하면 알리지 않는다.
  }
}

/** 남긴 알림을 꺼내고 지운다. 없으면 `null`. */
export function takeNotice(docId: string): string | null {
  try {
    const message = sessionStorage.getItem(`${NOTICE_KEY}${docId}`);
    sessionStorage.removeItem(`${NOTICE_KEY}${docId}`);
    return message;
  } catch {
    return null;
  }
}
