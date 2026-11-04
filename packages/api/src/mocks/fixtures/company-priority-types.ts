/**
 * 기업회원 공고 우선 노출 설정의 요청·응답 타입. **배포된 어드민 스펙에 아직 없어** 손으로 쓴다.
 *
 * 이름과 모양은 백엔드 `ogonggo-api-admin` 의 스키마(`AdminCompanyContentPriorityResponse`,
 * `ReplaceAdminCompanyContentPriorityRequest`) 그대로다. 백엔드가 배포되면 `api-codegen` 이
 * `../../generated/admin/models` 에 같은 이름을 만든다. 그때 이 파일을 지우고 가져오는 곳을 그쪽으로 바꾼다.
 */

export interface AdminCompanyContentPriorityResponse {
  enabled: boolean;
}

export interface ReplaceAdminCompanyContentPriorityRequest {
  enabled: boolean;
}
