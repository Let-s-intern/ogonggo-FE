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
  /** 렛츠커리어 가이드북 id(파일 위 주석). */
  guidebookId: number;
}

export const INDUSTRY_REPORTS = [
  { slug: 'fnb', label: '식음료', tagline: '식품·외식·배달', guidebookId: 23 },
  { slug: 'it-platform', label: 'IT·플랫폼', tagline: '네이버·카카오·AI', guidebookId: 24 },
  { slug: 'beauty', label: '뷰티', tagline: '화장품·K뷰티·올리브영', guidebookId: 22 },
  { slug: 'entertainment', label: '엔터테인먼트', tagline: '영화·OTT·드라마·K팝', guidebookId: 21 },
  { slug: 'retail-ecommerce', label: '유통·이커머스', tagline: '쿠팡·무신사·전문몰', guidebookId: 25 },
] as const satisfies readonly IndustryReport[];

export type IndustrySlug = (typeof INDUSTRY_REPORTS)[number]['slug'];

/** 주소의 값이 알려진 산업이면 그 상품을, 아니면 `undefined` 를 돌려준다(호출한 쪽이 `notFound`). */
export function findIndustryReport(slug: string): (typeof INDUSTRY_REPORTS)[number] | undefined {
  return INDUSTRY_REPORTS.find((report) => report.slug === slug);
}
