import type {
  CreateRecruitmentPostRequest,
  CreateRecruitmentPostRequestContactMethod,
  CreateRecruitmentPostRequestPositionsItem,
  CreateRecruitmentPostRequestProgressMethod,
  CreateRecruitmentPostRequestRecruitmentType,
  JsonNode,
  RecruitmentPostFormResponse,
} from '@ogonggo/api';
import { lexicalToText } from '../lib/content';

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
  /** 모집 상세 내용. 공용 편집기(`RichTextEditor`)의 EditorState JSON 그대로다. */
  content?: JsonNode;
  /** `content` 의 서식 없는 글자. 칸이 채워졌는지 볼 때 쓴다. */
  contentText: string;
  /** `content` 에 이미지가 있는지. 이미지만 넣은 본문도 채워진 것으로 본다. */
  contentHasImage: boolean;
  eligibilityAndSelectionProcess: string;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  positions: CreateRecruitmentPostRequestPositionsItem[];
  contactMethod: CreateRecruitmentPostRequestContactMethod | '';
  contactValue: string;
  agreedToPolicy: boolean;
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
  contentHasImage: false,
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
    capacity: form.capacity == null ? '' : String(form.capacity),
    progressMethod: form.progressMethod ?? '',
    activityDurationMonths:
      form.activityDurationMonths == null ? '' : String(form.activityDurationMonths),
    technologyStacks: form.technologyStacks,
    summary: form.summary ?? '',
    content: form.content,
    contentText: lexicalToText(form.content),
    contentHasImage: JSON.stringify(form.content ?? null).includes('"type":"image"'),
    eligibilityAndSelectionProcess: form.eligibilityAndSelectionProcess ?? '',
    recruitmentStartDate: form.recruitmentStartDate ?? '',
    recruitmentEndDate: form.recruitmentEndDate ?? '',
    positions: form.positions,
    contactMethod: form.contactMethod ?? '',
    contactValue: form.contactValue ?? '',
    agreedToPolicy: form.agreedToPolicy,
  };
}

/** 모집 상세 내용이 채워졌는지. 글자나 이미지가 하나라도 있으면 채워진 것이다. */
export function hasContentBody(values: RecruitmentPostFormValues): boolean {
  return values.contentText.trim().length > 0 || values.contentHasImage;
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
): CreateRecruitmentPostRequest {
  return {
    title: values.title.trim(),
    recruitmentType: values.recruitmentType || undefined,
    capacity: numberOrUndefined(values.capacity),
    progressMethod: values.progressMethod || undefined,
    activityDurationMonths: numberOrUndefined(values.activityDurationMonths),
    technologyStacks: values.technologyStacks.length > 0 ? values.technologyStacks : undefined,
    summary: textOrUndefined(values.summary),
    content: hasContentBody(values) ? values.content : undefined,
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
