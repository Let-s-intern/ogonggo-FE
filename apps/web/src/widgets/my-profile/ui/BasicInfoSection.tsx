import { Badge, Button, Checkbox, Input } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { ProfileField } from './ProfileField';

export interface BasicInfoSectionProps {
  /** `getMyAccount` 의 `profile.name`. 렛츠커리어가 소유해 여기서 고칠 수 없다. */
  name?: string;
  /** `getMyAccount` 의 `email`. 일반 회원은 렛츠커리어 프로필의 이메일이다. */
  email?: string;
}

/**
 * 기본 정보 구역(PRD 6 절). 이름과 가입한 이메일 **둘 다 읽기 전용**이다.
 *
 * 고칠 수 없는 이유가 둘 다 다르다. 이름은 렛츠커리어가 소유해 로그인마다 갱신되고
 * (`MyProfileResponse` 설명), 가입한 이메일은 계정을 식별하는 값이라 바꾸는 API 자체가 없다.
 * 어느 쪽도 이 화면에서 보낼 곳이 없다.
 *
 * 값이 아직 오지 않았으면 빈 칸이다. 칸을 감추지 않는 이유는 줄 수가 바뀌면 화면이 한 번
 * 뛰기 때문이다.
 *
 * **목업의 나머지 칸 넷은 받을 곳이 없어 비활성이다**(PRD 6 절). 휴대폰 번호와 수신용
 * 이메일은 `MyAccountResponse` 에 필드가 없고, 로그인 수단(목업의 초록 `네이버 로그인` 배지)
 * 도 마찬가지다 — 무엇으로 로그인했는지 계정 응답이 말해 주지 않아 배지에 적을 값이 없다.
 * `기본 정보 수정하기` 는 그 셋을 보낼 곳이 없으므로 같이 꺼진다.
 *
 * 감추지 않고 비활성으로 남기는 것이 PRD 의 결정이다. 자리가 통째로 비면 "이 서비스에는
 * 휴대폰 번호가 없다" 로 읽히는데, 사실은 준비 중이다.
 */
export function BasicInfoSection({ name, email }: BasicInfoSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-gray-950">기본 정보</h2>
        {/* 목업은 `네이버 로그인` 초록 배지다. 계정 응답에 로그인 수단이 없어 문구를 짓지 못한다. */}
        <Badge tone="neutral" title={PLACEHOLDER_NOTICE} className="text-xs">
          소셜 로그인
        </Badge>
      </div>

      <ProfileField label="이름" htmlFor="profile-name">
        <Input id="profile-name" value={name ?? ''} readOnly disabled />
      </ProfileField>

      <ProfileField label="휴대폰 번호" htmlFor="profile-phone">
        <Input
          id="profile-phone"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
      </ProfileField>

      <ProfileField label="가입한 이메일" htmlFor="profile-email">
        <Input id="profile-email" value={email ?? ''} readOnly disabled />
      </ProfileField>

      <ProfileField
        label="오늘의 공고 정보 수신용 이메일"
        htmlFor="profile-notification-email"
        note="지원할 공고를 놓치지 않도록, 마감 알림과 추천 공고를 받아볼 이메일 주소를 입력해 주세요."
      >
        <Input
          id="profile-notification-email"
          value=""
          readOnly
          disabled
          title={PLACEHOLDER_NOTICE}
          placeholder={PLACEHOLDER_NOTICE}
        />
        <Checkbox checked={false} disabled onChange={() => {}} label="가입한 이메일과 동일" />
      </ProfileField>

      <Button
        variant="secondary"
        disabled
        title={PLACEHOLDER_NOTICE}
        className="w-full border-blue-500 text-blue-500"
      >
        기본 정보 수정하기
      </Button>
    </section>
  );
}
