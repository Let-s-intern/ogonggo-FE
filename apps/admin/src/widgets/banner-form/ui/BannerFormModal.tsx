import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Select } from '@ogonggo/ui';
import {
  useAdvertisementExposures,
  useCreateExposure,
  useMoveExposure,
  useReplaceExposure,
  useToggleExposure,
  type AdvertisementExposure,
} from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import {
  imageSpec,
  isLinkUrl,
  isSidePosition,
  type BannerPosition,
} from '@/entities/advertisement-exposure/lib/exposure';
import type { AdvertisementProduct } from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { positionLabel } from '@/entities/advertisement-product/lib/product';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { BannerImageField } from './BannerImageField';
import { ContractField } from './ContractField';

const NAME_MAX_LENGTH = 100;

interface BannerFormModalProps {
  open: boolean;
  /** 노출을 거는 상품(자리). 열 때의 상품으로 정해지고 바꾸지 않는다. */
  product: AdvertisementProduct & { position: BannerPosition };
  /** `null` 이면 새 배너다. */
  exposure: AdvertisementExposure | null;
  /**
   * 새 배너의 연결 계약을 미리 채운다. 광고 계약 상세에서 열 때 그 계약이다. 계약이 있는 광고라 `광고` 표시도 켠 채로 시작한다.
   * 모달 안에서 바꿀 수 있다.
   */
  initialContract?: { id: number; companyName: string };
  onClose: () => void;
  /** 같은 계약·상품의 배너가 여럿일 때 수정 모달 안에서 고른다(광고 공고 모달과 같다). */
  siblings?: AdvertisementExposure[];
  onSwitch?: (exposure: AdvertisementExposure) => void;
}

/** `datetime-local` 값(`YYYY-MM-DDTHH:mm`)과 서버 값(`YYYY-MM-DDTHH:mm:ss`, KST)을 오간다. 브라우저 시간대는 보지 않는다. */
const toInputValue = (value: string | null | undefined) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

interface FormState {
  name: string;
  imageUrl: string;
  /** 빈 문자열이면 모바일에서도 `imageUrl` 을 쓴다. */
  mobileImageUrl: string;
  linkUrl: string;
  adLabel: boolean;
  startAt: string;
  endAt: string;
  exposed: boolean;
  contractId: number | null;
}

function initialState(
  exposure: AdvertisementExposure | null,
  initialContractId: number | null,
): FormState {
  return {
    name: exposure?.name ?? '',
    imageUrl: exposure?.imageUrl ?? '',
    mobileImageUrl: exposure?.mobileImageUrl ?? '',
    linkUrl: exposure?.linkUrl ?? '',
    adLabel: exposure?.adLabel ?? initialContractId !== null,
    startAt: toInputValue(exposure?.startAt),
    endAt: toInputValue(exposure?.endAt),
    // 새 배너는 켠 채로 시작한다. 기간을 정해 두면 그 사이에만 보인다.
    exposed: exposure?.exposed ?? true,
    contractId: exposure ? (exposure.contractId ?? null) : initialContractId,
  };
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = '이름을 입력해 주세요.';
  else if (name.length > NAME_MAX_LENGTH)
    errors.name = `이름은 ${NAME_MAX_LENGTH}자까지 쓸 수 있어요.`;
  if (!form.imageUrl) errors.imageUrl = '이미지를 올려 주세요.';
  const linkUrl = form.linkUrl.trim();
  if (!linkUrl) errors.linkUrl = '링크를 입력해 주세요.';
  else if (!isLinkUrl(linkUrl))
    errors.linkUrl = 'http:// 또는 https:// 로 시작하는 주소나 / 로 시작하는 경로를 입력해 주세요.';
  // BE 는 기간을 둘 다 넣거나 둘 다 비우게 한다(`ADVERTISEMENT_EXPOSURE_PERIOD_INVALID`).
  if (Boolean(form.startAt) !== Boolean(form.endAt))
    errors.endAt = '노출 시작과 끝을 함께 넣거나 둘 다 비워 주세요. 둘 다 비우면 상시예요.';
  else if (form.startAt && form.startAt >= form.endAt)
    errors.endAt = '노출 끝은 시작보다 뒤여야 해요.';
  return errors;
}

/**
 * 배너 노출 등록·수정 모달(BE LC-3583). 자리(상품)는 열 때의 탭으로 정해지고 바꾸지 않는다 — 다른 자리에 쓰려면 새로 등록한다.
 *
 * 수정은 `PUT` 전체 교체라 모든 칸을 다시 보낸다. 켜기는 교체 본문에 칸이 없어 바뀌었을 때만 따로 보낸다. 순서는 수정할 때
 * 한 칸씩 바로 옮긴다. 광고 공고 모달(`widgets/ad-posting-form`)과 같은 모양이다.
 * 검증은 저장을 누른 뒤부터 보인다. 서버가 거절하면 오류 코드에 맞춘 문구를 보인다.
 */
export function BannerFormModal({
  open,
  product,
  exposure,
  initialContract,
  onClose,
  siblings = [],
  onSwitch,
}: BannerFormModalProps) {
  const createMutation = useCreateExposure();
  const replaceMutation = useReplaceExposure(exposure?.id ?? 0);
  const saveMutation = exposure ? replaceMutation : createMutation;
  const toggle = useToggleExposure(exposure?.id ?? 0);
  const move = useMoveExposure();
  // 순서는 자리 전체에서 정해진다. 수정할 때 몇 번째인지 보이고 한 칸씩 옮긴다(광고 공고 모달과 같다).
  const allInProduct = useAdvertisementExposures(exposure ? product.id : null);
  const orderIndex = exposure
    ? (allInProduct.data ?? []).findIndex((row) => row.id === exposure.id)
    : -1;
  const orderTotal = allInProduct.data?.length ?? 0;
  const [form, setForm] = useState<FormState>(() =>
    initialState(exposure, initialContract?.id ?? null),
  );
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form) : {};

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    setSubmitted(true);
    if (Object.keys(validate(form)).length > 0) {
      return;
    }
    const body = {
      contractId: form.contractId,
      name: form.name.trim(),
      imageUrl: form.imageUrl,
      mobileImageUrl: form.mobileImageUrl || null,
      linkUrl: form.linkUrl.trim(),
      targetType: null,
      targetId: null,
      adLabel: form.adLabel,
      startAt: toServerValue(form.startAt),
      endAt: toServerValue(form.endAt),
    };
    if (exposure) {
      replaceMutation.mutate(body, {
        onSuccess: async () => {
          // 켜기는 교체 본문에 칸이 없어 바뀌었을 때만 따로 보낸다.
          if (form.exposed !== exposure.exposed) await toggle.mutateAsync(form.exposed);
          onClose();
        },
      });
    } else {
      createMutation.mutate(
        { ...body, productId: product.id, exposed: form.exposed },
        { onSuccess: onClose },
      );
    }
  };

  const spec = imageSpec(product.position);

  return (
    <Modal
      open={open}
      title={exposure ? '배너 수정' : '새 배너'}
      description={`${product.name} · ${positionLabel(product.position)}`}
      onClose={onClose}
      className="w-[min(44rem,calc(100vw-2rem))]"
    >
      {saveMutation.isError ? (
        <Callout tone="error" className="mb-4">
          {advertisementErrorMessage(
            saveMutation.error,
            '저장하지 못했습니다. 입력값을 확인해 주세요.',
          )}
        </Callout>
      ) : null}

      {exposure && siblings.length > 1 && onSwitch ? (
        <Field
          label="수정할 노출"
          htmlFor="banner-sibling"
          hint={`이 계약·상품의 노출이 ${siblings.length}개예요.`}
        >
          <Select
            id="banner-sibling"
            options={siblings.map((sibling, index) => ({
              value: String(sibling.id),
              label: `${index + 1}. ${sibling.name ?? `노출 #${sibling.id}`}`,
            }))}
            value={String(exposure.id)}
            onChange={(event) => {
              const next = siblings.find((sibling) => String(sibling.id) === event.target.value);
              if (next) onSwitch(next);
            }}
          />
        </Field>
      ) : null}

      <Field
        label="이름"
        htmlFor="banner-name"
        required
        error={errors.name}
        hint="이미지에 적힌 문구를 그대로 적어 주세요. 이미지를 볼 수 없는 사람에게 이 이름을 읽어 줍니다."
      >
        <Input
          id="banner-name"
          value={form.name}
          maxLength={NAME_MAX_LENGTH}
          placeholder="예: 11월 지원일정 관리 홍보"
          onChange={(event) => set('name', event.target.value)}
        />
      </Field>

      {/* 세로 소재(상세 사이드)는 폭을 줄여 미리 본다. 모달 폭 그대로면 화면을 넘는다. */}
      <div className={isSidePosition(product.position) ? 'max-w-56' : undefined}>
        <BannerImageField
          id="banner-image"
          label="이미지"
          sizeHint={`${spec.sizeHint} 모바일 이미지가 없으면 모바일에도 이 이미지를 씁니다.`}
          aspectClassName={spec.aspectClassName}
          value={form.imageUrl}
          onChange={(url) => set('imageUrl', url)}
          error={errors.imageUrl}
        />
      </div>

      <div className="max-w-80">
        <BannerImageField
          id="banner-mobile-image"
          label="모바일 이미지"
          sizeHint="750×200 비율(1500×400 권장). JPG·PNG. 선택입니다."
          aspectClassName="aspect-[750/200]"
          value={form.mobileImageUrl}
          onChange={(url) => set('mobileImageUrl', url)}
          required={false}
        />
      </div>

      <Field
        label="링크"
        htmlFor="banner-link"
        required
        error={errors.linkUrl}
        hint="https:// 로 시작하는 주소는 새 탭, /calendar 처럼 오공고 안의 경로는 같은 탭에서 열립니다."
      >
        <Input
          id="banner-link"
          value={form.linkUrl}
          placeholder="https://"
          onChange={(event) => set('linkUrl', event.target.value)}
        />
      </Field>

      <ContractField
        id="banner-contract"
        value={form.contractId}
        currentCompanyName={
          exposure
            ? (exposure.advertiserCompanyName ?? null)
            : (initialContract?.companyName ?? null)
        }
        onChange={(contractId) => set('contractId', contractId)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="노출 시작(KST)" htmlFor="banner-start" hint="시작·끝을 모두 비우면 상시">
          <Input
            id="banner-start"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => set('startAt', event.target.value)}
          />
        </Field>
        <Field label="노출 끝(KST)" htmlFor="banner-end" error={errors.endAt}>
          <Input
            id="banner-end"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => set('endAt', event.target.value)}
          />
        </Field>
      </div>

      <p className="-mt-2 pb-4 text-xs text-gray-500">
        노출 기간은 광고가 실제로 화면에 보이는 기간이에요. 리포트는 계약 상품의 게시 기간 데이터만
        집계해요.
      </p>

      {exposure && orderIndex >= 0 ? (
        <div className="flex items-center gap-2 pb-4 text-sm text-gray-700">
          <span>
            순서 {orderIndex + 1} / {orderTotal}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={move.isPending || orderIndex === 0}
            onClick={() => move.mutate({ exposureId: exposure.id, direction: 'UP' })}
          >
            위로
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={move.isPending || orderIndex === orderTotal - 1}
            onClick={() => move.mutate({ exposureId: exposure.id, direction: 'DOWN' })}
          >
            아래로
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.exposed}
            onChange={(event) => set('exposed', event.target.checked)}
          />
          켜기
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.adLabel}
            onChange={(event) => set('adLabel', event.target.checked)}
          />
          광고 표시(AD 딱지를 붙인다)
        </label>
      </div>

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
