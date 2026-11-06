import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Select, Textarea } from '@ogonggo/ui';
import {
  AD_CHANNEL_PLATFORMS,
  CHANNEL_AD_STATUSES,
  type AdChannelPlatform,
  type ChannelAdStatus,
} from '@ogonggo/api/src/ad-channels';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import {
  useAdChannelFormats,
  useAdChannels,
  useSaveChannelAd,
  type AdChannelFormat,
  type ChannelAd,
} from '@/entities/ad-channel/api/useAdChannels';
import {
  CHANNEL_AD_STATUS_BADGES,
  PLATFORM_COPY,
  channelAdPeriod,
  channelLabel,
  isHttpUrl,
  kstDate,
} from '@/entities/ad-channel/lib/adChannel';
import type { AdContract } from '@/entities/ad-contract/api/useAdContracts';
import { formatWon } from '@/entities/ad-contract/lib/adContract';
import {
  AdContractField,
  useDefaultAdContract,
} from '@/features/ad-contract-picker/ui/AdContractField';
import { AdvertiserField } from '@/features/advertiser-picker/ui/AdvertiserField';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const MEMO_MAX_LENGTH = 1000;

/** 새 광고에 미리 채울 값. 광고 계약 상세(광고주)와 계약 행(광고주·계약)에서 연다. */
export interface ChannelAdInitial {
  advertiser: AdvertiserSummary;
  /** 미리 고를 계약. `null` 이면 계약 없이 연다. */
  contract: AdContract | null;
}

/** 계약을 고르면 채울 게시 예정일. 계약 시작이 지났고 아직 계약 중이면 오늘, 아니면 계약 시작일. */
function contractPostDate(contract: AdContract): string {
  const today = kstDate();
  const start = contract.startAt.slice(0, 10);
  return start < today && today < contract.endAt.slice(0, 10) ? today : start;
}

/** 이 채널에 올릴 수 있는 유형인가. 유형의 채널이 비어 있으면 그 플랫폼의 모든 채널이다. */
const supportsChannel = (format: AdChannelFormat, channelId: number | null) =>
  channelId === null || format.channelIds.length === 0 || format.channelIds.includes(channelId);

const PLATFORM_OPTIONS = AD_CHANNEL_PLATFORMS.map((value) => ({
  value,
  label: PLATFORM_COPY[value].label,
}));

/**
 * 채널 광고 추가·수정 모달(이슈 #573, 2026-11-06 사용자). 채널 광고 화면, 광고 계약 상세, 계약 행의 `채널 광고 추가` 가 같이
 * 쓴다.
 *
 * - 광고주는 필수, 계약은 선택이다. 광고주를 고르면 그 광고주의 기본 계약(진행 중, 없으면 가장 가까운 예정)을 고르고 게시
 *   예정일을 채운다(배너·광고 공고 모달과 같다)
 * - 플랫폼 → 채널 → 게재 유형 순으로 고른다. 플랫폼을 바꾸면 채널·유형을 비운다. 채널·유형은 `사용` 인 것만 고른다. 고친
 *   광고에 이미 든 채널·유형은 꺼져 있어도 남는다. 채널을 고르면 그 채널에 올릴 수 있는 유형만 보인다
 * - 노출 끝 날은 스토리·하이라이트 고정·공지 고정처럼 기간이 있는 것만 적는다. 비우면 게시 하루짜리다
 * - 게시 확인 주소는 인스타그램은 `게시물 주소`, 오픈채팅은 글 주소가 없어 `확인 링크`(캡처 링크 등)이고 둘 다 비워도 된다
 */
export function ChannelAdFormModal({
  ad,
  initial,
  onClose,
  onSaved,
}: {
  /** `null` 이면 새 광고다. */
  ad: ChannelAd | null;
  initial?: ChannelAdInitial;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const save = useSaveChannelAd(ad?.id ?? null);
  const channels = useAdChannels();
  const formats = useAdChannelFormats();
  const defaultContract = useDefaultAdContract();

  const [advertiser, setAdvertiser] = useState<AdvertiserSummary | null>(
    ad?.advertiser ?? initial?.advertiser ?? null,
  );
  const [contractId, setContractId] = useState<number | null>(
    ad ? ad.contractId : (initial?.contract?.id ?? null),
  );
  const [platform, setPlatform] = useState<AdChannelPlatform>(ad?.platform ?? 'INSTAGRAM');
  const [channelId, setChannelId] = useState<number | null>(ad?.channelId ?? null);
  const [formatId, setFormatId] = useState<number | null>(ad?.formatId ?? null);
  const [postDate, setPostDate] = useState(
    ad?.postDate ?? (initial?.contract ? contractPostDate(initial.contract) : ''),
  );
  const [endDate, setEndDate] = useState(ad?.endDate ?? '');
  const [status, setStatus] = useState<ChannelAdStatus>(ad?.status ?? 'SCHEDULED');
  const [postUrl, setPostUrl] = useState(ad?.postUrl ?? '');
  const [creativeMemo, setCreativeMemo] = useState(ad?.creativeMemo ?? '');
  const [adminMemo, setAdminMemo] = useState(ad?.adminMemo ?? '');
  const [submitted, setSubmitted] = useState(false);

  const copy = PLATFORM_COPY[platform];
  const allFormats = formats.data ?? [];
  const selectedFormat = allFormats.find((format) => format.id === formatId) ?? null;
  const channelOptions = (channels.data ?? []).filter(
    (channel) => channel.platform === platform && (channel.enabled || channel.id === ad?.channelId),
  );
  const formatOptions = allFormats.filter(
    (format) =>
      format.platform === platform &&
      (format.enabled || format.id === ad?.formatId) &&
      supportsChannel(format, channelId),
  );

  /** 계약을 고르면 게시 예정일을 채운다. 채운 뒤에도 고칠 수 있다. */
  const applyContract = (contract: AdContract | null) => {
    setContractId(contract?.id ?? null);
    if (contract) {
      setPostDate(contractPostDate(contract));
    }
  };

  /** 광고주를 바꾸면 계약을 비우고, 새 광고면 그 광고주의 기본 계약을 고른다. */
  const changeAdvertiser = async (next: AdvertiserSummary | null) => {
    if (next?.id === advertiser?.id) {
      return;
    }
    setAdvertiser(next);
    setContractId(null);
    if (next && !ad) {
      applyContract(await defaultContract(next.id));
    }
  };

  const changePlatform = (next: AdChannelPlatform) => {
    if (next === platform) {
      return;
    }
    setPlatform(next);
    setChannelId(null);
    setFormatId(null);
  };

  const changeChannel = (next: number | null) => {
    setChannelId(next);
    // 새 채널에 올리지 않는 유형이면 비운다.
    if (selectedFormat && !supportsChannel(selectedFormat, next)) {
      setFormatId(null);
    }
  };

  const trimmedUrl = postUrl.trim();
  const errors = submitted
    ? {
        advertiser: advertiser ? undefined : '어느 기업의 광고인지 골라 주세요.',
        channel: channelId === null ? `올릴 ${copy.channelNoun}을 골라 주세요.` : undefined,
        format: formatId === null ? '게재 유형을 골라 주세요.' : undefined,
        postDate: postDate ? undefined : '게시 예정일을 입력해 주세요.',
        endDate:
          endDate && postDate && endDate < postDate
            ? '노출 끝 날은 게시 예정일과 같거나 뒤여야 해요.'
            : undefined,
        postUrl:
          trimmedUrl && !isHttpUrl(trimmedUrl)
            ? 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.'
            : undefined,
      }
    : {};

  const submit = () => {
    setSubmitted(true);
    if (
      !advertiser ||
      channelId === null ||
      formatId === null ||
      !postDate ||
      (endDate && endDate < postDate) ||
      (trimmedUrl && !isHttpUrl(trimmedUrl))
    ) {
      return;
    }
    save.mutate(
      {
        advertiserId: advertiser.id,
        contractId,
        channelId,
        formatId,
        postDate,
        endDate: endDate || null,
        status,
        postUrl: trimmedUrl || null,
        creativeMemo: creativeMemo.trim() || null,
        adminMemo: adminMemo.trim() || null,
      },
      {
        onSuccess: () => {
          onSaved(ad ? '채널 광고를 고쳤습니다.' : '채널 광고를 더했습니다.');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={ad ? '채널 광고 수정' : '채널 광고 추가'}
      onClose={onClose}
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}
      {channels.isError || formats.isError ? (
        <Callout tone="error" className="mb-4">
          채널·게재 유형을 불러오지 못했습니다.
        </Callout>
      ) : null}

      <AdvertiserField
        id="channel-ad-advertiser"
        value={advertiser}
        onChange={(next) => void changeAdvertiser(next)}
        required
        error={errors.advertiser}
      />

      <AdContractField
        id="channel-ad-contract"
        advertiserId={advertiser?.id ?? null}
        value={contractId}
        onChange={applyContract}
        period={channelAdPeriod({ postDate, endDate: endDate || null })}
        channelFormat={selectedFormat}
        hint="계약을 고르면 게시 예정일을 계약 기간 안의 날로 채웁니다. 채운 뒤에도 고칠 수 있습니다."
      />

      <div className="grid grid-cols-[11rem_1fr_1fr] gap-3">
        <Field label="플랫폼" htmlFor="channel-ad-platform" required>
          <Select
            id="channel-ad-platform"
            className="w-full"
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(event) => changePlatform(event.target.value as AdChannelPlatform)}
          />
        </Field>
        <Field
          label={copy.channelNoun}
          htmlFor="channel-ad-channel"
          required
          error={errors.channel}
        >
          <Select
            id="channel-ad-channel"
            className="w-full"
            options={[
              { value: '', label: `${copy.channelNoun} 고르기` },
              ...channelOptions.map((channel) => ({
                value: String(channel.id),
                label: `${channelLabel(channel)}${channel.handle ? ` · ${channel.name}` : ''}${
                  channel.enabled ? '' : ' (사용 안 함)'
                }`,
              })),
            ]}
            value={channelId === null ? '' : String(channelId)}
            onChange={(event) =>
              changeChannel(event.target.value ? Number(event.target.value) : null)
            }
          />
        </Field>
        <Field
          label="게재 유형"
          htmlFor="channel-ad-format"
          required
          error={errors.format}
          hint={
            selectedFormat
              ? [
                  selectedFormat.description,
                  selectedFormat.defaultPrice === null
                    ? null
                    : `기본 단가 ${formatWon(selectedFormat.defaultPrice)}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              : channelId === null
                ? undefined
                : `이 ${copy.channelNoun}에 올릴 수 있는 유형만 보입니다.`
          }
        >
          <Select
            id="channel-ad-format"
            className="w-full"
            options={[
              { value: '', label: '유형 고르기' },
              ...formatOptions.map((format) => ({
                value: String(format.id),
                label: `${format.name}${format.enabled ? '' : ' (사용 안 함)'}`,
              })),
            ]}
            value={formatId === null ? '' : String(formatId)}
            onChange={(event) =>
              setFormatId(event.target.value ? Number(event.target.value) : null)
            }
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="게시 예정일(KST)"
          htmlFor="channel-ad-post-date"
          required
          error={errors.postDate}
        >
          <Input
            id="channel-ad-post-date"
            type="date"
            value={postDate}
            onChange={(event) => setPostDate(event.target.value)}
          />
        </Field>
        <Field
          label="노출 끝 날"
          htmlFor="channel-ad-end-date"
          error={errors.endDate}
          hint="스토리·공지 고정처럼 기간이 있을 때만. 그날까지"
        >
          <Input
            id="channel-ad-end-date"
            type="date"
            value={endDate}
            min={postDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Field>
        <Field label="상태" htmlFor="channel-ad-status">
          <Select
            id="channel-ad-status"
            className="w-full"
            options={CHANNEL_AD_STATUSES.map((value) => ({
              value,
              label: CHANNEL_AD_STATUS_BADGES[value].label,
            }))}
            value={status}
            onChange={(event) => setStatus(event.target.value as ChannelAdStatus)}
          />
        </Field>
      </div>

      <Field
        label={copy.postUrlLabel}
        htmlFor="channel-ad-url"
        error={errors.postUrl}
        hint={copy.postUrlHint}
      >
        <Input
          id="channel-ad-url"
          value={postUrl}
          placeholder={copy.postUrlPlaceholder}
          onChange={(event) => setPostUrl(event.target.value)}
        />
      </Field>
      <Field label="소재·문구 메모" htmlFor="channel-ad-creative">
        <Textarea
          id="channel-ad-creative"
          rows={3}
          value={creativeMemo}
          maxLength={MEMO_MAX_LENGTH}
          placeholder="광고주가 준 문구, 이미지·영상 위치, 링크 등"
          onChange={(event) => setCreativeMemo(event.target.value)}
        />
      </Field>
      <Field label="담당자 메모" htmlFor="channel-ad-admin-memo">
        <Textarea
          id="channel-ad-admin-memo"
          rows={2}
          value={adminMemo}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(event) => setAdminMemo(event.target.value)}
        />
      </Field>

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
