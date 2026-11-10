import { enumLabel } from '@ogonggo/api';
import { ImageResponse } from 'next/og';
import { HERO_CONTENT, type HeroScreen } from '@/shared/lib/heroContent';
import { OgLogoMark } from './ogLogoMark';
import { loadFonts, POSTING_OG_SIZE } from './postingOgImage';

/** 헤드라인 한 조각. `accent` 면 민트로 칠한다. */
interface OgSegment {
  text: string;
  accent?: boolean;
}

interface SectionOgConfig {
  /** 왼쪽 흰 칩. 상세 미리보기(`renderPostingOgImage`)의 `kindLabel` 과 같은 말이다. */
  kindLabel: string;
  /** 오른쪽 위 주소 뒤에 붙는 경로. */
  path: string;
  /** 카드 바탕색. 흰 글자가 4.5:1 을 넘는 진한 색이다. */
  ground: string;
  /** 흰 칩 안 글자색. */
  labelColor: string;
  lines: OgSegment[][];
  /** 헤드라인 아래 한 줄. 히어로가 있는 화면은 히어로 배지 문구 그대로다. */
  badge: string;
  /** 아래 줄 `#` 칩. 이 화면에서 고를 수 있는 분류의 라벨이다(enum 카탈로그). */
  chips: string[];
}

/**
 * 목록 화면별 미리보기 카드 내용. 배지 문구는 그 화면 히어로(`HERO_CONTENT`)의 것을 그대로 쓰고,
 * 헤드라인은 강조 위치만 미리보기에 맞게 다시 적었다 — 히어로는 사이드·스터디와 취준 고민에
 * 강조가 없는데, 단색 바탕에서는 한 조각을 민트로 칠해야 눈이 간다.
 */
/** 목록 카드가 있는 화면. 히어로가 있는 화면들과, 히어로 없이 카드만 있는 공고 달력이다. */
export type SectionOgScreen = HeroScreen | 'calendar';

const SECTIONS: Record<SectionOgScreen, SectionOgConfig> = {
  jobs: {
    badge: HERO_CONTENT.jobs.badge,
    kindLabel: '채용공고',
    path: '',
    ground: '#3B60E6',
    labelColor: '#2D4ABD',
    lines: [
      [{ text: '커리어 여정에' }, { text: '딱!', accent: true }, { text: '맞는' }],
      [{ text: '채용공고만' }, { text: '쏙!', accent: true }, { text: '보여드려요' }],
    ],
    chips: (
      ['IT_DEVELOPMENT', 'PLANNING_STRATEGY', 'MARKETING_ADVERTISING', 'SALES', 'GAME'] as const
    ).map((value) => enumLabel('JobField', value)),
  },
  bootcamps: {
    badge: HERO_CONTENT.bootcamps.badge,
    kindLabel: '교육·부트캠프',
    path: '/bootcamps',
    ground: '#00806F',
    labelColor: '#00705F',
    lines: [[{ text: '실무를 배울 수 있는' }], [{ text: '교육만 골라 모았어요' }]],
    chips: [
      '부트캠프',
      enumLabel('BootcampCategory', 'KDT'),
      enumLabel('BootcampCategory', 'SESAC'),
      enumLabel('BootcampTuitionType', 'GOVERNMENT_FUNDED'),
      enumLabel('BootcampTuitionType', 'FREE'),
    ],
  },
  'side-studies': {
    badge: HERO_CONTENT['side-studies'].badge,
    kindLabel: '사이드·스터디',
    path: '/side-studies',
    ground: '#111827',
    labelColor: '#111827',
    lines: [
      [{ text: '혼자 말고,' }],
      [{ text: '함께할 사람을' }, { text: '찾아보세요', accent: true }],
    ],
    chips: (['BACKEND', 'FRONTEND', 'DESIGN', 'PM', 'MARKETING'] as const).map((value) =>
      enumLabel('RecruitmentPostPosition', value),
    ),
  },
  concerns: {
    badge: HERO_CONTENT.concerns.badge,
    kindLabel: '취준 고민',
    path: '/concerns',
    ground: '#1E3366',
    labelColor: '#1E3366',
    lines: [
      [{ text: '취업 준비하다' }, { text: '막히는 순간', accent: true }],
      [{ text: '여기서 물어보세요' }],
    ],
    chips: (['JOB_POSTING', 'CAREER', 'APPLICATION_INTERVIEW', 'SIDE_EXPERIENCE'] as const).map(
      (value) => enumLabel('ConcernCategory', value),
    ),
  },
  /** 칩은 이 화면이 안내하는 채널들이다(`app/(site)/community/page.tsx` 의 설명). */
  community: {
    badge: HERO_CONTENT.community.badge,
    kindLabel: '커뮤니티',
    path: '/community',
    ground: '#2D4ABD',
    labelColor: '#2D4ABD',
    lines: [
      [{ text: '막막하고 외로운 취준,' }],
      [{ text: '함께라면' }, { text: '달라집니다', accent: true }],
    ],
    chips: ['직무별 오픈채팅방', '오공고 인스타그램', '렛츠커리어 인스타그램'],
  },
  /**
   * 공고 달력(`/calendar`). 히어로가 없어 배지 문구를 따로 적는다. 채용공고의 하위 메뉴라 칩은
   * 채용공고와 같은 직군이고, 바탕은 채용공고보다 한 단계 진한 파랑이다.
   */
  calendar: {
    badge: '관심 직무를 고르면 그 공고만 날짜별로 모아 보여드려요',
    kindLabel: '공고 달력',
    path: '/calendar',
    ground: '#2C4999',
    labelColor: '#2C4999',
    lines: [
      [{ text: '관심 직무 공고 마감일,' }],
      [{ text: '달력으로' }, { text: '한눈에', accent: true }],
    ],
    chips: (
      ['IT_DEVELOPMENT', 'PLANNING_STRATEGY', 'MARKETING_ADVERTISING', 'SALES', 'GAME'] as const
    ).map((value) => enumLabel('JobField', value)),
  },
};

/**
 * 채용공고(`/`)·교육·부트캠프·사이드·스터디·취준 고민·커뮤니티 목록과 공고 달력을 공유했을 때
 * 미리보기 카드.
 *
 * 목록에 `og:image` 가 없으면 카카오톡 같은 미리보기가 본문의 첫 이미지, 곧 목록 첫 카드의
 * 썸네일을 가져다 쓴다. 그래서 화면마다 자기 카드를 낸다. 화면마다 바탕색이 다르고, 오른쪽 아래에
 * 로고 마크를 크게 깔아 오공고 카드임을 알린다. 목록 미리보기는 빌드 때 한 번 그려지므로 특정
 * 공고나 개수처럼 금방 낡는 내용은 넣지 않는다.
 */
export async function renderSectionOgImage(screen: SectionOgScreen): Promise<ImageResponse> {
  const section = SECTIONS[screen];
  const fonts = await loadFonts(['ExtraBold', 'Bold', 'SemiBold', 'Medium']);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 72px',
        position: 'relative',
        background: section.ground,
        fontFamily: 'Pretendard',
        color: '#FFFFFF',
      }}
    >
      <OgLogoMark
        width={760}
        color="rgba(255, 255, 255, 0.13)"
        style={{ position: 'absolute', right: -150, bottom: -70 }}
      />

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <OgLogoMark width={64} color="#FFFFFF" />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800 }}>오늘의 공고</div>
        </div>
        <div
          style={{
            display: 'flex',
            marginLeft: 'auto',
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          {`ogonggo.co.kr${section.path}`}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '10px 24px',
            borderRadius: 999,
            background: '#FFFFFF',
            color: section.labelColor,
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          {section.kindLabel}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {section.lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              style={{
                display: 'flex',
                gap: 18,
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.035em',
              }}
            >
              {line.map((segment, segmentIndex) => (
                <span key={segmentIndex} style={segment.accent ? { color: '#8FF0C2' } : {}}>
                  {segment.text}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            fontWeight: 500,
            opacity: 0.92,
          }}
        >
          {section.badge}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {section.chips.map((chip) => (
          <div
            key={chip}
            style={{
              display: 'flex',
              padding: '10px 22px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.16)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {`# ${chip}`}
          </div>
        ))}
      </div>
    </div>,
    { ...POSTING_OG_SIZE, fonts },
  );
}
