'use client';

import { type FormEvent, useState } from 'react';
import { changeMyPassword } from '@ogonggo/api';
import { Button, Input } from '@ogonggo/ui';
import { serverMessageOf } from '../lib/serverMessage';
import { ProfileField } from './ProfileField';
import { SaveMessage, type SaveStatus } from './SaveMessage';

/** `ChangeMyPasswordRequest.newPassword` 의 길이 제한. */
const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

/**
 * 비밀번호 변경(v11). `PATCH /api/v1/users/me/password` 로 보낸다. 일반 회원의 비밀번호는
 * 렛츠커리어에 있어서 서버가 렛츠커리어로 전달하고, 렛츠커리어 로그인 비밀번호도 함께 바뀐다.
 *
 * 카카오·네이버·구글로 가입한 계정은 비밀번호가 없다. 그런 계정에는 이 구역을 그리지 않는다
 * — 그 판정은 계정 응답의 `passwordChangeable` 이 하고, 부르는 쪽(`MyProfile`)이 본다.
 *
 * 목업의 안내 문구("영문, 숫자, 특수문자 포함 6자리 이상")는 API 규칙과 다르다. API 는 8~64자에
 * 특수문자 하나 이상이다. 안내가 규칙과 어긋나면 안내대로 친 비밀번호가 서버에서 거절되므로
 * 문구를 API 쪽에 맞췄다.
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
    if (!/[^A-Za-z0-9]/.test(newPassword)) return '새로운 비밀번호에 특수문자를 포함해 주세요.';
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

      <ProfileField label="기존 비밀번호" htmlFor="profile-current-password">
        <Input
          id="profile-current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="기존 비밀번호를 입력해 주세요."
        />
      </ProfileField>

      <ProfileField label="새로운 비밀번호" htmlFor="profile-new-password">
        <Input
          id="profile-new-password"
          type="password"
          autoComplete="new-password"
          maxLength={MAX_LENGTH}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder={`특수문자 포함 ${MIN_LENGTH}자리 이상`}
        />
      </ProfileField>

      <ProfileField label="비밀번호 확인" htmlFor="profile-confirm-password">
        <Input
          id="profile-confirm-password"
          type="password"
          autoComplete="new-password"
          maxLength={MAX_LENGTH}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="비밀번호를 다시 입력해 주세요."
        />
      </ProfileField>

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
