/**
 * 산업 트렌드 리포트 판매 상품. 산업 하나가 렛츠커리어 가이드북 하나다.
 *
 * 주소 이름(`slug`)은 판매 상세 `/reports/{slug}` 에 쓰고, 이 목록에 있는 값만 열린다. 노출 순서는
 * 배열 순서다. 제목·썸네일·가격은 가이드북 id 로 렛츠커리어에서 읽으므로(`shared/api/letsCareerGuidebook.ts`)
 * 여기에 두지 않는다.
 *
 * 임시: `guidebookId` 는 렛츠커리어에 이미 있는 가이드북(포트폴리오 2, 자기소개서 5, 이력서 6, 경험정리 7,
 * 면접 9)으로 개발과 검증을 하려고 채운 값이다. 마케팅팀이 실제 리포트 가이드북을 개설하면 이 다섯 id 만
 * 교체한다(PRD 5장). 다른 코드는 바뀌지 않는다.
 */

export interface IndustryReport {
  /** 판매 상세 주소의 마지막 칸. 중복되면 안 된다. */
  slug: string;
  /** 화면에 보이는 산업 이름. */
  label: string;
  /** 렛츠커리어 가이드북 id. 임시 값이다(파일 위 주석). */
  guidebookId: number;
}

export const INDUSTRY_REPORTS = [
  { slug: 'fnb', label: 'F&B', guidebookId: 2 },
  { slug: 'it-platform', label: 'IT·플랫폼', guidebookId: 5 },
  { slug: 'beauty', label: '뷰티', guidebookId: 6 },
  { slug: 'entertainment', label: '엔터', guidebookId: 7 },
  { slug: 'retail-ecommerce', label: '유통·이커머스', guidebookId: 9 },
] as const satisfies readonly IndustryReport[];

export type IndustrySlug = (typeof INDUSTRY_REPORTS)[number]['slug'];

/** 주소의 값이 알려진 산업이면 그 상품을, 아니면 `undefined` 를 돌려준다(호출한 쪽이 `notFound`). */
export function findIndustryReport(slug: string): (typeof INDUSTRY_REPORTS)[number] | undefined {
  return INDUSTRY_REPORTS.find((report) => report.slug === slug);
}
