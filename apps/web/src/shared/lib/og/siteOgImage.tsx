import { ImageResponse } from 'next/og';
import { OgLogoMark } from './ogLogoMark';
import { loadFonts, POSTING_OG_SIZE } from './postingOgImage';

/** 아래 칩 셋. 서비스가 모으는 세 가지다. */
const CATEGORIES = ['채용공고', '교육·부트캠프', '사이드·스터디'];

/**
 * 자기 미리보기 카드가 없는 화면(공지·캘린더·로그인 등)을 공유했을 때 뜨는 기본 카드.
 * 없으면 미리보기가 본문의 아무 이미지나 가져가거나 이미지 없이 뜬다. 루트
 * `app/opengraph-image.tsx` 가 그리고, 목록·상세는 각자의 `opengraph-image.tsx` 가 덮어쓴다.
 */
export async function renderSiteOgImage(): Promise<ImageResponse> {
  const fonts = await loadFonts(['ExtraBold', 'Bold', 'SemiBold']);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        position: 'relative',
        background: '#3B60E6',
        fontFamily: 'Pretendard',
        color: '#FFFFFF',
      }}
    >
      <OgLogoMark
        width={620}
        color="rgba(255, 255, 255, 0.16)"
        style={{ position: 'absolute', right: -90, bottom: -40 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <OgLogoMark width={88} color="#FFFFFF" />
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>오늘의 공고</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 80,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
          }}
        >
          <div style={{ display: 'flex' }}>커리어 여정에 딱 맞는</div>
          <div style={{ display: 'flex' }}>공고를 한 곳에서</div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {CATEGORIES.map((category) => (
            <div
              key={category}
              style={{
                display: 'flex',
                padding: '12px 26px',
                borderRadius: 999,
                background: '#FFFFFF',
                color: '#2D4ABD',
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: 30, fontWeight: 600 }}>ogonggo.co.kr</div>
    </div>,
    { ...POSTING_OG_SIZE, fonts },
  );
}
