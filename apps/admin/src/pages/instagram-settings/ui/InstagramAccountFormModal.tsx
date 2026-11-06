import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import {
  useSaveInstagramAccount,
  type InstagramAccount,
} from '@/entities/instagram/api/useInstagram';
import { isHttpUrl, isInstagramHandle, normalizeHandle } from '@/entities/instagram/lib/instagram';
import { instagramImageSrc } from '@/entities/instagram/ui/InstagramAccountName';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;

interface FormState {
  handle: string;
  displayName: string;
  profileUrl: string;
  profileImageUrl: string;
  enabled: boolean;
  memo: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const handle = normalizeHandle(form.handle);
  if (!handle) errors.handle = '계정을 입력해 주세요. 예: @letscareer.job';
  else if (!isInstagramHandle(handle))
    errors.handle = '영문·숫자·마침표(.)·밑줄(_) 30자까지 쓸 수 있어요.';
  if (!form.displayName.trim()) errors.displayName = '표시 이름을 입력해 주세요.';
  if (!isHttpUrl(form.profileUrl.trim()))
    errors.profileUrl = 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.';
  const image = form.profileImageUrl.trim();
  if (image && !isHttpUrl(image) && !image.startsWith('/'))
    errors.profileImageUrl = 'https:// 주소나 / 로 시작하는 웹 경로를 입력해 주세요.';
  return errors;
}

/**
 * 인스타 계정 등록·수정 모달(이슈 #573). 계정 이름(`@` 는 붙여도 빼도 된다), 표시 이름, 주소, 프로필 이미지(선택), 사용 여부,
 * 메모. 계정 이름을 처음 적으면 주소를 `https://www.instagram.com/{계정}/` 로 채운다.
 */
export function InstagramAccountFormModal({
  account,
  onClose,
  onSaved,
}: {
  /** `null` 이면 새 계정이다. */
  account: InstagramAccount | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const save = useSaveInstagramAccount(account?.id ?? null);
  const [form, setForm] = useState<FormState>(() => ({
    handle: account ? `@${account.handle}` : '',
    displayName: account?.displayName ?? '',
    profileUrl: account?.profileUrl ?? '',
    profileImageUrl: account?.profileImageUrl ?? '',
    enabled: account?.enabled ?? true,
    memo: account?.memo ?? '',
  }));
  // 운영자가 주소를 직접 고치기 전까지는 계정 이름을 따라 채운다.
  const [urlTouched, setUrlTouched] = useState(account !== null);
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form) : {};
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const imagePreview = form.profileImageUrl.trim();

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(validate(form)).length > 0) {
      return;
    }
    save.mutate(
      {
        handle: normalizeHandle(form.handle),
        displayName: form.displayName.trim(),
        profileUrl: form.profileUrl.trim(),
        profileImageUrl: imagePreview || null,
        enabled: form.enabled,
        memo: form.memo.trim() || null,
      },
      {
        onSuccess: () => {
          onSaved(account ? '계정을 고쳤습니다.' : '계정을 더했습니다.');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={account ? '인스타 계정 수정' : '인스타 계정 추가'}
      onClose={onClose}
      className="w-[min(36rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}

      <Field label="계정" htmlFor="instagram-handle" required error={errors.handle}>
        <Input
          id="instagram-handle"
          value={form.handle}
          placeholder="@letscareer.job"
          autoComplete="off"
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({
              ...current,
              handle: value,
              profileUrl:
                urlTouched || !normalizeHandle(value)
                  ? current.profileUrl
                  : `https://www.instagram.com/${normalizeHandle(value)}/`,
            }));
          }}
        />
      </Field>
      <Field label="표시 이름" htmlFor="instagram-name" required error={errors.displayName}>
        <Input
          id="instagram-name"
          value={form.displayName}
          maxLength={NAME_MAX_LENGTH}
          placeholder="예: 렛츠커리어 오공고"
          onChange={(event) => set('displayName', event.target.value)}
        />
      </Field>
      <Field label="계정 주소" htmlFor="instagram-url" required error={errors.profileUrl}>
        <Input
          id="instagram-url"
          value={form.profileUrl}
          placeholder="https://www.instagram.com/"
          onChange={(event) => {
            setUrlTouched(true);
            set('profileUrl', event.target.value);
          }}
        />
      </Field>
      <Field
        label="프로필 이미지"
        htmlFor="instagram-image"
        error={errors.profileImageUrl}
        hint="비워도 됩니다. 이미지 주소나 웹 사이트 경로(/community/...)를 넣습니다."
      >
        <div className="flex items-center gap-3">
          {imagePreview && !errors.profileImageUrl ? (
            <img
              src={instagramImageSrc(imagePreview)}
              alt="프로필 미리보기"
              className="size-10 shrink-0 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <span aria-hidden="true" className="block size-10 shrink-0 rounded-full bg-gray-200" />
          )}
          <Input
            id="instagram-image"
            value={form.profileImageUrl}
            placeholder="https://"
            onChange={(event) => set('profileImageUrl', event.target.value)}
          />
        </div>
      </Field>
      <Field label="메모" htmlFor="instagram-memo">
        <Textarea
          id="instagram-memo"
          rows={2}
          value={form.memo}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(event) => set('memo', event.target.value)}
        />
      </Field>
      <label className="flex items-center gap-2 pb-4 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(event) => set('enabled', event.target.checked)}
        />
        사용(끄면 새 인스타 광고에서 고를 수 없습니다)
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}
