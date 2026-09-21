import type { MyAccountResponse } from '@ogonggo/api';

/**
 * 기업/기관 정보 화면이 그리는 값(v5 PRD 5 절). 계정 응답에서 뽑아 두는 것은 이 셋뿐이다 —
 * `MyCompanyProfileResponse` 에 필드가 `organizationName`·`managerName` 둘뿐이고, 가입한
 * 이메일은 계정 쪽(`MyAccountResponse.email`) 에 있다.
 *
 * **값을 읽는 곳(`toCompanyProfileValues`) 과 그리는 곳(`CompanyProfileView`) 을 나눈 이유가
 * 여기 있다.** 기업 프로필 수정 API 가 아직 없어 이번에는 읽기 전용으로 내지만, 생기면 이
 * 타입을 폼 상태의 모양으로 그대로 쓰고 제출만 더하면 된다. 그리는 쪽은 계정 응답의 생김새를
 * 모른다.
 */
export interface CompanyProfileValues {
  organizationName: string;
  managerName: string;
  email: string;
}

/**
 * 계정 응답에서 화면 값을 뽑는다. 세 필드 모두 선택이라 없으면 빈 문자열이다 — 칸을 감추지
 * 않는 이유는 줄 수가 바뀌면 화면이 한 번 뛰기 때문이다(v4 `BasicInfoSection` 과 같은 판단).
 */
export function toCompanyProfileValues(account: MyAccountResponse): CompanyProfileValues {
  return {
    organizationName: account.companyProfile?.organizationName ?? '',
    managerName: account.companyProfile?.managerName ?? '',
    email: account.email ?? '',
  };
}
