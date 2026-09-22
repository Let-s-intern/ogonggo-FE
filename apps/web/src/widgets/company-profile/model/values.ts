import type { MyAccountResponse, ReplaceMyCompanyProfileRequest } from '@ogonggo/api';

/**
 * 기업/기관 정보 화면이 그리는 값(v5 PRD 5 절). 계정 응답에서 뽑아 두는 것은 이 셋뿐이다 —
 * `MyCompanyProfileResponse` 에 필드가 `organizationName`·`managerName` 둘뿐이고, 가입한
 * 이메일은 계정 쪽(`MyAccountResponse.email`) 에 있다.
 *
 * **값을 읽는 곳(`toCompanyProfileValues`) 과 그리는 곳(`CompanyProfileView`) 을 나눈 이유가
 * 여기 있다.** 수정 API 가 생겼을 때 이 타입을 폼 상태의 모양으로 그대로 쓰고 제출만 더하면
 * 되게 했고, 실제로 그렇게 됐다(`CompanyProfileDraft`). 그리는 쪽은 계정 응답의 생김새를
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

/**
 * 고쳐 저장할 수 있는 두 칸. 생성된 수정 요청과 같은 모양이라 폼 상태를 그대로 실어 보낸다
 * (`PUT /api/v1/users/me/company-profile`).
 *
 * **이 둘뿐인 것이 백엔드가 받는 전부다.** 로고·연락처·수신용 이메일은 저장할 곳이 없어 칸을
 * 비활성 그대로 둔다 — 없는 필드를 열면 고쳐 저장한 값이 조용히 사라진다
 * (`.claude/tasks/memos/결정-기업정보-두-칸만-연다-2026-09-22.md`).
 *
 * 가입한 이메일은 요청에 없다. 로그인 이메일은 여기서 바꿀 수 없다(생성 타입 설명).
 */
export type CompanyProfileDraft = ReplaceMyCompanyProfileRequest;

/** 계정을 아직 못 읽었을 때의 폼 값. 칸은 그리되 비어 있다. */
export const EMPTY_COMPANY_PROFILE_DRAFT: CompanyProfileDraft = {
  organizationName: '',
  managerName: '',
};
