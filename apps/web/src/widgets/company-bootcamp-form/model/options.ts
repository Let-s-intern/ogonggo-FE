import type { SelectOption } from '@ogonggo/ui';
import type {
  CreateCompanyBootcampRequestOperationType,
  CreateCompanyBootcampRequestTuitionType,
} from '@ogonggo/api';
import { OPERATION_TYPE_LABELS, TUITION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';

/**
 * 교육·부트캠프 작성 폼 드롭다운의 선택지(v5 PRD 4 절).
 *
 * 진행 방식과 수강료 유형은 `entities/bootcamp/model/labels.ts` 에서 온다 — 공개 목록·상세가
 * 그 말로 그리고 있어, 작성 화면이 다른 말을 쓰면 쓴 사람이 자기 공고를 못 알아본다.
 *
 * **목업의 `교육 기간` 은 드롭다운인데 여기서는 날짜 두 칸이다.** 요청이 받는 것은
 * `programStartDate`·`programEndDate` 두 날짜이고(둘 다 필수), 드롭다운으로는 그 값을 만들
 * 수 없다. 목업이 무엇을 고르게 하려던 것인지(`12주 과정` 같은 기간 길이로 보인다) 는 담을
 * 곳이 없다 — 공개 상세의 `기간` 칸도 커리큘럼의 마지막 주차나 두 날짜의 차이로 계산한다
 * (`widgets/bootcamp-detail/ui/BootcampInfoGrid.tsx`).
 */

/** 고르기 전 첫 줄. `<select>` 는 값이 늘 있어야 해서 빈 문자열을 자리로 쓴다. */
const placeholder = (label: string): SelectOption => ({ value: '', label });

export const OPERATION_TYPE_OPTIONS: SelectOption[] = [
  placeholder('진행 방식을 선택해 주세요.'),
  ...(['ONLINE', 'OFFLINE', 'HYBRID'] as CreateCompanyBootcampRequestOperationType[]).map(
    (value) => ({ value, label: OPERATION_TYPE_LABELS[value] }),
  ),
];

export const TUITION_TYPE_OPTIONS: SelectOption[] = [
  placeholder('수강료 유형을 선택해 주세요.'),
  ...(['FREE', 'PAID', 'GOVERNMENT_FUNDED'] as CreateCompanyBootcampRequestTuitionType[]).map(
    (value) => ({ value, label: TUITION_TYPE_LABELS[value] }),
  ),
];

/**
 * 프로그램 유형 — `programType` 은 자유 문자열(최대 50 자) 이고 고를 값을 주는 API 가 없는데
 * 목업이 드롭다운이라 고를 목록이 필요하다.
 *
 * `부트캠프` 가 첫 줄인 이유는 공개 목록의 `부트캠프` 탭이 **그 글자와 정확히 같은 값만**
 * 거르기 때문이다(`widgets/bootcamp-list/lib/query.ts` 의 `TAB_FILTERS`). 다른 말로 적으면
 * 그 탭에 걸리지 않는다.
 *
 * 자유 입력으로 두지 않은 이유는 같은 과정이 `부트캠프`·`부트 캠프`·`Bootcamp` 로 갈리기
 * 때문이다. 크롤러가 넣은 값(`AI`, `파이썬` 같은 카테고리 표기) 은 목록에 없으므로
 * `withCurrentValue` 가 한 줄 더해 준다.
 */
export const PROGRAM_TYPE_OPTIONS: SelectOption[] = [
  placeholder('프로그램 유형을 선택해 주세요.'),
  ...['부트캠프', '직무 교육', '온라인 강의', '세미나 · 특강', '멘토링'].map((value) => ({
    value,
    label: value,
  })),
];

/**
 * 읽어 온 값이 목록에 없으면 그 값을 한 줄 더해 준다.
 *
 * 목록에 없는 값을 `<select>` 에 넣으면 브라우저가 첫 줄로 되돌리고, 그대로 저장하면 원래
 * 값이 조용히 사라진다(채용공고 폼의 같은 함수와 같은 이유다,
 * `widgets/company-job-form/model/options.ts`).
 */
export function withCurrentValue(options: SelectOption[], value: string): SelectOption[] {
  if (!value || options.some((option) => option.value === value)) {
    return options;
  }
  return [...options, { value, label: value }];
}
