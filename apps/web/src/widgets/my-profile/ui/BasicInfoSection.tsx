import { Input } from '@ogonggo/ui';
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
 */
export function BasicInfoSection({ name, email }: BasicInfoSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-gray-950">기본 정보</h2>

      <ProfileField label="이름" htmlFor="profile-name">
        <Input id="profile-name" value={name ?? ''} readOnly disabled />
      </ProfileField>

      <ProfileField label="가입한 이메일" htmlFor="profile-email">
        <Input id="profile-email" value={email ?? ''} readOnly disabled />
      </ProfileField>
    </section>
  );
}
