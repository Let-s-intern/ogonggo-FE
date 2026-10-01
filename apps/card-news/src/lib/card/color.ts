/** 색 계산. 렌더(서버)와 편집 화면(브라우저)이 같이 쓴다. */

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '').padEnd(6, '0');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) || 0) as [
    number,
    number,
    number,
  ];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((value) =>
      Math.round(Math.max(0, Math.min(255, value)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`.toUpperCase();
}

/** WCAG 상대 휘도. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** 이 바탕 위에서 더 잘 읽히는 글자색(검정·흰색). */
export function readableText(background: string): '#111111' | '#FFFFFF' {
  return contrastRatio(background, '#111111') >= contrastRatio(background, '#FFFFFF')
    ? '#111111'
    : '#FFFFFF';
}

export function isDark(hex: string): boolean {
  return readableText(hex) === '#FFFFFF';
}

export function mix(a: string, b: string, ratio: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex([ar + (br - ar) * ratio, ag + (bg - ag) * ratio, ab + (bb - ab) * ratio]);
}
