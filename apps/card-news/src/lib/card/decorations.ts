/**
 * 요소 서랍의 손그림 장식(밑줄·동그라미·별표·반짝이·화살표 등). 펜으로 그은 느낌이 나게 선 끝을 둥글게
 * 하고 조금씩 흔들리게 그렸다. 이 앱에서 직접 그린 것이라 라이선스가 따로 없다.
 *
 * `stroke` 는 선으로, `fill` 은 면으로 칠한다. 색은 넣을 때 정한다(`decorationDataUrl`). 하나 더하려면
 * `viewBox` 와 `<path>` 를 한 줄 더한다.
 */
export interface Decoration {
  id: string;
  label: string;
  /** `0 0 w h`. 넣을 때 이 비율로 그린다. */
  width: number;
  height: number;
  paint: 'stroke' | 'fill';
  /** `stroke` 일 때 선 굵기(viewBox 단위). */
  strokeWidth?: number;
  /** 면 투명도. 형광펜처럼 글자 뒤에 깔 것. */
  opacity?: number;
  /** `d` 값들. 경로마다 `<path>` 하나다. */
  paths: string[];
}

export const DECORATIONS: Decoration[] = [
  {
    id: 'underline-wave',
    label: '물결 밑줄',
    width: 200,
    height: 30,
    paint: 'stroke',
    strokeWidth: 5,
    paths: ['M6 18 C 22 6, 38 28, 56 16 S 90 6, 108 17 S 144 28, 162 15 S 186 9, 194 14'],
  },
  {
    id: 'underline-marker',
    label: '굵은 밑줄',
    width: 200,
    height: 24,
    paint: 'stroke',
    strokeWidth: 9,
    paths: ['M7 15 C 48 9, 96 13, 140 10 S 184 12, 193 9'],
  },
  {
    id: 'underline-double',
    label: '두 줄 밑줄',
    width: 200,
    height: 34,
    paint: 'stroke',
    strokeWidth: 4,
    paths: ['M6 11 C 58 6, 120 10, 194 7', 'M14 25 C 70 20, 132 25, 188 21'],
  },
  {
    id: 'highlighter',
    label: '형광펜',
    width: 220,
    height: 56,
    paint: 'fill',
    opacity: 0.45,
    paths: [
      'M8 12 L 30 9 L 70 11 L 120 8 L 170 10 L 212 8 L 209 22 L 214 34 L 210 47 L 160 49 L 110 46 L 60 49 L 14 47 L 10 34 L 5 22 Z',
    ],
  },
  {
    id: 'circle-loop',
    label: '동그라미',
    width: 220,
    height: 120,
    paint: 'stroke',
    strokeWidth: 5,
    paths: [
      'M42 30 C 82 8, 168 6, 198 34 C 222 58, 200 98, 140 108 C 84 117, 24 104, 14 74 C 6 48, 40 26, 98 20 C 126 17, 150 18, 168 24',
    ],
  },
  {
    id: 'box-rough',
    label: '네모 테두리',
    width: 220,
    height: 110,
    paint: 'stroke',
    strokeWidth: 5,
    paths: ['M10 14 L 208 9 L 211 98 L 13 102 Z', 'M16 10 L 14 104'],
  },
  {
    id: 'star-outline',
    label: '별표',
    width: 100,
    height: 100,
    paint: 'stroke',
    strokeWidth: 5,
    paths: ['M50 7 L 61 37 L 93 38 L 67 57 L 77 89 L 50 70 L 23 90 L 33 57 L 7 39 L 39 37 Z'],
  },
  {
    id: 'star-fill',
    label: '별표 채움',
    width: 100,
    height: 100,
    paint: 'fill',
    paths: ['M50 6 L 62 36 L 94 37 L 68 57 L 78 90 L 50 71 L 22 91 L 32 57 L 6 38 L 38 36 Z'],
  },
  {
    id: 'sparkle',
    label: '반짝이',
    width: 100,
    height: 100,
    paint: 'fill',
    paths: [
      'M50 4 C 53 34, 66 47, 96 50 C 66 53, 53 66, 50 96 C 47 66, 34 53, 4 50 C 34 47, 47 34, 50 4 Z',
    ],
  },
  {
    id: 'sparkles',
    label: '반짝이 셋',
    width: 120,
    height: 110,
    paint: 'fill',
    paths: [
      'M44 10 C 46 36, 56 46, 82 48 C 56 50, 46 60, 44 86 C 42 60, 32 50, 6 48 C 32 46, 42 36, 44 10 Z',
      'M96 6 C 97 18, 102 23, 114 24 C 102 25, 97 30, 96 42 C 95 30, 90 25, 78 24 C 90 23, 95 18, 96 6 Z',
      'M92 70 C 93 80, 97 84, 106 85 C 97 86, 93 90, 92 100 C 91 90, 87 86, 78 85 C 87 84, 91 80, 92 70 Z',
    ],
  },
  {
    id: 'emphasis',
    label: '강조선',
    width: 80,
    height: 80,
    paint: 'stroke',
    strokeWidth: 6,
    paths: ['M14 46 L 34 52', 'M22 18 L 40 34', 'M52 8 L 56 30'],
  },
  {
    id: 'burst',
    label: '집중선',
    width: 120,
    height: 120,
    paint: 'stroke',
    strokeWidth: 5,
    paths: [
      'M60 8 L 60 30',
      'M60 90 L 60 112',
      'M8 60 L 30 60',
      'M90 60 L 112 60',
      'M23 23 L 38 38',
      'M82 82 L 97 97',
      'M97 23 L 82 38',
      'M38 82 L 23 97',
    ],
  },
  {
    id: 'arrow-curve',
    label: '굽은 화살표',
    width: 160,
    height: 100,
    paint: 'stroke',
    strokeWidth: 5,
    paths: ['M10 82 C 30 30, 82 12, 140 32', 'M118 16 L 142 33 L 120 50'],
  },
  {
    id: 'arrow-down',
    label: '아래 화살표',
    width: 90,
    height: 150,
    paint: 'stroke',
    strokeWidth: 5,
    paths: ['M30 8 C 60 40, 20 80, 48 136', 'M28 118 L 49 138 L 66 112'],
  },
  {
    id: 'arrow-loop',
    label: '꼬인 화살표',
    width: 170,
    height: 110,
    paint: 'stroke',
    strokeWidth: 5,
    paths: [
      'M10 90 C 40 92, 66 70, 70 46 C 74 20, 44 18, 46 42 C 48 68, 100 72, 150 40',
      'M128 32 L 152 39 L 142 62',
    ],
  },
  {
    id: 'check',
    label: '체크',
    width: 100,
    height: 90,
    paint: 'stroke',
    strokeWidth: 8,
    paths: ['M10 48 C 20 56, 30 66, 38 78 C 52 50, 70 26, 92 8'],
  },
  {
    id: 'heart',
    label: '하트',
    width: 100,
    height: 92,
    paint: 'stroke',
    strokeWidth: 5,
    paths: [
      'M50 84 C 26 66, 6 50, 8 28 C 10 10, 34 4, 50 24 C 64 4, 90 8, 92 28 C 94 50, 72 66, 50 84 Z',
    ],
  },
  {
    id: 'bubble',
    label: '말풍선',
    width: 200,
    height: 130,
    paint: 'stroke',
    strokeWidth: 5,
    paths: [
      'M30 14 C 80 6, 150 8, 180 18 C 198 26, 196 74, 176 84 C 150 94, 96 96, 66 92 L 36 118 L 44 88 C 18 82, 8 66, 10 44 C 12 26, 18 18, 30 14 Z',
    ],
  },
  {
    id: 'quote',
    label: '따옴표',
    width: 110,
    height: 80,
    paint: 'fill',
    paths: [
      'M10 70 C 8 44, 16 20, 44 10 L 48 20 C 32 28, 28 38, 30 46 C 42 44, 52 52, 50 62 C 48 74, 36 80, 24 78 C 16 77, 11 74, 10 70 Z',
      'M62 70 C 60 44, 68 20, 96 10 L 100 20 C 84 28, 80 38, 82 46 C 94 44, 104 52, 102 62 C 100 74, 88 80, 76 78 C 68 77, 63 74, 62 70 Z',
    ],
  },
  {
    id: 'scribble',
    label: '낙서 줄',
    width: 200,
    height: 50,
    paint: 'stroke',
    strokeWidth: 4,
    paths: [
      'M8 30 C 18 10, 30 10, 30 28 C 30 44, 46 44, 48 26 C 50 10, 66 10, 68 28 C 70 44, 86 44, 88 26 C 90 10, 106 10, 108 28 C 110 44, 126 44, 128 26 C 130 10, 146 10, 148 28 C 150 44, 166 44, 168 26 C 170 12, 184 12, 192 24',
    ],
  },
  {
    id: 'corner',
    label: '꺾쇠 강조',
    width: 200,
    height: 100,
    paint: 'stroke',
    strokeWidth: 6,
    paths: ['M10 34 L 10 10 L 40 10', 'M160 90 L 190 90 L 190 66'],
  },
];

/** 장식을 한 색으로 칠한 SVG data URL. 이미지 요소로 넣으므로 3배로 크게 그려 둔다(흐려지지 않게). */
export function decorationDataUrl(decoration: Decoration, color: string): string {
  const paint =
    decoration.paint === 'stroke'
      ? `fill="none" stroke="${color}" stroke-width="${decoration.strokeWidth ?? 5}" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="${color}"${decoration.opacity ? ` fill-opacity="${decoration.opacity}"` : ''}`;
  const paths = decoration.paths.map((d) => `<path d="${d}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${decoration.width * 3}" height="${decoration.height * 3}" viewBox="0 0 ${decoration.width} ${decoration.height}" ${paint}>${paths}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/** Open Doodles(CC0, `public/doodles/LICENSE.txt`) 사람 일러스트. 강조색 `#FF5678` 을 바꿔 칠할 수 있다. */
export const DOODLES: { id: string; label: string }[] = [
  { id: 'reading', label: '책 읽기' },
  { id: 'sitting-reading', label: '앉아서 읽기' },
  { id: 'reading-side', label: '누워 읽기' },
  { id: 'coffee', label: '커피' },
  { id: 'selfie', label: '셀카' },
  { id: 'sitting', label: '앉기' },
  { id: 'meditating', label: '명상' },
  { id: 'unboxing', label: '상자 열기' },
  { id: 'jumping', label: '점프' },
  { id: 'running', label: '달리기' },
  { id: 'sprinting', label: '전력 질주' },
  { id: 'strolling', label: '산책' },
  { id: 'groovy', label: '신남' },
  { id: 'levitate', label: '둥실' },
  { id: 'float', label: '떠다니기' },
  { id: 'chilling', label: '쉬기' },
  { id: 'laying', label: '눕기' },
  { id: 'loving', label: '사랑' },
  { id: 'doggie', label: '강아지' },
  { id: 'dog-jump', label: '강아지 점프' },
];

/** 일러스트 원본의 강조색. */
export const DOODLE_ACCENT = '#FF5678';

/** 일러스트 SVG 글을 받아 강조색을 바꾼 data URL 로. `accent` 가 없으면 원래 색이다. */
export function doodleDataUrl(svg: string, accent?: string): string {
  const painted = accent ? svg.replaceAll(DOODLE_ACCENT, accent) : svg;
  // 한글이 없는 SVG 지만, 혹시 모를 비 ASCII 글자에 btoa 가 깨지지 않게 UTF-8 로 바꾼다.
  const bytes = new TextEncoder().encode(painted);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}
