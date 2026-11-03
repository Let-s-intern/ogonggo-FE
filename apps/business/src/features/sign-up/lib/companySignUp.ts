import {
  type CompanySignUpRequest,
  type CompanySignUpRequestCompanyType,
  type CompanySignUpRequestEmployeeCountRange,
  type CompanySignUpRequestManagerDuty,
  enumOptions,
} from '@ogonggo/api';
import { DESIRED_INDUSTRIES } from './careerOptions';

/**
 * 기업 회원가입 두 단계 폼의 값·검증·요청(PRD `prd-company-signup-info.md` "가입 화면").
 *
 * 필수 여부는 화면이 지킨다. 서버(`CompanySignUpRequest`, `ogonggo-api-user/.../auth/presentation/request/
 * CompanyAuthRequests.kt`)는 새 칸을 모두 선택으로 받고 보낸 값의 형식만 본다. 공백만 있는 문자열은 400 이라
 * 비운 선택 칸은 키를 빼고 보낸다.
 */

/** 해외 기업이 아닐 때 고르는 번호 종류. `OVERSEAS` 는 체크박스가 정한다. */
export type DomesticNumberType = 'BUSINESS_REGISTRATION' | 'CORPORATE_REGISTRATION';

export interface CompanySignUpValues {
  organizationName: string;
  overseas: boolean;
  businessNumberType: DomesticNumberType;
  /** 하이픈이 들어간 화면 값. 보낼 때 숫자만 남긴다. */
  businessNumber: string;
  companyType: CompanySignUpRequestCompanyType | '';
  employeeCountRange: CompanySignUpRequestEmployeeCountRange | '';
  industry: string;
  address: string;
  homepageUrl: string;
  managerName: string;
  managerTitle: string;
  managerDuty: CompanySignUpRequestManagerDuty | '';
  managerPhone: string;
  email: string;
  password: string;
  passwordConfirm: string;
  recommender: string;
}

export type CompanySignUpField = keyof CompanySignUpValues;
export type CompanySignUpErrors = Partial<Record<CompanySignUpField, string>>;

export const EMPTY_COMPANY_SIGN_UP: CompanySignUpValues = {
  organizationName: '',
  overseas: false,
  businessNumberType: 'BUSINESS_REGISTRATION',
  businessNumber: '',
  companyType: '',
  employeeCountRange: '',
  industry: '',
  address: '',
  homepageUrl: '',
  managerName: '',
  managerTitle: '',
  managerDuty: '',
  managerPhone: '',
  email: '',
  password: '',
  passwordConfirm: '',
  recommender: '',
};

/** 백엔드 `@Size`. 입력칸 `maxLength` 로 막는다. */
export const COMPANY_SIGN_UP_MAX_LENGTH = {
  organizationName: 150,
  address: 255,
  homepageUrl: 2048,
  managerName: 100,
  managerTitle: 50,
  managerPhone: 20,
  email: 255,
  password: 64,
  passwordConfirm: 64,
  recommender: 100,
} as const;

const PASSWORD_MIN = 8;

/** 번호 종류마다 숫자 자릿수. 백엔드 `CompanyBusinessNumberType.digitCount` 와 같다. */
export const BUSINESS_NUMBER_DIGITS: Record<DomesticNumberType, number> = {
  BUSINESS_REGISTRATION: 10,
  CORPORATE_REGISTRATION: 13,
};

/** 카탈로그 선택지. 순서는 백엔드 선언 순서 그대로다. */
export const BUSINESS_NUMBER_TYPE_OPTIONS = enumOptions('CompanyBusinessNumberType').filter(
  // 해외 기업은 토글이 아니라 오른쪽 위 체크박스로 고른다(PRD "가입 화면").
  (option): option is { value: DomesticNumberType; label: string } => option.value !== 'OVERSEAS',
);
export const COMPANY_TYPE_OPTIONS = enumOptions('CompanyType');
export const EMPLOYEE_COUNT_OPTIONS = enumOptions('CompanyEmployeeCountRange');
export const MANAGER_DUTY_OPTIONS = enumOptions('CompanyManagerDuty');

/** 가입 커리어 정보의 산업 목록에서 `산업 무관` 을 뺀 것. 회사는 어느 한 산업에 속한다. */
export const COMPANY_INDUSTRIES = DESIRED_INDUSTRIES.filter((industry) => industry !== '산업 무관');

/**
 * 사업자 번호에 하이픈을 넣는다. 사업자등록번호는 3-2-5(`123-45-67890`), 법인등록번호는 6-7
 * (`110111-1234567`)이다. 치는 도중에도 부르므로 덜 친 번호도 그대로 돌려준다. 자릿수를 넘는 숫자는 버린다.
 */
export function formatBusinessNumber(type: DomesticNumberType, value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, BUSINESS_NUMBER_DIGITS[type]);
  if (type === 'CORPORATE_REGISTRATION') {
    return digits.length <= 6 ? digits : `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

const digitsOf = (value: string) => value.replace(/\D/g, '');

/** 스킴이 없으면 `https://` 를 붙인다(PRD 표). 빈 값은 빈 값이다. */
export function normalizeHomepage(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** 붙인 뒤 주소로 읽히고 호스트에 점이 있는지만 본다. 나머지는 서버(`@URL`)가 본다. */
export function isHomepage(value: string): boolean {
  try {
    const url = new URL(normalizeHomepage(value));
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * 이메일 형식. 백엔드는 Hibernate `@Email` 이라 `a@b` 도 받는다 — 그보다 좁히면 서버가 받는 주소를 화면이
 * 막는다. 골뱅이 양쪽에 공백 없는 글자가 있는지만 본다. 나머지는 서버 400 이 말한다.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

/** 연락처 숫자 자릿수. 가장 짧은 `02-123-4567` 이 9자리, `formatPhone` 이 11자리에서 자른다. */
const PHONE_MIN_DIGITS = 9;

/** 단계마다 다 채워야 하는 칸. 이 칸이 비어 있으면 `다음`·`가입하기` 가 꺼진다. */
export function requiredFields(step: 1 | 2, values: CompanySignUpValues): CompanySignUpField[] {
  if (step === 1) {
    return [
      'organizationName',
      ...(values.overseas ? [] : (['businessNumber'] as const)),
      'companyType',
      'employeeCountRange',
      'industry',
      'address',
    ];
  }
  return [
    'managerName',
    'managerTitle',
    'managerDuty',
    'managerPhone',
    'email',
    'password',
    'passwordConfirm',
  ];
}

export function isStepFilled(step: 1 | 2, values: CompanySignUpValues): boolean {
  return requiredFields(step, values).every((field) => String(values[field]).trim() !== '');
}

/** 채운 칸의 형식. 빈 필수 칸은 버튼이 막으므로 여기서 말하지 않는다. */
export function validateStep(step: 1 | 2, values: CompanySignUpValues): CompanySignUpErrors {
  const errors: CompanySignUpErrors = {};
  if (step === 1) {
    if (!values.overseas) {
      const expected = BUSINESS_NUMBER_DIGITS[values.businessNumberType];
      if (digitsOf(values.businessNumber).length !== expected) {
        const name =
          values.businessNumberType === 'BUSINESS_REGISTRATION' ? '사업자등록번호' : '법인등록번호';
        errors.businessNumber = `${name}는 숫자 ${expected}자리입니다.`;
      }
    }
    if (values.homepageUrl.trim() !== '' && !isHomepage(values.homepageUrl)) {
      errors.homepageUrl = '홈페이지 주소를 확인해 주세요.';
    }
    return errors;
  }
  if (digitsOf(values.managerPhone).length < PHONE_MIN_DIGITS) {
    errors.managerPhone = '연락처를 확인해 주세요.';
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = '이메일 형식이 올바르지 않습니다.';
  }
  if (values.password.length < PASSWORD_MIN) {
    errors.password = `비밀번호는 ${PASSWORD_MIN}~${COMPANY_SIGN_UP_MAX_LENGTH.password}자로 입력해 주세요.`;
  }
  if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  }
  return errors;
}

/** 비운 선택 칸은 키를 뺀다. 공백 문자열은 서버가 400 으로 막는다. */
const optional = (value: string) => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

/** 두 단계 검증을 지난 값만 넘긴다. 드롭다운 칸은 그때 비어 있지 않다. */
export function toCompanySignUpRequest(values: CompanySignUpValues): CompanySignUpRequest {
  return {
    email: values.email.trim(),
    password: values.password,
    organizationName: values.organizationName.trim(),
    managerName: values.managerName.trim(),
    businessNumberType: values.overseas ? 'OVERSEAS' : values.businessNumberType,
    businessNumber: values.overseas ? undefined : digitsOf(values.businessNumber),
    companyType: values.companyType || undefined,
    employeeCountRange: values.employeeCountRange || undefined,
    industry: optional(values.industry),
    address: optional(values.address),
    homepageUrl: optional(normalizeHomepage(values.homepageUrl)),
    managerTitle: optional(values.managerTitle),
    managerDuty: values.managerDuty || undefined,
    managerPhone: optional(values.managerPhone),
    recommender: optional(values.recommender),
  };
}
