import { Button, Input, Toggle } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { CompanyProfileField } from './CompanyProfileField';

/**
 * 목업에는 있지만 받을 곳이 없는 구역들(v5 PRD 5 절). 전부 비활성이고 저장 호출을 만들지
 * 않는다. v4 의 `widgets/my-profile/ui/PreparingSections.tsx` 와 같은 자리이고, 문구만
 * 기업 회원 목업의 것이다.
 *
 * 한 파일에 모은 이유는 백엔드가 생겼을 때 무엇을 살릴지 한눈에 보여야 해서다. 살릴 때
 * 필요한 API 는 `.claude/tasks/memos/백엔드-요청-마이페이지.md` 에 있다.
 */

/** 비밀번호 변경(목업 세 번째 구역). 기업 회원은 비밀번호로 로그인하지만 바꾸는 API 가 없다. */
export function PasswordSection() {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-gray-950">비밀번호 변경</h2>

      <CompanyProfileField label="기존 비밀번호" htmlFor="company-current-password">
        <Input
          id="company-current-password"
          type="password"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
      </CompanyProfileField>

      <CompanyProfileField label="새로운 비밀번호" htmlFor="company-new-password">
        <Input
          id="company-new-password"
          type="password"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
      </CompanyProfileField>

      <CompanyProfileField label="비밀번호 확인" htmlFor="company-confirm-password">
        <Input
          id="company-confirm-password"
          type="password"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
      </CompanyProfileField>

      <Button
        variant="secondary"
        disabled
        title={PLACEHOLDER_NOTICE}
        className="w-full border-blue-500 text-blue-500"
      >
        비밀번호 변경
      </Button>
    </section>
  );
}

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
        title={PLACEHOLDER_NOTICE}
        className="cursor-not-allowed py-2 text-sm text-gray-300 underline"
      >
        회원 탈퇴
      </button>
    </div>
  );
}
