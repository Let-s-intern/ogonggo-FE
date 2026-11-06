import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Select } from '@ogonggo/ui';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import type { BannerPlacement } from '@ogonggo/api/src/banners';
import { useSaveBanner, type Banner, type BannerInput } from '@/entities/banner/api/useBanners';
import {
  PC_IMAGE_SPECS,
  PLACEMENT_LABELS,
  bannerPresets,
  isLinkUrl,
} from '@/entities/banner/lib/banner';
import { AdvertiserField } from '@/features/advertiser-picker/ui/AdvertiserField';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { BannerImageField } from './BannerImageField';

const NAME_MAX_LENGTH = 50;
const ALT_TEXT_MAX_LENGTH = 100;

interface BannerFormModalProps {
  open: boolean;
  placement: BannerPlacement;
  /** `null` 이면 새 배너다. */
  banner: Banner | null;
  /**
   * 새 배너에 미리 고를 광고주. 광고주별 광고 화면에서 열 때 준다. 돈을 받고 싣는 배너라 `광고 표시` 도 켠 채로 시작한다.
   */
  initialAdvertiser?: AdvertiserSummary;
  onClose: () => void;
}

/** `datetime-local` 값(`YYYY-MM-DDTHH:mm`)과 서버 값(`YYYY-MM-DDTHH:mm:ss`, KST)을 오간다. 브라우저 시간대는 보지 않는다. */
const toInputValue = (value: string | null) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

interface FormState {
  name: string;
  pcImageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  openInNewTab: boolean;
  altText: string;
  showAdLabel: boolean;
  startAt: string;
  endAt: string;
  enabled: boolean;
  advertiser: AdvertiserSummary | null;
}

function initialState(banner: Banner | null, initialAdvertiser?: AdvertiserSummary): FormState {
  return {
    name: banner?.name ?? '',
    pcImageUrl: banner?.pcImageUrl ?? '',
    mobileImageUrl: banner?.mobileImageUrl ?? '',
    linkUrl: banner?.linkUrl ?? '',
    openInNewTab: banner?.openInNewTab ?? false,
    altText: banner?.altText ?? '',
    showAdLabel: banner?.showAdLabel ?? initialAdvertiser !== undefined,
    startAt: toInputValue(banner?.startAt ?? null),
    endAt: toInputValue(banner?.endAt ?? null),
    // 새 배너는 켠 채로 시작한다. 기간을 정해 두면 그 사이에만 보인다.
    enabled: banner?.enabled ?? true,
    advertiser: banner?.advertiser ?? initialAdvertiser ?? null,
  };
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = '이름을 입력해 주세요.';
  else if (name.length > NAME_MAX_LENGTH)
    errors.name = `이름은 ${NAME_MAX_LENGTH}자까지 쓸 수 있어요.`;
  if (!form.pcImageUrl) errors.pcImageUrl = 'PC 이미지를 올리거나 기본 소재를 골라 주세요.';
  if (!form.mobileImageUrl)
    errors.mobileImageUrl = '모바일 이미지를 올리거나 기본 소재를 골라 주세요.';
  const linkUrl = form.linkUrl.trim();
  if (!linkUrl) errors.linkUrl = '링크를 입력해 주세요.';
  else if (!isLinkUrl(linkUrl))
    errors.linkUrl = 'http:// 또는 https:// 로 시작하는 주소나 / 로 시작하는 경로를 입력해 주세요.';
  const altText = form.altText.trim();
  if (!altText)
    errors.altText = '배너 문구를 입력해 주세요. 화면을 읽어 주는 기능이 이 문구를 읽어요.';
  else if (altText.length > ALT_TEXT_MAX_LENGTH)
    errors.altText = `배너 문구는 ${ALT_TEXT_MAX_LENGTH}자까지 쓸 수 있어요.`;
  if (form.startAt && form.endAt && form.startAt >= form.endAt)
    errors.endAt = '노출 끝은 시작보다 뒤여야 해요.';
  if (form.showAdLabel && !form.advertiser)
    errors.advertiser = '광고 표시가 켜진 배너는 어느 기업의 광고인지 골라 주세요.';
  return errors;
}

/**
 * 배너 등록·수정 모달(이슈 #573). 자리는 열 때의 탭으로 정해지고 바꾸지 않는다 — 다른 자리에 쓰려면 새로 등록한다.
 *
 * 검증은 저장을 누른 뒤부터 보인다. 쓰는 중에 빈 칸마다 빨간 글자가 뜨면 처음 여는 사람에게 모두 틀린 것처럼 보인다.
 * 서버가 거절하면 그 문구를 그대로 보인다.
 */
export function BannerFormModal({
  open,
  placement,
  banner,
  initialAdvertiser,
  onClose,
}: BannerFormModalProps) {
  const saveMutation = useSaveBanner(placement, banner?.id ?? null);
  const [form, setForm] = useState<FormState>(() => initialState(banner, initialAdvertiser));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form) : {};

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    setSubmitted(true);
    if (Object.keys(validate(form)).length > 0) {
      return;
    }
    const input: BannerInput = {
      placement,
      name: form.name.trim(),
      pcImageUrl: form.pcImageUrl,
      mobileImageUrl: form.mobileImageUrl,
      linkUrl: form.linkUrl.trim(),
      openInNewTab: form.openInNewTab,
      altText: form.altText.trim(),
      showAdLabel: form.showAdLabel,
      startAt: toServerValue(form.startAt),
      endAt: toServerValue(form.endAt),
      enabled: form.enabled,
      advertiserId: form.advertiser?.id ?? null,
    };
    saveMutation.mutate(input, { onSuccess: onClose });
  };

  const presets = bannerPresets(placement);
  const pcSpec = PC_IMAGE_SPECS[placement];
  const presetOptions = [
    { value: '', label: '기본 소재에서 고르기' },
    ...presets.map((preset) => ({ value: preset.key, label: preset.label })),
  ];

  return (
    <Modal
      open={open}
      title={banner ? '배너 수정' : '새 배너'}
      description={`${PLACEMENT_LABELS[placement]} 자리`}
      onClose={onClose}
      className="w-[min(44rem,calc(100vw-2rem))]"
    >
      {saveMutation.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(saveMutation.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}

      <Field label="이름(내부용)" htmlFor="banner-name" required error={errors.name}>
        <Input
          id="banner-name"
          value={form.name}
          maxLength={NAME_MAX_LENGTH}
          placeholder="예: 11월 지원일정 관리 홍보"
          onChange={(event) => set('name', event.target.value)}
        />
      </Field>

      <Field
        label="기본 소재"
        htmlFor="banner-preset"
        hint="오공고가 만든 배너를 고르면 PC·모바일 이미지가 함께 채워집니다."
      >
        <Select
          id="banner-preset"
          options={presetOptions}
          value=""
          onChange={(event) => {
            const preset = presets.find((item) => item.key === event.target.value);
            if (preset) {
              setForm((current) => ({
                ...current,
                pcImageUrl: preset.pcImageUrl,
                mobileImageUrl: preset.mobileImageUrl,
              }));
            }
          }}
        />
      </Field>

      {/* 세로 소재(공고 상세)는 폭을 줄여 미리 본다. 모달 폭 그대로면 화면을 넘는다. */}
      <div className={placement === 'JOB_DETAIL_SIDE' ? 'max-w-56' : undefined}>
        <BannerImageField
          id="banner-pc-image"
          label="PC 이미지"
          sizeHint={pcSpec.sizeHint}
          aspectClassName={pcSpec.aspectClassName}
          value={form.pcImageUrl}
          onChange={(url) => set('pcImageUrl', url)}
          error={errors.pcImageUrl}
        />
      </div>
      <div className="max-w-xs">
        <BannerImageField
          id="banner-mobile-image"
          label="모바일 이미지"
          sizeHint="750×200 비율. JPG·PNG."
          aspectClassName="aspect-[750/200]"
          value={form.mobileImageUrl}
          onChange={(url) => set('mobileImageUrl', url)}
          error={errors.mobileImageUrl}
        />
      </div>

      <Field
        label="배너 문구(대체 텍스트)"
        htmlFor="banner-alt"
        required
        error={errors.altText}
        hint="이미지에 적힌 문구를 그대로 적어 주세요. 이미지를 볼 수 없는 사람에게 읽어 줍니다."
      >
        <Input
          id="banner-alt"
          value={form.altText}
          maxLength={ALT_TEXT_MAX_LENGTH}
          onChange={(event) => set('altText', event.target.value)}
        />
      </Field>

      <Field
        label="링크"
        htmlFor="banner-link"
        required
        error={errors.linkUrl}
        hint="https:// 로 시작하는 주소, 또는 /calendar 처럼 오공고 안의 경로."
      >
        <Input
          id="banner-link"
          value={form.linkUrl}
          placeholder="https://"
          onChange={(event) => set('linkUrl', event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="노출 시작(KST)" htmlFor="banner-start" hint="비우면 켜는 즉시">
          <Input
            id="banner-start"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => set('startAt', event.target.value)}
          />
        </Field>
        <Field
          label="노출 끝(KST)"
          htmlFor="banner-end"
          error={errors.endAt}
          hint="비우면 끌 때까지"
        >
          <Input
            id="banner-end"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => set('endAt', event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => set('enabled', event.target.checked)}
          />
          켜기
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.openInNewTab}
            onChange={(event) => set('openInNewTab', event.target.checked)}
          />
          새 탭에서 열기(외부 주소는 늘 새 탭)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.showAdLabel}
            onChange={(event) => set('showAdLabel', event.target.checked)}
          />
          광고 표시(돈을 받고 싣는 배너)
        </label>
      </div>

      <AdvertiserField
        id="banner-advertiser"
        value={form.advertiser}
        onChange={(advertiser) => set('advertiser', advertiser)}
        required={form.showAdLabel}
        error={errors.advertiser}
        hint="광고 표시를 켠 배너는 필수입니다. 오공고 자체 홍보 배너는 비워 둡니다."
      />

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={save} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}
