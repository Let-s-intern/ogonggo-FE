import type {
  CompanyBootcampDetailResponse,
  CreateCompanyBootcampRequest,
  CreateCompanyBootcampRequestApplicationMethod,
  CreateCompanyBootcampRequestOperationType,
  CreateCompanyBootcampRequestStatus,
  CreateCompanyBootcampRequestTuitionType,
  UpdateCompanyBootcampRequest,
} from '@ogonggo/api';
import { toDateInputValue, toEndDateTime, toStartDateTime } from '@/shared/lib/formDateTime';
import {
  appendContentExtras,
  EMPTY_BOOTCAMP_CONTENT_EXTRAS,
  type BootcampContentExtras,
} from '../lib/contentExtras';
import {
  EMPTY_CURRICULUM_ROW,
  EMPTY_PARTNER_ROW,
  type BootcampCurriculumRow,
  type BootcampPartnerRow,
} from './rows';

/**
 * 교육·부트캠프 작성 화면이 들고 있는 값(v5 PRD 4 절). `CreateCompanyBootcampRequest` 와 한
 * 칸씩 짝이 맞되, 고르지 않은 드롭다운을 빈 문자열로 들고 있어 타입이 다르다 — `<select>` 의
 * 값은 늘 문자열이고, 숫자 칸(`capacity`·`tuitionAmount`) 도 적기 전에는 값이 없다.
 *
 * **목업에 있는데 여기 없는 칸은 기업 로고 하나다**(v5 PRD 4 절). 받을 필드가 없어 화면에만
 * 비활성으로 그린다 — 값을 들고 있지 않는 것이 그 결정의 전부다. 들고 있으면 언젠가
 * 저장되는 것처럼 보인다.
 */
export interface CompanyBootcampFormValues {
  companyName: string;
  /** 목업의 `프로그램명`. 요청에서는 `title` 이다. */
  title: string;
  programType: string;
  operationType: CreateCompanyBootcampRequestOperationType | '';
  /** 목업의 `교육 기간` 한 칸을 시작·종료 두 날짜로 받는다(`model/options.ts` 머리 주석). */
  programStartDate: string;
  programEndDate: string;
  capacity: string;
  tuitionType: CreateCompanyBootcampRequestTuitionType | '';
  tuitionAmount: string;
  /** 순서가 값이다. 저장할 때 자리에서 `displayOrder` 를 만든다(`model/rows.ts`). */
  partners: BootcampPartnerRow[];
  representativeImageUrl: string;
  shortDescription: string;
  /** 목업의 `공고 상세 내용`. 평문 한 덩어리로 저장된다. */
  content: string;
  curriculums: BootcampCurriculumRow[];
  /**
   * 받을 필드가 없어 저장할 때 `content` 뒤에 붙는 칸 셋(`lib/contentExtras.ts`). 되읽을 때
   * 본문에서 다시 나뉘지 않아, 저장된 공고를 열면 늘 비어 있다.
   */
  extras: BootcampContentExtras;
  /** `YYYY-MM-DD`. 백엔드는 일시로 받고 화면은 날짜만 다룬다(`shared/lib/formDateTime.ts`). */
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  applicationMethod: CreateCompanyBootcampRequestApplicationMethod | '';
  applicationUrl: string;
  managerEmail: string;
  inquiryUrl: string;
  /**
   * 목업의 `모집 마감일까지 공개` 체크. 켜져 있으면 공개 기간을 모집 기간과 같게 두고
   * 아래 두 칸을 그리지 않는다(`ui/BootcampApplySettingsSection.tsx`).
   */
  publishUntilRecruitmentEnd: boolean;
  publicationStartAt: string;
  publicationEndAt: string;
  /** 요청에 실리지 않는다. `공고 등록` 을 막는 데만 쓴다(`ui/BootcampApplySettingsSection.tsx`). */
  agreedToPolicy: boolean;
}

export const EMPTY_COMPANY_BOOTCAMP_VALUES: CompanyBootcampFormValues = {
  companyName: '',
  title: '',
  programType: '',
  operationType: '',
  programStartDate: '',
  programEndDate: '',
  capacity: '',
  tuitionType: '',
  tuitionAmount: '',
  partners: [EMPTY_PARTNER_ROW],
  representativeImageUrl: '',
  shortDescription: '',
  content: '',
  curriculums: [EMPTY_CURRICULUM_ROW],
  extras: EMPTY_BOOTCAMP_CONTENT_EXTRAS,
  recruitmentStartAt: '',
  recruitmentEndAt: '',
  applicationMethod: '',
  applicationUrl: '',
  managerEmail: '',
  inquiryUrl: '',
  publishUntilRecruitmentEnd: true,
  publicationStartAt: '',
  publicationEndAt: '',
  agreedToPolicy: false,
};

/** 읽어 온 부트캠프를 화면 값으로(v5 PRD 4 절). */
export function toCompanyBootcampValues(
  bootcamp: CompanyBootcampDetailResponse,
): CompanyBootcampFormValues {
  return {
    companyName: bootcamp.companyName,
    title: bootcamp.title,
    programType: bootcamp.programType,
    operationType: bootcamp.operationType,
    programStartDate: bootcamp.programStartDate,
    programEndDate: bootcamp.programEndDate,
    capacity: bootcamp.capacity === undefined ? '' : String(bootcamp.capacity),
    tuitionType: bootcamp.tuitionType,
    tuitionAmount: bootcamp.tuitionAmount === undefined ? '' : String(bootcamp.tuitionAmount),
    partners: toPartnerRows(bootcamp.partners),
    representativeImageUrl: bootcamp.representativeImageUrl,
    shortDescription: bootcamp.shortDescription,
    content: bootcamp.content,
    curriculums: toCurriculumRows(bootcamp.curriculums),
    extras: EMPTY_BOOTCAMP_CONTENT_EXTRAS,
    recruitmentStartAt: toDateInputValue(bootcamp.recruitmentStartAt),
    recruitmentEndAt: toDateInputValue(bootcamp.recruitmentEndAt),
    applicationMethod: bootcamp.applicationMethod,
    applicationUrl: bootcamp.applicationUrl ?? '',
    managerEmail: bootcamp.managerEmail ?? '',
    inquiryUrl: bootcamp.inquiryUrl ?? '',
    // 공개 마감이 모집 마감과 같은 날이면 체크한 채로 저장된 것으로 본다. 저장된 것은 두
    // 날짜뿐이라 체크했는지 여부를 되읽을 다른 방법이 없다.
    publishUntilRecruitmentEnd:
      toDateInputValue(bootcamp.publicationEndAt) === toDateInputValue(bootcamp.recruitmentEndAt),
    publicationStartAt: toDateInputValue(bootcamp.publicationStartAt),
    publicationEndAt: toDateInputValue(bootcamp.publicationEndAt),
    // 저장된 값이 아니다. 고쳐 다시 공개로 만들 때 한 번 더 받는다(v4 모집글 폼과 같다).
    agreedToPolicy: false,
  };
}

/**
 * 읽어 온 배열을 행으로. **`displayOrder` 로 정렬해서 그린다** — 응답 배열의 순서가 그 값과
 * 같다는 보장이 없고, 공개 상세도 같은 값으로 정렬한다.
 *
 * 비어 있으면 빈 행 하나를 둔다. 행이 하나도 없으면 무엇을 적는 자리인지 보이지 않는다.
 */
function toPartnerRows(partners: CompanyBootcampDetailResponse['partners']): BootcampPartnerRow[] {
  if (partners.length === 0) {
    return [EMPTY_PARTNER_ROW];
  }
  return [...partners]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(({ partnerName }) => ({ partnerName }));
}

function toCurriculumRows(
  curriculums: CompanyBootcampDetailResponse['curriculums'],
): BootcampCurriculumRow[] {
  if (curriculums.length === 0) {
    return [EMPTY_CURRICULUM_ROW];
  }
  return [...curriculums]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(({ startWeek, endWeek, subtitle }) => ({
      startWeek: String(startWeek),
      endWeek: String(endWeek),
      subtitle,
    }));
}

/**
 * 목업에 칸이 없는데 응답에는 있는 값들. **화면이 그리지 않고 그대로 되돌려 보낸다.**
 *
 * 수정은 `PUT` 전체 교체라 보내지 않은 칸이 비워진다. 크롤러가 넣었거나 운영자가 채운
 * `eligibilityAndSelectionProcess`(공개 상세의 `지원 자격 · 전형`) 와 `sourceUrl` 이, 기업이
 * 제목 한 줄을 고쳤다는 이유로 사라지면 안 된다.
 *
 * 새 공고에는 전부 비어 있다. 목업에 칸이 없으니 채울 방법도 없다.
 */
export interface CompanyBootcampPassthrough {
  eligibilityAndSelectionProcess?: string;
  sourceUrl?: string;
}

export const EMPTY_COMPANY_BOOTCAMP_PASSTHROUGH: CompanyBootcampPassthrough = {};

/** 화면이 그리지 않는 값들을 따로 들고 있는다(`CompanyBootcampPassthrough`). */
export function toCompanyBootcampPassthrough(
  bootcamp: CompanyBootcampDetailResponse,
): CompanyBootcampPassthrough {
  return {
    eligibilityAndSelectionProcess: bootcamp.eligibilityAndSelectionProcess,
    sourceUrl: bootcamp.sourceUrl,
  };
}

/** 빈 칸은 보내지 않는다. 적지 않은 숫자 칸은 값이 없다. */
const textOrUndefined = (value: string) => value.trim() || undefined;
const numberOrUndefined = (value: string) => (value.trim() === '' ? undefined : Number(value));

/**
 * 화면 값을 수정 요청 바디로(v5 PRD 4 절).
 *
 * **`recruitmentType` 은 화면에 칸이 없다.** 목업에 그 선택지가 없는데 요청에는 필수라, 모집
 * 마감일이 있으면 `PERIOD`, 없으면 `ALWAYS_OPEN` 으로 정한다 — 마감일 없는 공고가 곧 상시
 * 모집이다(채용공고 폼이 같은 규칙을 쓴다).
 *
 * **공고 공개 기간은 `모집 마감일까지 공개` 체크가 정한다.** 켜져 있으면 공개 기간을 모집
 * 기간과 같게 둔다 — 요청에 "모집 마감까지" 를 뜻하는 값이 따로 없고 두 날짜뿐이라, 그
 * 뜻을 두 날짜로 옮기는 자리가 여기다.
 *
 * **본문 뒤에 세 칸이 붙는다.** 강사 정보·교육 특징/혜택·수료 조건은 받을 필드가 없어
 * `content` 에 이어 붙인다(`lib/contentExtras.ts`).
 *
 * 목업에 칸이 없는 나머지 값들은 읽어 온 그대로 다시 싣는다(`CompanyBootcampPassthrough`).
 * 수정이 전체 교체라 빼면 지워진다.
 */
export function toCompanyBootcampRequest(
  values: CompanyBootcampFormValues,
  passthrough: CompanyBootcampPassthrough,
): UpdateCompanyBootcampRequest {
  const publicationStart = values.publishUntilRecruitmentEnd
    ? values.recruitmentStartAt
    : values.publicationStartAt;
  const publicationEnd = values.publishUntilRecruitmentEnd
    ? values.recruitmentEndAt
    : values.publicationEndAt;

  return {
    companyName: values.companyName.trim(),
    title: values.title.trim(),
    programType: values.programType.trim(),
    operationType: values.operationType as UpdateCompanyBootcampRequest['operationType'],
    recruitmentType: values.recruitmentEndAt ? 'PERIOD' : 'ALWAYS_OPEN',
    recruitmentStartAt: toStartDateTime(values.recruitmentStartAt),
    recruitmentEndAt: toEndDateTime(values.recruitmentEndAt),
    programStartDate: values.programStartDate,
    programEndDate: values.programEndDate,
    capacity: numberOrUndefined(values.capacity),
    tuitionType: values.tuitionType as UpdateCompanyBootcampRequest['tuitionType'],
    tuitionAmount: numberOrUndefined(values.tuitionAmount),
    representativeImageUrl: values.representativeImageUrl.trim(),
    shortDescription: values.shortDescription.trim(),
    content: appendContentExtras(values.content, values.extras),
    eligibilityAndSelectionProcess: passthrough.eligibilityAndSelectionProcess,
    applicationMethod:
      values.applicationMethod as UpdateCompanyBootcampRequest['applicationMethod'],
    applicationUrl: textOrUndefined(values.applicationUrl),
    managerEmail: textOrUndefined(values.managerEmail),
    inquiryUrl: textOrUndefined(values.inquiryUrl),
    publicationStartAt: toStartDateTime(publicationStart),
    publicationEndAt: toEndDateTime(publicationEnd),
    sourceUrl: passthrough.sourceUrl,
    partners: values.partners
      .map(({ partnerName }) => partnerName.trim())
      .filter((partnerName) => partnerName.length > 0)
      .map((partnerName, index) => ({ partnerName, displayOrder: index + 1 })),
    curriculums: values.curriculums
      .filter((row) => row.subtitle.trim().length > 0)
      .map((row, index) => ({
        startWeek: Number(row.startWeek || 0),
        endWeek: Number(row.endWeek || row.startWeek || 0),
        subtitle: row.subtitle.trim(),
        displayOrder: index + 1,
      })),
  };
}

/**
 * 생성 요청은 수정 요청에 `status` 한 칸이 더 붙은 것이다. **부트캠프에는 `/publish` 가 없고**
 * 이 값이 곧 공개 여부다(v5 PRD 4 절) — 임시저장은 `DRAFT`, 등록은 `RECRUITING` 이다.
 */
export function toCreateCompanyBootcampRequest(
  values: CompanyBootcampFormValues,
  passthrough: CompanyBootcampPassthrough,
  status: CreateCompanyBootcampRequestStatus,
): CreateCompanyBootcampRequest {
  return { ...toCompanyBootcampRequest(values, passthrough), status };
}
