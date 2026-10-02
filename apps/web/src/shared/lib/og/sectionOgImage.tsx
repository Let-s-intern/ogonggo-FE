import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { HERO_CONTENT, type HeroScreen } from '@/shared/lib/heroContent';
import { loadFont, POSTING_OG_SIZE } from './postingOgImage';

/**
 * 목록 화면의 배지 색. 히어로(`HERO_CONTENT`)는 Tailwind 클래스로 들고 있어 이미지 생성기에
 * 넘길 수 없다. 같은 색을 hex 로 적는다 — `blue-100`·`blue-500`·`gray-600` 은 `tokens.css`,
 * 민트 둘과 틸은 히어로가 쓰는 hex 그대로다.
 */
const BADGE_COLORS: Record<HeroScreen, { background: string; color: string }> = {
  jobs: { background: '#D6E3FF', color: '#4A76FF' },
  bootcamps: { background: '#BBEDD8', color: '#009C89' },
  'side-studies': { background: '#D1F3E5', color: '#4B5563' },
};

/** 오른쪽 위 칩. 상세 미리보기(`renderPostingOgImage`)의 `kindLabel` 과 같은 말이다. */
const KIND_LABELS: Record<HeroScreen, string> = {
  jobs: '채용공고',
  bootcamps: '교육·부트캠프',
  'side-studies': '사이드·스터디',
};

/** 히어로 배경 PNG(`public/hero/`)를 data URL 로. 목록 미리보기는 빌드 때 한 번 그려진다. */
async function loadBackground(screen: HeroScreen): Promise<string> {
  const path = join(process.cwd(), 'public', HERO_CONTENT[screen].theme.backgroundImage);
  return `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
}

/**
 * 채용공고(`/`)·교육·부트캠프·사이드·스터디 목록을 공유했을 때 미리보기 카드.
 *
 * 목록에 `og:image` 가 없으면 카카오톡 같은 미리보기가 본문의 첫 이미지, 곧 목록 첫 카드의
 * 썸네일을 가져다 쓴다. 그래서 화면마다 자기 카드를 낸다. 모양은 그 화면 맨 위 히어로
 * (`widgets/home-hero`) 를 옮긴 것이다 — 같은 배경, 같은 배지, 같은 헤드라인이라 링크를 열었을 때
 * 처음 보이는 것과 미리보기가 같다.
 */
export async function renderSectionOgImage(screen: HeroScreen): Promise<ImageResponse> {
  const { badge, lines } = HERO_CONTENT[screen];
  const badgeColors = BADGE_COLORS[screen];
  const [bold, medium, background] = await Promise.all([
    loadFont('Bold'),
    loadFont('Medium'),
    loadBackground(screen),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        fontFamily: 'Pretendard',
        color: '#1F2937',
        position: 'relative',
      }}
    >
      <img
        src={background}
        width={POSTING_OG_SIZE.width}
        height={POSTING_OG_SIZE.height}
        style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
        alt=""
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#4A76FF' }}>
          오늘의 공고
        </div>
        <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, color: '#9CA3AF' }}>
          BY LETS CAREER
        </div>
        <div
          style={{
            display: 'flex',
            marginLeft: 'auto',
            padding: '10px 24px',
            borderRadius: 999,
            background: '#4A76FF',
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {KIND_LABELS[screen]}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div
          style={{
            display: 'flex',
            padding: '12px 28px',
            borderRadius: 999,
            background: badgeColors.background,
            color: badgeColors.color,
            fontSize: 28,
            fontWeight: 500,
          }}
        >
          {badge}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              style={{ display: 'flex', alignItems: 'center', fontSize: 68, fontWeight: 700 }}
            >
              {line.map((segment, segmentIndex) => (
                <span
                  key={segmentIndex}
                  style={segment.accent ? { color: '#1BC47D', fontSize: 80, margin: '0 8px' } : {}}
                >
                  {segment.text.trim()}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', fontSize: 26, fontWeight: 500, color: '#9CA3AF' }}>
          ogonggo.co.kr
        </div>
      </div>
    </div>,
    {
      ...POSTING_OG_SIZE,
      fonts: [
        { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
        { name: 'Pretendard', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );
}
