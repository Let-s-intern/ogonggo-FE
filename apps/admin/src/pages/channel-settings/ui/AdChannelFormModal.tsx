import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import type { AdChannelPlatform } from '@ogonggo/api/src/ad-channels';
import { useSaveAdChannel, type AdChannel } from '@/entities/ad-channel/api/useAdChannels';
import {
  PLATFORM_COPY,
  isHttpUrl,
  isInstagramHandle,
  normalizeHandle,
} from '@/entities/ad-channel/lib/adChannel';
import { channelImageSrc } from '@/entities/ad-channel/ui/AdChannelName';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;
const MEMBER_MAX_DIGITS = 8;

interface FormState {
  handle: string;
  name: string;
  url: string;
  profileImageUrl: string;
  /** 숫자만 들고 있는다. */
  memberCount: string;
  enabled: boolean;
  memo: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState, platform: AdChannelPlatform): FormErrors {
  const errors: FormErrors = {};
  if (platform === 'INSTAGRAM') {
    const handle = normalizeHandle(form.handle);
    if (!handle) errors.handle = '계정을 입력해 주세요. 예: @letscareer.job';
    else if (!isInstagramHandle(handle))
      errors.handle = '영문·숫자·마침표(.)·밑줄(_) 30자까지 쓸 수 있어요.';
  }
  if (!form.name.trim())
    errors.name =
      platform === 'INSTAGRAM' ? '표시 이름을 입력해 주세요.' : '방 이름을 입력해 주세요.';
  if (!isHttpUrl(form.url.trim()))
    errors.url = 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.';
  const image = form.profileImageUrl.trim();
  if (image && !isHttpUrl(image) && !image.startsWith('/'))
    errors.profileImageUrl = 'https:// 주소나 / 로 시작하는 웹 경로를 입력해 주세요.';
  return errors;
}

/**
 * 채널 등록·수정 모달(이슈 #573). 플랫폼은 채널 등록의 탭이 정하고 고친 채널도 바꾸지 않는다.
 *
 * - 인스타그램: 계정 이름(`@` 는 붙여도 빼도 된다, 필수), 표시 이름, 계정 주소. 계정 이름을 처음 적으면 주소를
 *   `https://www.instagram.com/{계정}/` 로 채운다
 * - 카카오톡 오픈채팅: 방 이름, 오픈채팅 주소(`https://open.kakao.com/o/...`). 계정 이름 칸이 없다
 * - 둘 다: 프로필 이미지(선택), 인원(선택, 인스타는 팔로워 수), 사용 여부, 메모
 */
export function AdChannelFormModal({
  channel,
  platform,
  onClose,
  onSaved,
}: {
  /** `null` 이면 새 채널이다. */
  channel: AdChannel | null;
  platform: AdChannelPlatform;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const copy = PLATFORM_COPY[platform];
  const isInstagram = platform === 'INSTAGRAM';
  const save = useSaveAdChannel(channel?.id ?? null);
  const [form, setForm] = useState<FormState>(() => ({
    handle: channel?.handle ? `@${channel.handle}` : '',
    name: channel?.name ?? '',
    url: channel?.url ?? '',
    profileImageUrl: channel?.profileImageUrl ?? '',
    memberCount: channel?.memberCount == null ? '' : String(channel.memberCount),
    enabled: channel?.enabled ?? true,
    memo: channel?.memo ?? '',
  }));
  // 운영자가 주소를 직접 고치기 전까지는 계정 이름을 따라 채운다(인스타그램만).
  const [urlTouched, setUrlTouched] = useState(channel !== null);
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form, platform) : {};
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const imagePreview = form.profileImageUrl.trim();

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(validate(form, platform)).length > 0) {
      return;
    }
    save.mutate(
      {
        platform,
        handle: isInstagram ? normalizeHandle(form.handle) : null,
        name: form.name.trim(),
        url: form.url.trim(),
        profileImageUrl: imagePreview || null,
        memberCount: form.memberCount ? Number(form.memberCount) : null,
        enabled: form.enabled,
        memo: form.memo.trim() || null,
      },
      {
        onSuccess: () => {
          onSaved(
            channel ? `${copy.channelNoun}을 고쳤습니다.` : `${copy.channelNoun}을 더했습니다.`,
          );
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={`${copy.channelTitle} ${channel ? '수정' : '추가'}`}
      onClose={onClose}
      className="w-[min(36rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}

      {isInstagram ? (
        <Field label="계정" htmlFor="channel-handle" required error={errors.handle}>
          <Input
            id="channel-handle"
            value={form.handle}
            placeholder="@letscareer.job"
            autoComplete="off"
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({
                ...current,
                handle: value,
                url:
                  urlTouched || !normalizeHandle(value)
                    ? current.url
                    : `https://www.instagram.com/${normalizeHandle(value)}/`,
              }));
            }}
          />
        </Field>
      ) : null}
      <Field
        label={isInstagram ? '표시 이름' : '방 이름'}
        htmlFor="channel-name"
        required
        error={errors.name}
      >
        <Input
          id="channel-name"
          value={form.name}
          maxLength={NAME_MAX_LENGTH}
          placeholder={isInstagram ? '예: 렛츠커리어 오공고' : '예: 마케팅 채용공고 큐레이션'}
          onChange={(event) => set('name', event.target.value)}
        />
      </Field>
      <Field label={copy.urlLabel} htmlFor="channel-url" required error={errors.url}>
        <Input
          id="channel-url"
          value={form.url}
          placeholder={copy.urlPlaceholder}
          onChange={(event) => {
            setUrlTouched(true);
            set('url', event.target.value);
          }}
        />
      </Field>
      <div className="grid grid-cols-[1fr_10rem] gap-3">
        <Field
          label="프로필 이미지"
          htmlFor="channel-image"
          error={errors.profileImageUrl}
          hint="비워도 됩니다. 이미지 주소나 웹 사이트 경로(/community/...)를 넣습니다."
        >
          <div className="flex items-center gap-3">
            {imagePreview && !errors.profileImageUrl ? (
              <img
                src={channelImageSrc(imagePreview)}
                alt="프로필 미리보기"
                className="size-10 shrink-0 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="block size-10 shrink-0 rounded-full bg-gray-200"
              />
            )}
            <Input
              id="channel-image"
              value={form.profileImageUrl}
              placeholder="https://"
              onChange={(event) => set('profileImageUrl', event.target.value)}
            />
          </div>
        </Field>
        <Field label={copy.memberLabel} htmlFor="channel-members" hint="안내용, 비워도 됩니다.">
          <Input
            id="channel-members"
            inputMode="numeric"
            autoComplete="off"
            value={form.memberCount ? Number(form.memberCount).toLocaleString('ko-KR') : ''}
            placeholder="0"
            onChange={(event) =>
              set(
                'memberCount',
                event.target.value
                  .replace(/\D/g, '')
                  .replace(/^0+(?=\d)/, '')
                  .slice(0, MEMBER_MAX_DIGITS),
              )
            }
          />
        </Field>
      </div>
      <Field label="메모" htmlFor="channel-memo">
        <Textarea
          id="channel-memo"
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
        사용(끄면 새 채널 광고에서 고를 수 없습니다)
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
