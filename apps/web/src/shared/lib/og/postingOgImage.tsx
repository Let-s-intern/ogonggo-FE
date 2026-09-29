import { ImageResponse } from 'next/og';
import { ALWAYS_OPEN_LABEL } from '@/shared/lib/dday';
import { parseLocalDate } from '@/shared/lib/localDate';

/** 공유 미리보기 이미지 크기. 카카오톡·페이스북·X·링크드인이 모두 1.91:1 을 잘라 쓰지 않는다. */
export const POSTING_OG_SIZE = { width: 1200, height: 630 };

/**
 * 이미지 생성기(satori)는 woff2 를 읽지 못한다. 앱이 쓰는 Pretendard 는 woff2 뿐이라
 * (`packages/ui/src/styles/fonts/`) 같은 글꼴의 otf 를 jsDelivr 에서 받는다. `force-cache` 라
 * 배포본마다 한 번만 받는다.
 */
const FONT_BASE = 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static';

async function loadFont(weight: 'Bold' | 'Medium'): Promise<ArrayBuffer> {
  const response = await fetch(`${FONT_BASE}/Pretendard-${weight}.otf`, { cache: 'force-cache' });
  return response.arrayBuffer();
}

/**
 * 기업 로고를 data URL 로 바꿔 둔다. 이미지 생성기가 주소를 직접 받으면 실패했을 때 이미지 전체가
 * 깨진다. 받지 못하거나 이미지가 아니면 `null` 이고, 그때는 회사명 첫 글자로 대신한다.
 */
async function loadLogo(url: string | undefined): Promise<string | null> {
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
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 아래 줄 마감 문구. 마감일이 없으면(상시채용·마감일 미정) `상시모집` 이다. */
export function ogDeadlineText(recruitmentEndAt: string | undefined, alwaysOpen = false): string {
  if (alwaysOpen || !recruitmentEndAt) {
    return ALWAYS_OPEN_LABEL;
  }
  const end = parseLocalDate(recruitmentEndAt);
  return `${end.getMonth() + 1}/${end.getDate()}(${WEEKDAYS[end.getDay()]}) 마감`;
}

export interface PostingOgImageProps {
  /** 왼쪽 위 칩. `채용공고`, `교육·부트캠프`, `사이드·스터디`. */
  kindLabel: string;
  /** 로고 옆 이름. 채용·부트캠프는 회사명, 사이드·스터디는 작성자 이름이다. */
  organizationName: string;
  title: string;
  logoUrl?: string;
  /** 아래 줄의 마감 문구(`10/14(수) 마감`, `상시모집`). */
  deadlineText: string;
}

/**
 * 상세 공고를 공유했을 때 미리보기에 뜨는 카드 이미지. 채용·부트캠프·사이드스터디 상세의
 * `opengraph-image.tsx` 가 같은 모양으로 그린다.
 *
 * 한눈에 셋이 읽혀야 한다 — 어느 회사의 무슨 공고인지(로고·회사명·제목), 언제까지인지(마감),
 * 오공고에서 온 링크인지(왼쪽 위 `오늘의 공고`, 오른쪽 아래 주소). 색은 사이트의 `blue-500`
 * (#4A76FF) 과 `gray-900` 이다.
 */
export async function renderPostingOgImage({
  kindLabel,
  organizationName,
  title,
  logoUrl,
  deadlineText,
}: PostingOgImageProps): Promise<ImageResponse> {
  const [bold, medium, logo] = await Promise.all([
    loadFont('Bold'),
    loadFont('Medium'),
    loadLogo(logoUrl),
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
        background: 'linear-gradient(135deg, #F5F9FF 0%, #EBF1FF 100%)',
        fontFamily: 'Pretendard',
        color: '#111827',
      }}
    >
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
          {kindLabel}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              width: 104,
              height: 104,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              background: '#FFFFFF',
              border: '2px solid #E5E7EB',
              overflow: 'hidden',
            }}
          >
            {logo ? (
              <img src={logo} width={88} height={88} style={{ objectFit: 'contain' }} alt="" />
            ) : (
              <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, color: '#4A76FF' }}>
                {organizationName.slice(0, 1)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 500, color: '#374151' }}>
            {organizationName}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.25,
            // 두 줄을 넘으면 자른다. 이미지 생성기는 line-clamp 를 이렇게 받는다.
            lineClamp: 2,
          }}
        >
          {title}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 500, color: '#4B5563' }}>
          {deadlineText}
        </div>
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
