'use client';

import { type FormEvent, useState } from 'react';
import { changeMyPassword } from '@ogonggo/api';
import { Button, Input } from '@ogonggo/ui';
import { serverMessageOf } from '@/shared/lib/serverMessage';
import { CompanyProfileField } from './CompanyProfileField';
import { SaveMessage, type SaveStatus } from './SaveMessage';

/** `ChangeMyPasswordRequest.newPassword` 의 길이 제한. */
const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

/**
 * 비밀번호 변경(목업 세 번째 구역). `PATCH /api/v1/users/me/password` 로 보낸다. v4 일반 회원의
 * `widgets/my-profile/ui/PasswordSection.tsx` 와 같은 호출이고 칸 배치만 기업 목업의 것이다.
 *
 * 기업 회원의 비밀번호 규칙은 8~64자다. 일반 회원과 달리 특수문자를 요구하지 않는다(생성
 * 타입 설명). 규칙보다 엄하게 막으면 서버가 받는 비밀번호를 화면이 거절한다.
 *
 * 부르는 쪽이 `passwordChangeable` 일 때만 이 구역을 그린다.
 */
export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus | null>(null);

  const validate = (): string | null => {
    if (!currentPassword) return '기존 비밀번호를 입력해 주세요.';
    if (newPassword.length < MIN_LENGTH || newPassword.length > MAX_LENGTH) {
      return `새로운 비밀번호는 ${MIN_LENGTH}~${MAX_LENGTH}자로 입력해 주세요.`;
    }
    if (newPassword !== confirmPassword) return '새로운 비밀번호와 확인이 다릅니다.';
    return null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validate();
    if (invalid) {
      setStatus({ tone: 'error', message: invalid });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus({ tone: 'success', message: '비밀번호를 바꿨습니다.' });
    } catch (error) {
      setStatus({
        tone: 'error',
        message:
          serverMessageOf(error) ?? '비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-gray-950">비밀번호 변경</h2>

      <CompanyProfileField label="기존 비밀번호" htmlFor="company-current-password">
        <Input
          id="company-current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="기존 비밀번호를 입력해 주세요."
        />
      </CompanyProfileField>

      <CompanyProfileField label="새로운 비밀번호" htmlFor="company-new-password">
        <Input
          id="company-new-password"
          type="password"
          autoComplete="new-password"
          maxLength={MAX_LENGTH}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder={`${MIN_LENGTH}자리 이상`}
        />
      </CompanyProfileField>

      <CompanyProfileField label="비밀번호 확인" htmlFor="company-confirm-password">
        <Input
          id="company-confirm-password"
          type="password"
          autoComplete="new-password"
          maxLength={MAX_LENGTH}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="비밀번호를 다시 입력해 주세요."
        />
      </CompanyProfileField>

      <Button
        type="submit"
        variant="secondary"
        disabled={saving}
        className="w-full border-blue-500 text-blue-500"
      >
        비밀번호 변경
      </Button>
      <SaveMessage status={status} />
    </form>
  );
}
