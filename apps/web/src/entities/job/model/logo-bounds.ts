import { logoProxyUrl } from './logo-proxy';

/**
 * 로고 이미지 안에서 실제 그림이 있는 범위(여백을 뺀 사각형). 원본 픽셀 좌표다.
 */
export interface LogoBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 배경색과 이 거리(RGB 유클리드)보다 멀면 그림으로 본다. */
const COLOR_DISTANCE = 40;
/** 이 알파보다 투명하면 배경으로 본다. */
const MIN_ALPHA = 16;
/** 테두리 선을 찾는 가장자리 폭 — 이미지 변 길이 대비 비율. */
const FRAME_EDGE = 0.15;
/** 한 줄의 이 비율 이상이 그림이면 테두리 선 후보다. */
const FRAME_FILL = 0.85;
/** 테두리 선 바로 안쪽 줄은 이 비율 이하만 그림이어야 한다(선과 로고 사이의 여백). */
const FRAME_GAP_FILL = 0.1;

/** 배경색을 볼 자리. 모서리에서 변 길이의 이 비율만큼 안쪽이다 — 1~2px 테두리 선을 건너뛴다. */
const CORNER_INSET = 0.03;

/**
 * 네 모서리가 흰색이 아닌 같은 색으로 칠해져 있으면 그 배경까지 로고다(수면밀도의 베이지 사각형).
 * 이런 로고의 여백을 자르면 배경이 글자에 딱 붙게 잘려 오히려 어색하다 — 2026-09-30 프록시로
 * 픽셀을 읽게 되자 실제로 그렇게 보였다. 흰 바탕이나 투명 바탕은 여기 걸리지 않는다.
 */
function hasSolidBackground(data: Uint8ClampedArray, width: number, height: number): boolean {
  const at = (i: number) => data[i] ?? 0;
  const pixel = (x: number, y: number) => {
    const i = (Math.round(y) * width + Math.round(x)) * 4;
    return [at(i), at(i + 1), at(i + 2), at(i + 3)] as const;
  };
  const dx = (width - 1) * CORNER_INSET;
  const dy = (height - 1) * CORNER_INSET;
  const corners = [
    pixel(dx, dy),
    pixel(width - 1 - dx, dy),
    pixel(dx, height - 1 - dy),
    pixel(width - 1 - dx, height - 1 - dy),
  ];
  const distance = (a: readonly number[], b: readonly number[]) =>
    Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0), (a[2] ?? 0) - (b[2] ?? 0));
  const [first] = corners;
  return (
    first !== undefined &&
    corners.every(
      (corner) => corner[3] >= 255 - MIN_ALPHA && distance(corner, first) <= COLOR_DISTANCE,
    ) &&
    distance(first, [255, 255, 255]) > COLOR_DISTANCE
  );
}

/**
 * RGBA 픽셀 배열에서 그림이 있는 범위를 구한다. 좌표는 입력 배열 기준이다.
 *
 * 크롤러가 모은 로고는 구글 이미지 캐시 썸네일이라 안쪽 여백이 제각각이고, 일부(비즈테크아이)는
 * 여백 바깥에 얇은 회색 테두리까지 그려져 있다. 그래서 두 단계로 자른다.
 *
 * 1. 가장자리 15% 안에서 거의 한 줄을 다 채우고, 바로 안쪽 줄은 거의 비어 있는 행·열을 테두리
 *    선으로 보고 그 안쪽만 남긴다. "안쪽이 비어 있다" 조건이 빠지면 여백 없이 가장자리에 붙은
 *    로고(LG 원형 마크, 굵은 글자 줄, 카카오톡 노란 사각형)가 테두리로 오인되어 잘린다 — 시드 로고
 *    32장으로 확인했다.
 * 2. 남은 영역에서 배경색(왼쪽 위 모서리 픽셀)과 다른 픽셀의 경계 사각형을 구한다.
 *
 * 배경이 칠해진 로고(`hasSolidBackground`)는 자르지 않고 이미지 전체를 돌려준다.
 * 그림이 하나도 없으면(단색 이미지) `null`.
 */
export function findContentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): LogoBounds | null {
  const at = (i: number) => data[i] ?? 0;
  const bgR = at(0);
  const bgG = at(1);
  const bgB = at(2);
  const bgTransparent = at(3) < MIN_ALPHA;

  if (hasSolidBackground(data, width, height)) {
    return { x: 0, y: 0, width, height };
  }

  const isContent = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (at(i + 3) < MIN_ALPHA) return false;
    if (bgTransparent) return true;
    const dr = at(i) - bgR;
    const dg = at(i + 1) - bgG;
    const db = at(i + 2) - bgB;
    return dr * dr + dg * dg + db * db > COLOR_DISTANCE * COLOR_DISTANCE;
  };

  const rowFill = new Uint32Array(height);
  const colFill = new Uint32Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isContent(x, y)) {
        rowFill[y] = (rowFill[y] ?? 0) + 1;
        colFill[x] = (colFill[x] ?? 0) + 1;
      }
    }
  }

  // 테두리 선: 가장자리 띠 안에서 "꽉 찬 줄 + 바로 안쪽은 빈 줄" 중 가장 안쪽 것의 안쪽부터 본다.
  const isFrame = (fill: Uint32Array, i: number, inward: number, span: number) =>
    (fill[i] ?? 0) > span * FRAME_FILL && (fill[i + inward] ?? 0) <= span * FRAME_GAP_FILL;
  const edgeY = Math.floor(height * FRAME_EDGE);
  const edgeX = Math.floor(width * FRAME_EDGE);
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;
  for (let y = 0; y < edgeY; y++) if (isFrame(rowFill, y, 1, width)) top = y + 1;
  for (let y = height - 1; y >= height - edgeY; y--) {
    if (isFrame(rowFill, y, -1, width)) bottom = y - 1;
  }
  for (let x = 0; x < edgeX; x++) if (isFrame(colFill, x, 1, height)) left = x + 1;
  for (let x = width - 1; x >= width - edgeX; x--) {
    if (isFrame(colFill, x, -1, height)) right = x - 1;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (!isContent(x, y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** 여백을 재는 캔버스의 긴 변. 범위만 구하면 되므로 원본 해상도가 필요 없다. */
const SAMPLE_SIZE = 128;

export type LogoMeasure =
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'ready'; naturalWidth: number; naturalHeight: number; bounds: LogoBounds };

const PENDING: LogoMeasure = { status: 'pending' };
const measures = new Map<string, LogoMeasure>();
const listeners = new Map<string, Set<() => void>>();

function settle(url: string, measure: LogoMeasure) {
  measures.set(url, measure);
  listeners.get(url)?.forEach((notify) => notify());
}

/**
 * 이미지를 한 번 받아 여백을 뺀 범위를 원본 픽셀 좌표로 기록한다.
 *
 * 로고 호스트(구글 이미지 캐시)가 `access-control-allow-origin: *` 를 보내서 캔버스로 픽셀을 읽을
 * 수 있다. 그 헤더가 빠져 픽셀을 못 읽으면 이미지 전체를 범위로 둔다 — 여백 제거 전과 같은 모습이다.
 * 이미지 자체가 안 뜨면 `error` 로 두고, 컴포넌트가 기본 썸네일로 떨어진다.
 *
 * `crossOrigin` 을 켠 채로는 그 헤더가 없는 호스트의 이미지가 로드부터 실패한다(API 로고가 있는
 * S3 버킷, 2026-09-30 실측). 그래서 실패하면 `crossOrigin` 없이 한 번 더 받아 보고, 뜨면 전체를
 * 범위로 둔다. 두 번째도 실패해야 `error` 다.
 *
 * 그런 호스트 중 목록에 든 것(`logo-proxy.ts`)은 처음부터 우리 서버를 거쳐 같은 출처로 받는다.
 * 그러면 픽셀을 읽을 수 있어 여백이 잘린다 — 여백이 넓은 로고가 다른 로고보다 작아 보이던 원인이다.
 */
function measureWhole(url: string) {
  const img = new Image();
  img.onerror = () => settle(url, { status: 'error' });
  img.onload = () => {
    const { naturalWidth, naturalHeight } = img;
    settle(url, {
      status: 'ready',
      naturalWidth,
      naturalHeight,
      bounds: { x: 0, y: 0, width: naturalWidth, height: naturalHeight },
    });
  };
  img.src = url;
}

function measure(url: string) {
  const proxied = logoProxyUrl(url);
  const img = new Image();
  // 프록시는 같은 출처라 `crossOrigin` 이 필요 없다.
  if (!proxied) {
    img.crossOrigin = 'anonymous';
  }
  img.onerror = () => measureWhole(url);
  img.onload = () => {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const whole = { x: 0, y: 0, width: naturalWidth, height: naturalHeight };
    let bounds: LogoBounds = whole;
    try {
      const scale = Math.min(1, SAMPLE_SIZE / Math.max(naturalWidth, naturalHeight));
      const w = Math.max(1, Math.round(naturalWidth * scale));
      const h = Math.max(1, Math.round(naturalHeight * scale));
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.canvas.width = w;
        ctx.canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const found = findContentBounds(ctx.getImageData(0, 0, w, h).data, w, h);
        if (found) {
          // 축소본 좌표를 원본으로 되돌린다. 경계 픽셀이 잘리지 않게 바깥쪽으로 반올림한다.
          const x = Math.floor(found.x / scale);
          const y = Math.floor(found.y / scale);
          bounds = {
            x,
            y,
            width: Math.min(naturalWidth, Math.ceil((found.x + found.width) / scale)) - x,
            height: Math.min(naturalHeight, Math.ceil((found.y + found.height) / scale)) - y,
          };
        }
      }
    } catch {
      bounds = whole; // CORS 로 캔버스가 오염돼 픽셀을 못 읽었다.
    }
    settle(url, { status: 'ready', naturalWidth, naturalHeight, bounds });
  };
  img.src = proxied ?? url;
}

/** `useSyncExternalStore` 용. 처음 구독될 때 한 번만 잰다 — 같은 로고를 쓰는 카드끼리 결과를 나눈다. */
export function subscribeLogoMeasure(url: string, notify: () => void) {
  let set = listeners.get(url);
  if (!set) {
    set = new Set();
    listeners.set(url, set);
  }
  set.add(notify);
  if (!measures.has(url)) {
    measures.set(url, PENDING);
    measure(url);
  }
  return () => {
    set.delete(notify);
  };
}

export function getLogoMeasure(url: string): LogoMeasure {
  return measures.get(url) ?? PENDING;
}

export function getServerLogoMeasure(): LogoMeasure {
  return PENDING;
}
