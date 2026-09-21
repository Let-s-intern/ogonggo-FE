import type {
  CreateRecruitmentPostRequest,
  CreateRecruitmentPostRequestContactMethod,
  CreateRecruitmentPostRequestPositionsItem,
  CreateRecruitmentPostRequestProgressMethod,
  CreateRecruitmentPostRequestRecruitmentType,
  JsonNode,
  RecruitmentPostFormResponse,
} from '@ogonggo/api';
import { lexicalToText, textToLexical } from '../lib/content';

/**
 * 작성 화면이 들고 있는 값(PRD 5 절). `CreateRecruitmentPostRequest` 와 한 칸씩 짝이 맞되,
 * 고르지 않은 드롭다운을 빈 문자열로 들고 있어 타입이 다르다 — `<select>` 의 값은 늘
 * 문자열이고, 숫자 칸(`capacity`·`activityDurationMonths`) 도 고르기 전에는 값이 없다.
 *
 * 목업과 다르게 그리는 것 셋은 여기서 이미 결정돼 있다(PRD 5 절).
 * 진행 기간은 `activityDurationMonths` 개월 정수 하나이고, 모집 포지션은 여섯 고정이며,
 * 포지션별 인원은 없다 — 인원은 `capacity` 하나뿐이다.
 */
export interface RecruitmentPostFormValues {
  title: string;
  recruitmentType: CreateRecruitmentPostRequestRecruitmentType | '';
  capacity: string;
  progressMethod: CreateRecruitmentPostRequestProgressMethod | '';
  activityDurationMonths: string;
  technologyStacks: string[];
  summary: string;
  /** 모집 상세 내용을 평문으로 들고 있는다. 저장할 때 Lexical JSON 으로 바꾼다. */
  contentText: string;
  eligibilityAndSelectionProcess: string;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  positions: CreateRecruitmentPostRequestPositionsItem[];
  contactMethod: CreateRecruitmentPostRequestContactMethod | '';
  contactValue: string;
  agreedToPolicy: boolean;
}

/**
 * 수정 진입 때 읽어 온 본문을 그대로 들고 있는 자리.
 *
 * 작성 칸이 평문이라, 서식을 가진 글을 열었다가 본문을 건드리지 않고 저장하면 서식이 사라진다.
 * 글자가 그대로면 읽어 온 JSON 을 그대로 돌려보내 그 일을 막는다 — PRD 검증 항목의
 * "수정 후 건드리지 않은 값이 남아 있는지" 가 본문에도 걸린다.
 */
export interface LoadedContent {
  json?: JsonNode;
  text: string;
}

export const EMPTY_FORM_VALUES: RecruitmentPostFormValues = {
  title: '',
  recruitmentType: '',
  capacity: '',
  progressMethod: '',
  activityDurationMonths: '',
  technologyStacks: [],
  summary: '',
  contentText: '',
  eligibilityAndSelectionProcess: '',
  recruitmentStartDate: '',
  recruitmentEndDate: '',
  positions: [],
  contactMethod: '',
  contactValue: '',
  agreedToPolicy: false,
};

/**
 * 읽어 온 폼을 화면 값으로. `agreedToPolicy` 는 백엔드가 늘 `false` 로 주므로(생성 타입 설명)
 * 그대로 받는다 — 수정 화면에서도 동의를 다시 받는다.
 */
export function toFormValues(form: RecruitmentPostFormResponse): RecruitmentPostFormValues {
  return {
    title: form.title,
    recruitmentType: form.recruitmentType ?? '',
    capacity: form.capacity === undefined ? '' : String(form.capacity),
    progressMethod: form.progressMethod ?? '',
    activityDurationMonths:
      form.activityDurationMonths === undefined ? '' : String(form.activityDurationMonths),
    technologyStacks: form.technologyStacks,
    summary: form.summary ?? '',
    contentText: lexicalToText(form.content),
    eligibilityAndSelectionProcess: form.eligibilityAndSelectionProcess ?? '',
    recruitmentStartDate: form.recruitmentStartDate ?? '',
    recruitmentEndDate: form.recruitmentEndDate ?? '',
    positions: form.positions,
    contactMethod: form.contactMethod ?? '',
    contactValue: form.contactValue ?? '',
    agreedToPolicy: form.agreedToPolicy,
  };
}

export function toLoadedContent(form: RecruitmentPostFormResponse): LoadedContent {
  return { json: form.content, text: lexicalToText(form.content) };
}

/** 빈 칸은 보내지 않는다. 숫자 칸은 고르지 않았으면 값이 없다. */
const textOrUndefined = (value: string) => value.trim() || undefined;
const numberOrUndefined = (value: string) => (value === '' ? undefined : Number(value));

/**
 * 화면 값을 요청 바디로. `saveMode` 는 누른 버튼이 정한다 — `임시저장` 이 `DRAFT`,
 * `모집글 등록` 이 `PUBLISH` 다(PRD 5 절).
 *
 * 수정은 전체 교체라 읽어 온 값을 빠짐없이 다시 실어야 한다(생성 타입 설명). 그래서 빈 칸을
 * 빼는 것 말고는 아무것도 걸러내지 않는다 — 칸 하나를 고쳐 저장했을 때 나머지가 남는 근거가
 * 이것이다.
 */
export function toCreateRequest(
  values: RecruitmentPostFormValues,
  saveMode: CreateRecruitmentPostRequest['saveMode'],
  loaded?: LoadedContent,
): CreateRecruitmentPostRequest {
  return {
    title: values.title.trim(),
    recruitmentType: values.recruitmentType || undefined,
    capacity: numberOrUndefined(values.capacity),
    progressMethod: values.progressMethod || undefined,
    activityDurationMonths: numberOrUndefined(values.activityDurationMonths),
    technologyStacks: values.technologyStacks.length > 0 ? values.technologyStacks : undefined,
    summary: textOrUndefined(values.summary),
    content: buildContent(values.contentText, loaded),
    eligibilityAndSelectionProcess: textOrUndefined(values.eligibilityAndSelectionProcess),
    recruitmentStartDate: textOrUndefined(values.recruitmentStartDate),
    recruitmentEndDate: textOrUndefined(values.recruitmentEndDate),
    positions: values.positions.length > 0 ? values.positions : undefined,
    contactMethod: values.contactMethod || undefined,
    contactValue: textOrUndefined(values.contactValue),
    agreedToPolicy: values.agreedToPolicy,
    saveMode,
  };
}

/** 글자를 건드리지 않았으면 읽어 온 JSON 을 그대로 돌려보낸다(`LoadedContent` 주석). */
function buildContent(text: string, loaded?: LoadedContent): JsonNode | undefined {
  if (loaded?.json !== undefined && loaded.text === text) {
    return loaded.json;
  }
  return text.trim() ? textToLexical(text) : undefined;
}
