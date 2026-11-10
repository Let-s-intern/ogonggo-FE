import { ImageResponse } from 'next/og';
import { alwaysOpenLabel, type ContentKind } from '@/shared/lib/dday';
import { parseLocalDate } from '@/shared/lib/localDate';
import { OgLogoMark } from './ogLogoMark';

/** 공유 미리보기 이미지 크기. 카카오톡·페이스북·X·링크드인이 모두 1.91:1 을 잘라 쓰지 않는다. */
export const POSTING_OG_SIZE = { width: 1200, height: 630 };

/**
 * 이미지 생성기(satori)는 woff2 를 읽지 못한다. 앱이 쓰는 Pretendard 는 woff2 뿐이라
 * (`packages/ui/src/styles/fonts/`) 같은 글꼴의 otf 를 jsDelivr 에서 받는다. `force-cache` 라
 * 배포본마다 한 번만 받는다.
 */
const FONT_BASE = 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static';

export type OgFontWeight = 'ExtraBold' | 'Bold' | 'SemiBold' | 'Medium';

const FONT_WEIGHTS: Record<OgFontWeight, 800 | 700 | 600 | 500> = {
  ExtraBold: 800,
  Bold: 700,
  SemiBold: 600,
  Medium: 500,
};

export async function loadFont(weight: OgFontWeight): Promise<ArrayBuffer> {
  const response = await fetch(`${FONT_BASE}/Pretendard-${weight}.otf`, {
    cache: 'force-cache',
  });
  return response.arrayBuffer();
}

/** `ImageResponse` 의 `fonts` 에 넘길 Pretendard 굵기들. */
export async function loadFonts(weights: OgFontWeight[]) {
  return Promise.all(
    weights.map(async (weight) => ({
      name: 'Pretendard',
      data: await loadFont(weight),
      weight: FONT_WEIGHTS[weight],
      style: 'normal' as const,
    })),
  );
}

interface LoadedImage {
  src: string;
  /** 가로/세로. 읽지 못한 형식이면 1(정사각)로 본다. */
  aspectRatio: number;
}

/**
 * PNG·JPEG 헤더에서 가로/세로 비를 읽는다. 가로로 긴 로고를 정사각 칸에 넣으면 글자가 보이지 않을
 * 만큼 작아지므로 로고 칸 너비를 이 비율로 정한다. 다른 형식은 `null` 이다.
 */
function readAspectRatio(bytes: Buffer): number | null {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) {
    return bytes.readUInt32BE(16) / bytes.readUInt32BE(20);
  }
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length && bytes[offset] === 0xff) {
      const marker = bytes[offset + 1] ?? 0;
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) {
        return bytes.readUInt16BE(offset + 7) / bytes.readUInt16BE(offset + 5);
      }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
  }
  return null;
}

/**
 * 이미지를 data URL 로 바꿔 둔다. 이미지 생성기가 주소를 직접 받으면 실패했을 때 이미지 전체가
 * 깨진다. 받지 못하거나 이미지가 아니면 `null` 이고, 그때는 그 자리를 비운다.
 */
async function loadImage(url: string | null | undefined): Promise<LoadedImage | null> {
  if (!url) {
    return null;
  }
  try {
    const response = await fetch(url, { cache: 'force-cache' });
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || !/^image\/(png|jpe?g|gif|webp|svg\+xml)/.test(type)) {
      return null;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const aspectRatio = readAspectRatio(bytes);
    return {
      src: `data:${type};base64,${bytes.toString('base64')}`,
      aspectRatio: aspectRatio && Number.isFinite(aspectRatio) ? aspectRatio : 1,
    };
  } catch {
    return null;
  }
}

/** 사진이 깔릴 때 흰 판이 카드 가장자리에서 들어오는 거리. 이 테두리로만 사진이 보인다. */
const PANEL_INSET = 28;

/** 로고 칸 안 로고 높이와, 가로로 긴 로고가 넘지 않을 너비. */
const LOGO_HEIGHT = 48;
const LOGO_MAX_WIDTH = 200;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 아래 줄 마감 문구. 마감일이 없으면(상시채용·마감일 미정) 종류별 문구다(채용공고 `상시 채용`,
 * 그 밖 `상시 모집`).
 *
 * D-day 가 아니라 날짜다. 메신저가 미리보기 이미지를 캐시해 두므로 D-day 는 공유 다음 날이면
 * 틀린 숫자가 된다.
 */
export function ogDeadlineText(
  kind: ContentKind,
  recruitmentEndAt: string | undefined,
  alwaysOpen = false,
): string {
  if (alwaysOpen || !recruitmentEndAt) {
    return alwaysOpenLabel(kind);
  }
  const end = parseLocalDate(recruitmentEndAt);
  return `${end.getMonth() + 1}/${end.getDate()}(${WEEKDAYS[end.getDay()]}) 마감`;
}

/** 공지 아래 줄의 게시일 문구(`11/3(월) 게시`). */
export function ogPostedText(createdAt: string): string {
  const date = parseLocalDate(createdAt);
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAYS[date.getDay()]}) 게시`;
}

/** `M/D` 짧은 날짜. 부트캠프 교육 기간 칸이 쓴다. */
export function ogShortDate(value: string): string {
  const date = parseLocalDate(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 종류별 색. 채용공고는 사이트의 `blue-500`(#4A76FF) 계열, 부트캠프·사이드스터디는 각 목록
 * 히어로(`shared/lib/heroContent.ts`)의 민트·틸 계열이다. 글자에 쓰는 색은 흰 바탕에서 4.5:1 을
 * 넘는 진한 쪽을 골랐다.
 */
export type PostingOgTheme = 'job' | 'bootcamp' | 'side-study';

const THEMES: Record<
  PostingOgTheme,
  {
    band: string;
    chipBackground: string;
    chipText: string;
    deadlineBackground: string;
    gridBackground: string;
    gridDivider: string;
  }
> = {
  job: {
    band: '#3B60E6',
    chipBackground: '#EBF1FF',
    chipText: '#2D4ABD',
    deadlineBackground: '#3B60E6',
    gridBackground: '#F5F9FF',
    gridDivider: '#D6E3FF',
  },
  bootcamp: {
    band: '#009C89',
    chipBackground: '#BBEDD8',
    chipText: '#00705F',
    deadlineBackground: '#00705F',
    gridBackground: '#F0FBF6',
    gridDivider: '#BBEDD8',
  },
  'side-study': {
    band: '#1BC47D',
    chipBackground: '#D1F3E5',
    chipText: '#374151',
    deadlineBackground: '#111827',
    gridBackground: '#F3FBF8',
    gridDivider: '#D1F3E5',
  },
};

export interface OgInfoCell {
  label: string;
  value: string;
}

export interface PostingOgImageProps {
  theme: PostingOgTheme;
  /** 오른쪽 위 칩. `채용공고`, `교육·부트캠프`, `사이드·스터디`. */
  kindLabel: string;
  /** 제목 위 줄. 채용·부트캠프는 회사명이다. 없으면 `tags` 를 그린다. */
  organizationName?: string;
  /** 제목 위 줄에 회사명 대신 그리는 칩(사이드·스터디의 `사이드 프로젝트`). */
  tags?: string[];
  title: string;
  /** 회사 로고. 없으면 로고 칸을 비우지 않고 아예 빼서 회사명이 바로 온다. */
  logoUrl?: string | null;
  /** 공고 썸네일. 있으면 카드 전체에 깔고 글자는 반투명 흰 판 위에 올린다. */
  coverUrl?: string | null;
  /** 제목 아래 정보 칸(최대 4칸). 값이 없는 칸은 부르는 쪽에서 뺀다. 비면 줄째 그리지 않는다. */
  infoCells?: OgInfoCell[];
  /** 아래 줄의 마감 문구(`10/14(수) 마감`, `상시 채용`). 공지는 게시일(`11/3(월) 게시`)이다. */
  deadlineText: string;
}

/**
 * 상세 공고를 공유했을 때 미리보기에 뜨는 카드 이미지. 채용·부트캠프·사이드스터디 상세의
 * `opengraph-image.tsx` 가 종류(`theme`)만 바꿔 같은 모양으로 그린다.
 *
 * 한눈에 넷이 읽혀야 한다 — 어느 회사의 무슨 공고인지(로고·회사명·제목), 조건(정보 칸),
 * 언제까지인지(마감), 오공고에서 온 링크인지(왼쪽 위 로고, 오른쪽 아래 주소). 채팅방에서는
 * 360px 안팎으로 줄어 보이므로 가장 작은 글자도 22px 이다.
 *
 * 썸네일이 있으면 카드 전체에 깔고, 글자는 테두리 28px 안쪽의 흰 판(불투명도 96%) 위에 올린다.
 * 사진은 판 바깥 테두리로만 보여서 어떤 사진이 깔려도 글자가 묻히지 않는다.
 */
export async function renderPostingOgImage({
  theme,
  kindLabel,
  organizationName,
  tags,
  title,
  logoUrl,
  coverUrl,
  infoCells = [],
  deadlineText,
}: PostingOgImageProps): Promise<ImageResponse> {
  const colors = THEMES[theme];
  const [fonts, logo, cover] = await Promise.all([
    loadFonts(['ExtraBold', 'Bold', 'SemiBold']),
    loadImage(logoUrl),
    loadImage(coverUrl),
  ]);

  const { width, height } = POSTING_OG_SIZE;
  const logoWidth = logo ? Math.min(LOGO_MAX_WIDTH, Math.round(LOGO_HEIGHT * logo.aspectRatio)) : 0;

  // 이미지 생성기는 절대 위치 칸의 right·bottom 을 늘려 채우지 않고, Fragment 안 절대 위치는
  // 부모 여백만큼 밀린다. 그래서 겹치는 층(사진·흰 판·내용)을 모두 너비·높이를 박은 형제로 둔다.
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#FFFFFF',
        fontFamily: 'Pretendard',
        color: '#111827',
      }}
    >
      {cover ? (
        <img
          src={cover.src}
          width={width}
          height={height}
          style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
          alt=""
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height: 12,
            background: colors.band,
          }}
        />
      )}
      {cover ? (
        <div
          style={{
            position: 'absolute',
            top: PANEL_INSET,
            left: PANEL_INSET,
            width: width - PANEL_INSET * 2,
            height: height - PANEL_INSET * 2,
            borderRadius: 28,
            background: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 18px 48px rgba(17, 24, 39, 0.18)',
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 72px 52px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <OgLogoMark width={60} color="#3B60E6" />
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                fontWeight: 800,
                color: '#3B60E6',
              }}
            >
              오늘의 공고
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              padding: '8px 22px',
              borderRadius: 999,
              background: colors.chipBackground,
              color: colors.chipText,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {kindLabel}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {organizationName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {logo ? (
                <div
                  style={{
                    display: 'flex',
                    width: Math.max(76, logoWidth + 28),
                    height: 76,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    border: '2px solid #E5E7EB',
                    background: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={logo.src}
                    width={logoWidth}
                    height={LOGO_HEIGHT}
                    style={{ objectFit: 'contain' }}
                    alt=""
                  />
                </div>
              ) : null}
              <div
                style={{
                  display: 'flex',
                  fontSize: 36,
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                {organizationName}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              {(tags ?? []).map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: 'flex',
                    padding: '8px 20px',
                    borderRadius: 12,
                    background: '#111827',
                    color: '#FFFFFF',
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              display: 'block',
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.03em',
              // 두 줄을 넘으면 자른다. 이미지 생성기는 line-clamp 를 이렇게 받는다.
              lineClamp: 2,
            }}
          >
            {title}
          </div>
        </div>

        {infoCells.length > 0 ? (
          <div
            style={{
              display: 'flex',
              borderRadius: 18,
              background: colors.gridBackground,
              padding: '18px 28px',
            }}
          >
            {infoCells.map((cell, index) => (
              <div
                key={cell.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  gap: 6,
                  paddingLeft: index === 0 ? 0 : 24,
                  borderLeft: index === 0 ? 'none' : `2px solid ${colors.gridDivider}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 22,
                    fontWeight: 600,
                    color: '#4B5563',
                  }}
                >
                  {cell.label}
                </div>
                <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>{cell.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              padding: '10px 24px',
              borderRadius: 14,
              background: colors.deadlineBackground,
              color: '#FFFFFF',
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            {deadlineText}
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 26,
              fontWeight: 600,
              color: '#4B5563',
            }}
          >
            ogonggo.co.kr
          </div>
        </div>
      </div>
    </div>,
    { ...POSTING_OG_SIZE, fonts },
  );
}
