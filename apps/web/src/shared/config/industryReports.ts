/**
 * 산업 트렌드 리포트 판매 상품. 산업 하나가 렛츠커리어 가이드북 하나다.
 *
 * 주소 이름(`slug`)은 판매 상세 `/reports/{slug}` 에 쓰고, 이 목록에 있는 값만 열린다. 노출 순서는
 * 배열 순서다. 제목·썸네일·가격은 가이드북 id 로 렛츠커리어에서 읽으므로(`shared/api/letsCareerGuidebook.ts`)
 * 여기에 두지 않는다.
 *
 * `guidebookId` 는 마케팅팀이 렛츠커리어 어드민에서 개설한 `이번주 {산업} 산업 트렌드 분석 리포트`
 * 가이드북이다(2026-11-26 개설, 21 엔터, 22 뷰티, 23 F&B, 24 IT·플랫폼, 25 유통·이커머스). 제목으로 렛츠커리어
 * 공개 API 에서 찾은 id 다. 리포트 가이드북이 바뀌면 이 다섯 id 만 교체한다. 다른 코드는 바뀌지 않는다.
 *
 * 화면 이름(`label`)은 `fnb` 를 `식음료`(`F&B` 는 줄임말이라 뜻이 바로 안 와닿는다), `entertainment` 를 `엔터테인먼트`
 * (상품 제목과 같게)로 쓴다. 주소 이름과 가이드북 id 는 그대로다.
 *
 * `tagline` 은 마케팅팀이 만든 각 상세 이미지의 `산업 종류` 부분에 적힌 산업 소개 줄을 그대로 옮긴 것이다
 * (예: 식음료 `식품·외식·배달`). 우리가 지어낸 글이 아니다. 상세 이미지가 바뀌면 여기도 맞춘다.
 */

export interface IndustryReport {
  /** 판매 상세 주소의 마지막 칸. 중복되면 안 된다. */
  slug: string;
  /** 화면에 보이는 산업 이름. */
  label: string;
  /** 이 산업이 다루는 범위를 보여 주는 한 줄(마케팅팀 상세 이미지의 글). */
  tagline: string;
  /** 이번 주 핵심. 매주 바꾼다(파일 위 주석). */
  weekly: { headline: string; points: readonly string[] };
  /** 렛츠커리어 가이드북 id(파일 위 주석). */
  guidebookId: number;
}

export const INDUSTRY_REPORTS = [
  {
    slug: 'fnb',
    label: '식음료',
    tagline: '식품·외식·배달',
    weekly: {
      headline: '국내 판매는 부진, 수출은 역대 최대.',
      points: [
        '식품 기업들의 3분기 실적이 ‘내수 부진·수출 호조’로 갈렸다. (불닭·신라면 수출 호조, 내수는 부진)',
        '라면이 올해 수출 사상 첫 20억 달러에 도전한다 — 멕시코·중동 등 신시장이 성장을 이끌었다.',
        '배달은 배민·쿠팡이츠 2강의 구독 유지 경쟁으로, 외식은 ‘한 그릇·가성비’가 키워드가 됐다.',
      ],
    },
    guidebookId: 23,
  },
  {
    slug: 'it-platform',
    label: 'IT·플랫폼',
    tagline: '네이버·카카오·AI',
    weekly: {
      headline: '매출은 잘 나오는데, AI로 돈 버는 건 이제부터.',
      points: [
        '네이버가 분기 매출 첫 3조를 돌파했지만 AI 인프라 투자 비용으로 영업이익은 줄었어요.',
        '카카오는 톡비즈 커머스·광고 성장과 비용 효율화로 수익성을 개선했어요(영업이익 +7%).',
        '두 회사 모두 ‘에이전틱 AI’를 새 성장축으로 — 쇼핑·검색·메신저에 AI를 심는 경쟁이 본격화됐어요.',
      ],
    },
    guidebookId: 24,
  },
  {
    slug: 'beauty',
    label: '뷰티',
    tagline: '화장품·K뷰티·올리브영',
    weekly: {
      headline: '중국은 지고, 미국이 떴다.',
      points: [
        '3분기 K뷰티 ‘삼대장’의 해외 성과가 희비를 갈랐어요 — 아모레·에이피알은 웃고, LG생건 뷰티는 적자.',
        '화장품 수출이 미국을 최대 시장으로 또 역대 최대 — 중국 의존을 벗고 ‘세계 2위 수출국’에 올랐어요.',
        '유통이 온라인(아마존·틱톡샵)에서 오프라인(세포라·타겟)으로 넓어지는 ‘2라운드’에 진입했어요.',
      ],
    },
    guidebookId: 22,
  },
  {
    slug: 'entertainment',
    label: '엔터테인먼트',
    tagline: '영화·OTT·드라마·K팝',
    weekly: {
      headline: '매출은 역대 최대, 영업이익은 기대보다 줄었다.',
      points: [
        '하이브가 분기 역대 최대 매출을 기록했지만, 빅4 공통으로 ‘매출 증가·이익 둔화’가 나타나며 수익 구조가 화두가 됐다.',
        '신인 데뷔가 3배로 늘고(여러 IP를 함께 키우는 전략) 매출 축이 앨범에서 공연·MD로 이동 — 제작·공연·IP 직무 수요의 배경이다.',
        '11월 드라마 신작이 몰리며 OTT 구독 유지 경쟁이 커졌고, 극장가는 ‘오디세이’가 1,200만 관객을 넘겼다.',
      ],
    },
    guidebookId: 21,
  },
  {
    slug: 'retail-ecommerce',
    label: '유통·이커머스',
    tagline: '쿠팡·무신사·전문몰',
    weekly: {
      headline: '쿠팡이 흔들리는 사이, 무신사·올리브영이 달린다.',
      points: [
        '쿠팡이 3분기 매출은 늘었지만 세 분기 연속 영업손실 — 지난해 개인정보 유출 사태 여파가 이어졌어요.',
        '그 틈에 네이버 커머스가 반사이익을, 올리브영·무신사 같은 전문몰이 질주했어요.',
        '전문몰이 ‘파는 곳’을 넘어 ‘카테고리 미디어(리테일 미디어)’로 진화 — 입점·광고·데이터를 묶어요.',
      ],
    },
    guidebookId: 25,
  },
] as const satisfies readonly IndustryReport[];

export type IndustrySlug = (typeof INDUSTRY_REPORTS)[number]['slug'];

/** 주소의 값이 알려진 산업이면 그 상품을, 아니면 `undefined` 를 돌려준다(호출한 쪽이 `notFound`). */
export function findIndustryReport(slug: string): (typeof INDUSTRY_REPORTS)[number] | undefined {
  return INDUSTRY_REPORTS.find((report) => report.slug === slug);
}
