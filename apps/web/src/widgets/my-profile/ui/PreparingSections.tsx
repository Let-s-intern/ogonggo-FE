import { Button, Input, Toggle } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { ProfileField } from './ProfileField';

/**
 * 목업에는 있지만 받을 곳이 없는 구역들(PRD 6 절). 전부 비활성이고 저장 호출을 만들지 않는다.
 *
 * 한 파일에 모은 이유는 `features/my-applications/model/placeholder.ts` 와 같다 — 백엔드가
 * 생겼을 때 무엇을 지우고 무엇을 살릴지 한눈에 보여야 한다. 여기 있는 것은 전부 "살릴 것"
 * 이고, 살릴 때 필요한 API 는 `.claude/tasks/memos/백엔드-요청-마이페이지.md` 에 있다.
 */

/**
 * 비밀번호 변경(목업 두 번째 구역). 일반 회원은 소셜 로그인으로만 들어오고 오공고가 가진
 * 비밀번호가 없다 — 바꾸는 API 도 없다.
 */
export function PasswordSection() {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-gray-950">비밀번호 변경</h2>

      <ProfileField label="기존 비밀번호" htmlFor="profile-current-password">
        <Input
          id="profile-current-password"
          type="password"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
      </ProfileField>

      <ProfileField label="새로운 비밀번호" htmlFor="profile-new-password">
        <Input
          id="profile-new-password"
          type="password"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
      </ProfileField>

      <ProfileField label="비밀번호 확인" htmlFor="profile-confirm-password">
        <Input
          id="profile-confirm-password"
          type="password"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
      </ProfileField>

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

/** 마케팅 수신 동의(목업의 테두리 카드 + 스위치). 동의 여부를 저장할 곳이 없다. */
export function MarketingSection() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-6 py-5">
      <div>
        <p className="text-base font-bold text-gray-900">마케팅 수신 동의</p>
        <p className="pt-1 text-sm text-gray-500">
          추천 공고와 이벤트, 혜택 등 유용한 소식을 받아볼 수 있어요.
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
