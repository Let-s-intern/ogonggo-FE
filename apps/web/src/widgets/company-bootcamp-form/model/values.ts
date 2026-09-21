import type {
  CompanyBootcampDetailResponse,
  CreateCompanyBootcampRequestOperationType,
  CreateCompanyBootcampRequestTuitionType,
} from '@ogonggo/api';

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
  representativeImageUrl: string;
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
  representativeImageUrl: '',
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
    representativeImageUrl: bootcamp.representativeImageUrl,
  };
}
