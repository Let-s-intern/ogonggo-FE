/**
 * 구매 카드의 정보 줄(`발행` · `형식` · `열람` · `대상`). 라벨-값 목록 한 곳이 이 파일이다.
 *
 * 렛츠커리어 가이드북의 `contentComposition`(구성), `accessMethod`(열람 방법), `recommendedFor`(추천 대상)가
 * 비어 있지 않으면 그 값이 먼저다. 새 산업 리포트 가이드북 다섯 건은 이 셋이 모두 빈 문자열이라 지금은 아래
 * 기본 문구가 보인다. `발행` 은 읽을 필드가 없어 늘 기본 문구다.
 *
 * 기본 문구의 출처는 마케팅팀이 알려 준 운영 내용(매주 월요일에 리포트를 만들고, 구매하면 PDF 로 열람)이다.
 * 렛츠커리어 응답에서 읽은 값이 아니다. 사실과 맞는지 사용자 확인 필요 — 바뀌면 이 파일만 고친다.
 * 환불·열람 기간 같은 약속은 근거가 없어 적지 않았다.
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

const DEFAULT_ISSUE = '매주 월요일';
const DEFAULT_FORMAT = 'PDF';
const DEFAULT_ACCESS = '결제 후 내 리포트에서';

/** 렛츠커리어 값이 있으면 그것을, 없으면(`null`, 공백뿐) 기본 문구를 쓴다. `대상` 은 기본이 없어 값이 있을 때만 줄이 생긴다. */
export function saleInfoRows(source: SaleInfoSource): SaleInfoRow[] {
  const pick = (value: string | null) => (value?.trim() ? value.trim() : null);
  const rows: SaleInfoRow[] = [
    { label: '발행', value: DEFAULT_ISSUE },
    { label: '형식', value: pick(source.contentComposition) ?? DEFAULT_FORMAT },
    { label: '열람', value: pick(source.accessMethod) ?? DEFAULT_ACCESS },
  ];
  const audience = pick(source.recommendedFor);
  if (audience) {
    rows.push({ label: '대상', value: audience });
  }
  return rows;
}
