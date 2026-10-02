'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createImage,
  deleteMyProfileImage,
  type MyProfileResponseAuthProvider,
  replaceMyNotificationEmail,
  replaceMyProfileImage,
  type SuccessResponseImageUploadResponse,
} from '@ogonggo/api';
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
 * 왼쪽 프로필 사진의 연필 버튼으로 사진을 고르면 바로 바뀐다. `POST /api/v1/images` 로 올리고
 * 받은 `id` 를 `PUT /api/v1/users/me/profile-image` 로 보낸다. 오공고에만 저장되고 렛츠커리어에는
 * 가지 않는다. `기본 정보 수정하기` 를 누를 필요는 없다 — 사진을 골랐는데 저장을 또 눌러야 하면
 * 고른 것이 반영됐는지 알 수 없다.
 *
 * `사진 삭제` 는 오공고에서 바꾼 사진을 지운다(`DELETE /api/v1/users/me/profile-image`). 렛츠커리어에
 * 사진이 있으면 그 사진으로 돌아가고, 없으면 기본 마크가 보인다. 응답에는 지금 사진이 오공고에서
 * 올린 것인지 알려 주는 값이 없어 사진이 있으면 늘 보인다 — 바꾼 적이 없어도 서버는 200 이다.
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePending, setImagePending] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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

  const changeImage = async (file: File | undefined) => {
    if (!file || imagePending) return;
    setImagePending(true);
    setImageError(null);
    try {
      // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다.
      const body = (await createImage({
        file,
      })) as unknown as SuccessResponseImageUploadResponse;
      if (!body.data) {
        setImageError('사진을 올리지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      await replaceMyProfileImage({ imageId: body.data.id });
      onSaved();
    } catch (error) {
      setImageError(
        serverMessageOf(error) ?? '사진을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setImagePending(false);
    }
  };

  const removeImage = async () => {
    if (imagePending) return;
    setImagePending(true);
    setImageError(null);
    try {
      await deleteMyProfileImage();
      onSaved();
    } catch (error) {
      setImageError(
        serverMessageOf(error) ?? '사진을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setImagePending(false);
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
        <div className="flex shrink-0 flex-col items-center gap-2 self-center md:self-start">
          <div className="relative h-30 w-30">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-blue-50">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <LetsCareerMark flat className="h-16 w-16 text-blue-200" />
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(event) => {
                void changeImage(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              aria-label="프로필 사진 변경"
              disabled={!loaded || imagePending}
              onClick={() => imageInputRef.current?.click()}
              className="absolute right-0 bottom-0 flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <span aria-hidden="true" className="icon-[lucide--pencil] block h-4 w-4" />
            </button>
          </div>
          {imagePending ? (
            <p className="text-xs text-gray-500">처리 중입니다.</p>
          ) : profileImageUrl ? (
            <button
              type="button"
              disabled={!loaded}
              onClick={() => void removeImage()}
              className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700"
            >
              사진 삭제
            </button>
          ) : null}
          {imageError ? (
            <p role="alert" className="max-w-40 text-center text-xs text-error">
              {imageError}
            </p>
          ) : null}
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
