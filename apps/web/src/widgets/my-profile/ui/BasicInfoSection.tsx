'use client';

import { useEffect, useState } from 'react';
import { type MyProfileResponseAuthProvider, replaceMyNotificationEmail } from '@ogonggo/api';
import { Badge, Button, Checkbox, Input, cn } from '@ogonggo/ui';
import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';
import { serverMessageOf } from '../lib/serverMessage';
import { ProfileField } from './ProfileField';
import { SaveMessage, type SaveStatus } from './SaveMessage';

export interface BasicInfoSectionProps {
  /** `profile.name`. 렛츠커리어가 소유해 여기서 고칠 수 없다. */
  name?: string;
  /** `profile.phoneNum`. 렛츠커리어가 소유해 조회만 한다. */
  phoneNum?: string;
  /** `email`. 일반 회원은 렛츠커리어 프로필의 이메일이다. */
  email?: string;
  /** `profile.notificationEmail`. 입력하지 않았으면 없다. */
  notificationEmail?: string;
  authProvider?: MyProfileResponseAuthProvider;
  profileImageUrl?: string;
  /** 계정을 읽었는지. 읽기 전에는 수신용 이메일 칸을 채울 값을 모른다. */
  loaded: boolean;
  /** 수신용 이메일을 저장한 뒤 계정을 다시 읽게 한다. */
  onSaved: () => void;
}

/**
 * 가입 경로 뱃지(v11 `docs/asset/v11/image copy 5.png` 의 초록 `네이버 로그인`). 색은 각 서비스의
 * 대표색이다. 렛츠커리어에 값이 없는 과거 계정은 `authProvider` 가 없어 뱃지를 그리지 않는다.
 */
const PROVIDER_BADGES: Record<MyProfileResponseAuthProvider, { label: string; className: string }> =
  {
    KAKAO: { label: '카카오 로그인', className: 'bg-[#FEE500] text-gray-900' },
    NAVER: { label: '네이버 로그인', className: 'bg-[#03C75A] text-white' },
    GOOGLE: { label: '구글 로그인', className: 'bg-gray-100 text-gray-700' },
    SERVICE: { label: '이메일 로그인', className: 'bg-blue-50 text-blue-500' },
  };

/**
 * 기본 정보 구역(v11). 이름·휴대폰 번호·가입한 이메일은 렛츠커리어가 소유해 **읽기 전용**이고,
 * 이 화면에서 고칠 수 있는 것은 오늘의 공고 정보 수신용 이메일 하나다
 * (`PUT /api/v1/users/me/notification-email`). `기본 정보 수정하기` 가 그 값을 보낸다.
 *
 * `가입한 이메일과 동일` 을 켜면 칸이 가입한 이메일로 채워지고 잠긴다. 저장할 때 그 값을 그대로
 * 보낸다 — 서버는 "비어 있음" 과 "가입한 이메일과 같음" 을 따로 저장하지 않으므로, 켠 상태를
 * 저장하면 수신용 이메일은 가입한 이메일과 같은 문자열이 된다. 다음에 열 때 두 값이 같으면
 * 다시 켜진 채로 보인다.
 *
 * 왼쪽의 프로필 사진은 보이기만 한다. 목업의 연필 버튼(사진 수정 모달)은 사진을 올릴 API 가
 * 없어 두지 않았다 — 사진은 렛츠커리어가 소유한다.
 */
export function BasicInfoSection({
  name,
  phoneNum,
  email,
  notificationEmail,
  authProvider,
  profileImageUrl,
  loaded,
  onSaved,
}: BasicInfoSectionProps) {
  const [sameAsEmail, setSameAsEmail] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus | null>(null);

  // 읽어 온 값으로 칸을 맞춘다. 저장 뒤 다시 읽은 값도 여기로 들어온다.
  useEffect(() => {
    if (!loaded) return;
    const same = Boolean(email) && notificationEmail === email;
    setSameAsEmail(same);
    setDraft(same ? '' : (notificationEmail ?? ''));
  }, [loaded, email, notificationEmail]);

  const value = sameAsEmail ? (email ?? '') : draft;
  const badge = authProvider ? PROVIDER_BADGES[authProvider] : undefined;

  const submit = async () => {
    const trimmed = value.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus({ tone: 'error', message: '이메일 주소 형식을 확인해 주세요.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      // 비우면 서버가 수신용 이메일을 지운다.
      await replaceMyNotificationEmail(trimmed ? { notificationEmail: trimmed } : {});
      setStatus({ tone: 'success', message: '저장했습니다.' });
      onSaved();
    } catch (error) {
      setStatus({
        tone: 'error',
        message: serverMessageOf(error) ?? '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-gray-950">기본 정보</h2>
        {badge ? (
          <Badge className={cn('text-xs font-semibold', badge.className)}>{badge.label}</Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-14">
        <div className="flex h-30 w-30 shrink-0 items-center justify-center self-center overflow-hidden rounded-full bg-blue-50 md:self-start">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <LetsCareerMark flat className="h-16 w-16 text-blue-200" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <ProfileField label="이름" htmlFor="profile-name">
            <Input id="profile-name" value={name ?? ''} readOnly disabled />
          </ProfileField>

          <ProfileField label="휴대폰 번호" htmlFor="profile-phone">
            <Input id="profile-phone" value={phoneNum ?? ''} readOnly disabled />
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
              type="email"
              value={value}
              maxLength={320}
              disabled={!loaded || sameAsEmail}
              placeholder="이메일 주소를 입력해 주세요."
              onChange={(event) => setDraft(event.target.value)}
            />
            <Checkbox
              checked={sameAsEmail}
              disabled={!loaded || !email}
              onChange={setSameAsEmail}
              label="가입한 이메일과 동일"
            />
          </ProfileField>

          <Button
            variant="secondary"
            disabled={!loaded || saving}
            onClick={() => void submit()}
            className="w-full border-blue-500 text-blue-500"
          >
            기본 정보 수정하기
          </Button>
          <SaveMessage status={status} />
        </div>
      </div>
    </section>
  );
}
