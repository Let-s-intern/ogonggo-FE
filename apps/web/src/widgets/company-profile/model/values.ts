import type { MyAccountResponse } from '@ogonggo/api';

/**
 * 기업/기관 정보 화면이 그리는 값(v5 PRD 5 절). 계정 응답(`MyAccountResponse`)에서 뽑아 둔다 —
 * 기관명·로고·담당자 이름·연락처·수신용 이메일은 `companyProfile` 에, 가입한 이메일과
 * 비밀번호 변경 가능 여부는 계정 쪽에 있다.
 *
 * **값을 읽는 곳(`toCompanyProfileValues`) 과 그리는 곳(`CompanyProfileView`) 을 나눈 이유가
 * 여기 있다.** 그리는 쪽은 계정 응답의 생김새를 모른다.
 */
export interface CompanyProfileValues {
  organizationName: string;
  /** 로고 이미지 식별자. 기본 정보를 저장할 때 그대로 보내야 로고가 지워지지 않는다. */
  logoImageId: string;
  logoUrl: string;
  managerName: string;
  managerPhone: string;
  /** 오늘의 공고 정보 수신용 이메일. 입력한 적이 없으면 빈 문자열이다. */
  notificationEmail: string;
  /** 가입한 이메일. 로그인 이메일이라 이 화면에서 바꾸지 못한다. */
  email: string;
  /** 비밀번호로 로그인하는 계정인지. 아니면 비밀번호 구역을 그리지 않는다. */
  passwordChangeable: boolean;
}

/**
 * 계정 응답에서 화면 값을 뽑는다. 선택 필드는 없으면 빈 문자열이다 — 칸을 감추지 않는
 * 이유는 줄 수가 바뀌면 화면이 한 번 뛰기 때문이다(v4 `BasicInfoSection` 과 같은 판단).
 */
export function toCompanyProfileValues(account: MyAccountResponse): CompanyProfileValues {
  const profile = account.companyProfile;
  return {
    organizationName: profile?.organizationName ?? '',
    logoImageId: profile?.logoImageId ?? '',
    logoUrl: profile?.logoUrl ?? '',
    managerName: profile?.managerName ?? '',
    managerPhone: profile?.managerPhone ?? '',
    notificationEmail: profile?.notificationEmail ?? '',
    email: account.email ?? '',
    passwordChangeable: account.passwordChangeable ?? false,
  };
}

/**
 * 기본 정보 저장(`replaceMyCompanyBasicInfo`) 에 실리는 값. 로고를 바꾸지 않을 때도 읽어 온
 * 식별자를 그대로 보낸다 — 빼면 서버가 로고를 지운다(생성 타입 설명). 빈 식별자는 보내지 않아
 * 로고를 지운 것이 된다.
 */
export interface CompanyBasicInfoDraft {
  organizationName: string;
  logoImageId: string;
  logoUrl: string;
}

/**
 * 담당자 정보 저장(`replaceMyCompanyManagerInfo`) 에 실리는 값. **셋이 한 번에 교체된다** —
 * 연락처와 수신용 이메일을 빼고 보내면 저장돼 있던 값이 비워진다(생성 타입 설명). 그래서
 * 이름만 고쳐도 화면에 있는 세 값을 모두 보낸다.
 *
 * 가입한 이메일은 요청에 없다. 로그인 이메일은 여기서 바꿀 수 없다.
 */
export interface CompanyManagerInfoDraft {
  managerName: string;
  managerPhone: string;
  notificationEmail: string;
}

/** 계정을 아직 못 읽었을 때의 폼 값. 칸은 그리되 비어 있다. */
export const EMPTY_COMPANY_BASIC_INFO_DRAFT: CompanyBasicInfoDraft = {
  organizationName: '',
  logoImageId: '',
  logoUrl: '',
};

export const EMPTY_COMPANY_MANAGER_INFO_DRAFT: CompanyManagerInfoDraft = {
  managerName: '',
  managerPhone: '',
  notificationEmail: '',
};
