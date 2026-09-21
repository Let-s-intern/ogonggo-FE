import type {
  CompanyBootcampDetailResponse,
  CreateCompanyBootcampRequestApplicationMethod,
  CreateCompanyBootcampRequestOperationType,
  CreateCompanyBootcampRequestTuitionType,
} from '@ogonggo/api';
import { toDateInputValue } from '@/shared/lib/formDateTime';
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
  /** `YYYY-MM-DD`. 백엔드는 일시로 받고 화면은 날짜만 다룬다(`shared/lib/formDateTime.ts`). */
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  applicationMethod: CreateCompanyBootcampRequestApplicationMethod | '';
  applicationUrl: string;
  managerEmail: string;
  inquiryUrl: string;
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
  recruitmentStartAt: '',
  recruitmentEndAt: '',
  applicationMethod: '',
  applicationUrl: '',
  managerEmail: '',
  inquiryUrl: '',
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
    recruitmentStartAt: toDateInputValue(bootcamp.recruitmentStartAt),
    recruitmentEndAt: toDateInputValue(bootcamp.recruitmentEndAt),
    applicationMethod: bootcamp.applicationMethod,
    applicationUrl: bootcamp.applicationUrl ?? '',
    managerEmail: bootcamp.managerEmail ?? '',
    inquiryUrl: bootcamp.inquiryUrl ?? '',
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
