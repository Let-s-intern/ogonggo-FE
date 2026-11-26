/**
 * 구매 카드의 정보 줄(`구성` · `열람` · `대상`). 렛츠커리어 가이드북의 `contentComposition`, `accessMethod`,
 * `recommendedFor` 에 값이 있으면 그 값을 그대로 쓰고, 비어 있는 칸은 마케팅팀이 만든 상세 이미지에 적힌 말로 채운다
 * (`IMAGE_COPY`). 다섯 산업이 같은 구성이라 같은 말이다. 우리가 지어낸 글이 아니고, 렛츠커리어 어드민에서 칸을 채우면
 * 그 값이 우선한다. 상세 이미지가 바뀌면 `IMAGE_COPY` 도 맞춘다.
 */

export interface SaleInfoRow {
  label: string;
  value: string;
}

/** `LetsCareerGuidebook` 중 이 파일이 쓰는 칸. 단위 테스트가 `@/` 별칭을 풀지 못해 모양만 적는다. */
interface SaleInfoSource {
  contentComposition: string | null;
  accessMethod: string | null;
  recommendedFor: string | null;
}

/**
 * 상세 이미지에 적힌 말. 구성은 이미지의 `리포트 구성`(분야별 산업 뉴스 01~04, 취업 관점 05~07, 부록 용어 설명), 열람은
 * `전체 내용은 결제 후 PDF로 받아볼 수 있어요`, 대상은 머리말의 `그 트렌드를 자소서에 녹이기 어려운 취준생을 위한 리포트예요`다.
 */
const IMAGE_COPY = {
  contentComposition: '분야별 산업 뉴스 · 취업 관점 · 용어 설명',
  accessMethod: '결제 후 PDF로 받아요',
  recommendedFor: '산업 트렌드를 자소서에 녹이기 어려운 취준생',
} as const;

/** 렛츠커리어 값이 있으면 그 값, 비었으면 상세 이미지의 말. */
const pick = (value: string | null, fallback: string) => value?.trim() || fallback;

export function saleInfoRows(source: SaleInfoSource): SaleInfoRow[] {
  return [
    {
      label: '구성',
      value: pick(source.contentComposition, IMAGE_COPY.contentComposition),
    },
    { label: '열람', value: pick(source.accessMethod, IMAGE_COPY.accessMethod) },
    { label: '대상', value: pick(source.recommendedFor, IMAGE_COPY.recommendedFor) },
  ];
}
