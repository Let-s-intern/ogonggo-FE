/**
 * 구매 카드의 정보 줄(`구성` · `열람` · `대상`). 렛츠커리어 가이드북의 `contentComposition`, `accessMethod`,
 * `recommendedFor` 에 실제 값이 있을 때만 그 값을 그대로 줄로 만든다. 비어 있으면 줄이 없고, 대신 채워 넣는
 * 문구도 없다 — 읽은 값이 아닌 말을 상품 설명처럼 보이지 않게 한다. 셋이 모두 비면 목록이 비고 카드는 정보 줄
 * 없이 그려진다(2026-11-26 새 산업 리포트 가이드북 다섯이 그 경우다).
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

export function saleInfoRows(source: SaleInfoSource): SaleInfoRow[] {
  const rows: SaleInfoRow[] = [
    { label: '구성', value: source.contentComposition?.trim() ?? '' },
    { label: '열람', value: source.accessMethod?.trim() ?? '' },
    { label: '대상', value: source.recommendedFor?.trim() ?? '' },
  ];
  return rows.filter((row) => row.value !== '');
}
