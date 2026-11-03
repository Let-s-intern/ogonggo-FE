import { Toggle } from '@ogonggo/ui';

/**
 * 목업에는 있지만 받을 곳이 없는 구역들(v5 PRD 5 절). 전부 비활성이고 저장 호출을 만들지
 * 않는다. v4 의 `widgets/my-profile/ui/PreparingSections.tsx` 와 같은 자리이고, 문구만
 * 기업 회원 목업의 것이다.
 *
 * 남은 둘은 모두 백엔드에 대응 API 가 없다(2026-10-15 배포 스펙 기준) — 광고성 정보 수신
 * 동의를 저장·조회하는 필드가 계정 응답에 없고, 회원 탈퇴(`DELETE /api/v1/users/me`) 도 없다.
 * 생기면 이 파일에서 해당 구역을 살리면 된다.
 */

/** 혜택 및 광고성 정보 수신 동의(목업의 테두리 카드 + 스위치). 동의 여부를 저장할 곳이 없다. */
export function MarketingSection() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-6 py-5">
      <div>
        <p className="text-base font-bold text-gray-900">혜택 및 광고성 정보 수신 동의</p>
        <p className="pt-1 text-sm text-gray-500">
          기업 대상 프로그램과 이벤트, 혜택 소식을 받아볼 수 있어요.
        </p>
      </div>
      <Toggle checked={false} disabled onChange={() => {}} label="" className="shrink-0" />
    </div>
  );
}

/** 회원 탈퇴(목업 맨 아래 회색 글자). 탈퇴 API 가 없다. */
export function WithdrawAction() {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        disabled
        className="cursor-not-allowed py-2 text-sm text-gray-300 underline"
      >
        회원 탈퇴
      </button>
    </div>
  );
}
