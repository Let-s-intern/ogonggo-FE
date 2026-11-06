import { useState } from 'react';
import { Button, Callout, Checkbox, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import type { AdChannelPlatform } from '@ogonggo/api/src/ad-channels';
import {
  useSaveAdChannelFormat,
  type AdChannel,
  type AdChannelFormat,
} from '@/entities/ad-channel/api/useAdChannels';
import { PLATFORM_COPY, channelLabel } from '@/entities/ad-channel/lib/adChannel';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;
const PRICE_MAX_DIGITS = 10;

const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString('ko-KR') : '');

/**
 * 게재 유형 등록·수정 모달(이슈 #573). 플랫폼(채널 등록의 탭이 정하고 고친 유형도 바꾸지 않는다), 이름, 설명, 기본 단가
 * (선택), 사용 여부, 올릴 수 있는 채널(같은 플랫폼만).
 *
 * 채널은 `모든 계정`(오픈채팅은 `모든 오픈채팅방`)이 기본이고, 끄면 채널을 골라 좁힌다. 채널마다 유형을 고르는 표(채널 × 유형)
 * 보다 유형 하나에 채널을 체크하는 쪽이 칸이 적고, 새 채널이 생겨도 `모든` 유형은 따로 손대지 않아도 된다.
 */
export function ChannelFormatFormModal({
  format,
  platform,
  channels,
  onClose,
  onSaved,
}: {
  format: AdChannelFormat | null;
  platform: AdChannelPlatform;
  /** 모든 플랫폼의 채널. 이 플랫폼의 것만 보인다. */
  channels: AdChannel[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const copy = PLATFORM_COPY[platform];
  const platformChannels = channels.filter((channel) => channel.platform === platform);
  const save = useSaveAdChannelFormat(format?.id ?? null);
  const [name, setName] = useState(format?.name ?? '');
  const [description, setDescription] = useState(format?.description ?? '');
  const [price, setPrice] = useState(
    format?.defaultPrice == null ? '' : String(format.defaultPrice),
  );
  const [enabled, setEnabled] = useState(format?.enabled ?? true);
  const [allChannels, setAllChannels] = useState((format?.channelIds.length ?? 0) === 0);
  const [channelIds, setChannelIds] = useState<number[]>(format?.channelIds ?? []);
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted
    ? {
        name: name.trim() ? undefined : '이름을 입력해 주세요.',
        channels:
          !allChannels && channelIds.length === 0
            ? `올릴 ${copy.channelNoun}을 하나 이상 고르거나 모든 ${copy.channelNoun}을 켜 주세요.`
            : undefined,
      }
    : {};

  const submit = () => {
    setSubmitted(true);
    if (!name.trim() || (!allChannels && channelIds.length === 0)) {
      return;
    }
    save.mutate(
      {
        platform,
        name: name.trim(),
        description: description.trim() || null,
        enabled,
        defaultPrice: price ? Number(price) : null,
        channelIds: allChannels ? [] : channelIds,
      },
      {
        onSuccess: () => {
          onSaved(format ? '게재 유형을 고쳤습니다.' : '게재 유형을 더했습니다.');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={`${copy.label} 게재 유형 ${format ? '수정' : '추가'}`}
      onClose={onClose}
      className="w-[min(36rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}

      <Field label="이름" htmlFor="format-name" required error={errors.name}>
        <Input
          id="format-name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          placeholder={platform === 'INSTAGRAM' ? '예: 릴스(숏츠)' : '예: 공지 등록'}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="설명" htmlFor="format-description">
        <Textarea
          id="format-description"
          rows={2}
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          placeholder={
            platform === 'INSTAGRAM'
              ? '예: 24시간 노출, 링크 스티커 가능'
              : '예: 방 공지로 올림, 다음 공지가 올라오면 내려감'
          }
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field
        label="기본 단가(원)"
        htmlFor="format-price"
        hint="안내용입니다. 비워도 되고 계약 금액은 따로 적습니다."
      >
        <Input
          id="format-price"
          inputMode="numeric"
          autoComplete="off"
          value={withCommas(price)}
          placeholder="0"
          onChange={(event) =>
            setPrice(
              event.target.value
                .replace(/\D/g, '')
                .replace(/^0+(?=\d)/, '')
                .slice(0, PRICE_MAX_DIGITS),
            )
          }
        />
      </Field>
      <Field label={`올릴 수 있는 ${copy.channelNoun}`} error={errors.channels}>
        <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
          <Checkbox
            checked={allChannels}
            onChange={setAllChannels}
            label={`모든 ${copy.channelNoun}(새로 더한 ${copy.channelNoun} 포함)`}
            labelClassName="text-sm text-gray-700"
          />
          {allChannels ? null : (
            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
              {platformChannels.map((channel) => (
                <Checkbox
                  key={channel.id}
                  checked={channelIds.includes(channel.id)}
                  onChange={(checked) =>
                    setChannelIds((current) =>
                      checked
                        ? [...current, channel.id]
                        : current.filter((id) => id !== channel.id),
                    )
                  }
                  label={`${channelLabel(channel)}${channel.enabled ? '' : ' (사용 안 함)'}`}
                  labelClassName="text-sm text-gray-700"
                />
              ))}
            </div>
          )}
        </div>
      </Field>
      <label className="flex items-center gap-2 pb-4 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        사용(끄면 새 채널 광고와 계약 상품에서 고를 수 없습니다)
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
