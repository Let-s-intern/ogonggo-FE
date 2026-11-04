/**
 * 목 광고 배너 소재. 시안을 보여 줄 때 회색 상자 대신 그럴듯한 배너가 보이게, 오공고 자체 홍보 배너 세 가지를
 * SVG 로 그려 `data:` 주소로 넣는다. 파일을 앱마다 `public/` 에 둘 필요가 없어 web·business·admin 이 같이 쓴다.
 *
 * 규격은 PRD `지면 상품` 의 PC 1200×120, MO 750×200 이다. 공고 상세 사이드 자리는 규격이 없어 web 이 4:5 로
 * 그리므로(`apps/web/src/entities/advertisement/ui/AdSideBanner.tsx`) 400×500 을 따로 둔다.
 */

const FONT = "Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

/** 오공고 심볼(52×25). 원본은 `apps/business/src/shared/ui/Logo.tsx`. */
const LOGO_PATHS = [
  'M16.1079 8.05393C16.1079 12.502 12.502 16.1079 8.05393 16.1079C3.60587 16.1079 0 12.502 0 8.05393C0 3.60587 3.60587 0 8.05393 0C12.502 0 16.1079 3.60587 16.1079 8.05393ZM4.83236 8.05393C4.83236 9.83316 6.27471 11.2755 8.05393 11.2755C9.83316 11.2755 11.2755 9.83316 11.2755 8.05393C11.2755 6.27471 9.83316 4.83236 8.05393 4.83236C6.27471 4.83236 4.83236 6.27471 4.83236 8.05393Z',
  'M33.6547 8.05393C33.6547 12.502 30.0489 16.1079 25.6008 16.1079C21.1527 16.1079 17.5469 12.502 17.5469 8.05393C17.5469 3.60587 21.1527 0 25.6008 0C30.0489 0 33.6547 3.60587 33.6547 8.05393ZM22.3792 8.05393C22.3792 9.83316 23.8216 11.2755 25.6008 11.2755C27.38 11.2755 28.8224 9.83316 28.8224 8.05393C28.8224 6.27471 27.38 4.83236 25.6008 4.83236C23.8216 4.83236 22.3792 6.27471 22.3792 8.05393Z',
  'M51.1997 8.05393C51.1997 12.502 47.5938 16.1079 43.1457 16.1079C38.6977 16.1079 35.0918 12.502 35.0918 8.05393C35.0918 3.60587 38.6977 0 43.1457 0C47.5938 0 51.1997 3.60587 51.1997 8.05393ZM39.9242 8.05393C39.9242 9.83316 41.3665 11.2755 43.1457 11.2755C44.925 11.2755 46.3673 9.83316 46.3673 8.05393C46.3673 6.27471 44.925 4.83236 43.1457 4.83236C41.3665 4.83236 39.9242 6.27471 39.9242 8.05393Z',
  'M17.5464 16.1082C17.5464 18.2442 18.395 20.2928 19.9054 21.8032C21.4158 23.3136 23.4643 24.1621 25.6004 24.1621C27.7364 24.1621 29.7849 23.3136 31.2954 21.8032C32.8058 20.2928 33.6543 18.2442 33.6543 16.1082L28.8219 16.1082C28.8219 16.9626 28.4825 17.782 27.8784 18.3862C27.2742 18.9903 26.4548 19.3297 25.6004 19.3297C24.7459 19.3297 23.9265 18.9903 23.3224 18.3862C22.7182 17.782 22.3788 16.9626 22.3788 16.1082L17.5464 16.1082Z',
  'M35.0914 16.1082C35.0914 18.2442 35.9399 20.2928 37.4503 21.8032C38.9607 23.3136 41.0092 24.1621 43.1453 24.1621C45.2813 24.1621 47.3299 23.3136 48.8403 21.8032C50.3507 20.2928 51.1992 18.2442 51.1992 16.1082L46.3669 16.1082C46.3669 16.9626 46.0274 17.782 45.4233 18.3862C44.8191 18.9903 43.9997 19.3297 43.1453 19.3297C42.2909 19.3297 41.4715 18.9903 40.8673 18.3862C40.2631 17.782 39.9237 16.9626 39.9237 16.1082L35.0914 16.1082Z',
];

interface BannerTheme {
  /** 배경 그라데이션 시작·끝. */
  from: string;
  to: string;
  logo: string;
  /** 꾸밈 원의 색. */
  ring: string;
  eyebrow: string;
  title: string;
  sub: string;
  ctaBg: string;
  ctaText: string;
}

interface BannerCopy {
  eyebrow: string;
  title: string;
  /** 사이드 배너에서 두 줄로 나눌 제목. */
  titleLines: [string, string];
  sub: string;
  cta: string;
}

const logo = (x: number, y: number, scale: number, color: string) =>
  `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}">${LOGO_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g>`;

const ring = (cx: number, cy: number, r: number, width: number, color: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${width}"/>`;

const background = (w: number, h: number, t: BannerTheme) =>
  `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.from}"/><stop offset="1" stop-color="${t.to}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>`;

const cta = (
  x: number,
  y: number,
  w: number,
  h: number,
  size: number,
  label: string,
  t: BannerTheme,
) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.ctaBg}"/><text x="${x + w / 2}" y="${y + h / 2}" dy="0.35em" text-anchor="middle" font-size="${size}" font-weight="700" fill="${t.ctaText}">${label} →</text>`;

const svg = (w: number, h: number, body: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}">${body}</svg>`,
  )}`;

function pcBanner(c: BannerCopy, t: BannerTheme): string {
  return svg(
    1200,
    120,
    [
      background(1200, 120, t),
      ring(1010, 10, 90, 18, t.ring),
      ring(1150, 120, 60, 14, t.ring),
      logo(48, 36, 2, t.logo),
      `<rect x="178" y="34" width="2" height="52" fill="${t.ring}"/>`,
      `<text x="208" y="50" font-size="15" font-weight="600" fill="${t.eyebrow}">${c.eyebrow}</text>`,
      `<text x="208" y="84" font-size="28" font-weight="800" fill="${t.title}">${c.title}</text>`,
      `<text x="670" y="72" font-size="16" fill="${t.sub}">${c.sub}</text>`,
      cta(1016, 36, 148, 48, 16, c.cta, t),
    ].join(''),
  );
}

function moBanner(c: BannerCopy, t: BannerTheme): string {
  return svg(
    750,
    200,
    [
      background(750, 200, t),
      ring(680, 20, 110, 22, t.ring),
      ring(560, 210, 70, 16, t.ring),
      logo(40, 34, 1.4, t.logo),
      `<text x="128" y="56" font-size="22" font-weight="600" fill="${t.eyebrow}">${c.eyebrow}</text>`,
      `<text x="40" y="118" font-size="40" font-weight="800" fill="${t.title}">${c.title}</text>`,
      `<text x="40" y="164" font-size="22" fill="${t.sub}">${c.sub}</text>`,
    ].join(''),
  );
}

function sideBanner(c: BannerCopy, t: BannerTheme): string {
  return svg(
    400,
    500,
    [
      background(400, 500, t),
      ring(360, 60, 120, 26, t.ring),
      ring(40, 470, 80, 18, t.ring),
      logo(36, 40, 1.6, t.logo),
      `<text x="36" y="150" font-size="18" font-weight="600" fill="${t.eyebrow}">${c.eyebrow}</text>`,
      `<text x="36" y="200" font-size="32" font-weight="800" fill="${t.title}">${c.titleLines[0]}</text>`,
      `<text x="36" y="244" font-size="32" font-weight="800" fill="${t.title}">${c.titleLines[1]}</text>`,
      `<text x="36" y="296" font-size="17" fill="${t.sub}">${c.sub}</text>`,
      cta(36, 404, 200, 56, 18, c.cta, t),
    ].join(''),
  );
}

const BLUE: BannerTheme = {
  from: '#4A76FF',
  to: '#2C55E0',
  logo: '#FFFFFF',
  ring: 'rgba(255,255,255,0.16)',
  eyebrow: '#D6E1FF',
  title: '#FFFFFF',
  sub: '#E6ECFF',
  ctaBg: '#FFFFFF',
  ctaText: '#2C55E0',
};

const NAVY: BannerTheme = {
  from: '#13204A',
  to: '#0B1430',
  logo: '#4A76FF',
  ring: 'rgba(74,118,255,0.22)',
  eyebrow: '#8FAEFF',
  title: '#FFFFFF',
  sub: '#B9C6E8',
  ctaBg: '#4A76FF',
  ctaText: '#FFFFFF',
};

const LIGHT: BannerTheme = {
  from: '#F1F5FF',
  to: '#DCE6FF',
  logo: '#4A76FF',
  ring: 'rgba(74,118,255,0.14)',
  eyebrow: '#4A76FF',
  title: '#111A33',
  sub: '#4B5675',
  ctaBg: '#111A33',
  ctaText: '#FFFFFF',
};

const BANNERS: [BannerCopy, BannerTheme][] = [
  [
    {
      eyebrow: '오늘의 공고',
      title: '지금 딱! 필요한 채용공고',
      titleLines: ['지금 딱! 필요한', '채용공고만 모아서'],
      sub: '매일 아침 올라오는 새 공고를 한눈에',
      cta: '공고 보러가기',
    },
    BLUE,
  ],
  [
    {
      eyebrow: '지원일정 관리',
      title: '마감 일정, 이제 놓치지 마세요',
      titleLines: ['마감 일정,', '이제 놓치지 마세요'],
      sub: '스크랩한 공고를 보드에서 한 번에 관리',
      cta: '일정 관리하기',
    },
    NAVY,
  ],
  [
    {
      eyebrow: '오공고 for business',
      title: '우리 공고, 딱 맞는 인재에게',
      titleLines: ['우리 공고,', '딱 맞는 인재에게'],
      sub: '직무별 구좌로 필요한 지원자에게 노출',
      cta: '광고 신청하기',
    },
    LIGHT,
  ],
];

export interface MockBannerImage {
  pc: string;
  mo: string;
}

/** 가로 배너 소재. 슬롯 순서대로 돌려 쓴다. */
export const OGONGGO_BANNERS: MockBannerImage[] = BANNERS.map(([copy, theme]) => ({
  pc: pcBanner(copy, theme),
  mo: moBanner(copy, theme),
}));

/** 공고 상세 PC 사이드 자리(4:5) 소재. */
export const OGONGGO_SIDE_BANNERS: string[] = BANNERS.map(([copy, theme]) =>
  sideBanner(copy, theme),
);

/** `index` 번째 슬롯의 가로 배너. */
export function mockBannerAt(index: number): MockBannerImage {
  return OGONGGO_BANNERS[index % OGONGGO_BANNERS.length]!;
}
