import { useState } from 'react';
import { Button, Callout, Field, Input, Modal } from '@ogonggo/ui';
import {
  useCreateExposure,
  useReplaceExposure,
} from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import {
  AD_POSTING_FIXED_TARGET,
  AD_POSTING_POSITION_LABELS,
  type AdPostingExposure,
  type AdPostingPosition,
} from '@/entities/advertisement-exposure/lib/adPosting';
import type { AdvertisementProduct } from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { ContractField } from '@/widgets/banner-form';
import {
  ContentTargetPicker,
  targetKey,
  type ContentTarget,
} from '@/widgets/content-target-picker';

interface AdPostingFormModalProps {
  /** 노출을 거는 광고 공고 상품(자리). 열 때의 탭으로 정해지고 바꾸지 않는다. */
  product: AdvertisementProduct;
  position: AdPostingPosition;
  /** `null` 이면 새 광고 공고다. */
  exposure: AdPostingExposure | null;
  /** 이 자리에 이미 건 대상(`targetKey`). 같은 자리에 같은 공고를 두 번 걸 수 없다(BE 409). */
  takenKeys: Set<string>;
  onClose: () => void;
}

/** `datetime-local` 값과 서버 값(KST, 초까지)을 오간다. 배너 모달과 같다. */
const toInputValue = (value: string | null | undefined) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

function initialTarget(exposure: AdPostingExposure | null): ContentTarget | null {
  if (!exposure?.targetType || exposure.targetId == null) return null;
  return {
    targetType: exposure.targetType,
    targetId: exposure.targetId,
    title: exposure.targetTitle ?? `${exposure.targetId}번`,
    companyName: exposure.targetCompanyName ?? '',
  };
}

/**
 * 광고 공고 등록·수정 모달(PRD 6.8). 배너 모달(`widgets/banner-form`)과 같은 모양이고, 이미지·링크 대신 띄울 공고·부트캠프를
 * 검색해 고른다. 카드는 웹이 대상 요약으로 그린다.
 *
 * 수정은 `PUT` 전체 교체라 모든 칸을 다시 보낸다. 켜짐은 표의 스위치로만 바꾼다.
 */
export function AdPostingFormModal({
  product,
  position,
  exposure,
  takenKeys,
  onClose,
}: AdPostingFormModalProps) {
  const createMutation = useCreateExposure();
  const replaceMutation = useReplaceExposure(exposure?.id ?? 0);
  const saveMutation = exposure ? replaceMutation : createMutation;
  const [target, setTarget] = useState<ContentTarget | null>(() => initialTarget(exposure));
  const [contractId, setContractId] = useState<number | null>(exposure?.contractId ?? null);
  const [startAt, setStartAt] = useState(toInputValue(exposure?.startAt));
  const [endAt, setEndAt] = useState(toInputValue(exposure?.endAt));
  // 광고 공고는 돈을 받고 싣는 자리라 광고 표시를 켠 채로 시작한다.
  const [adLabel, setAdLabel] = useState(exposure?.adLabel ?? true);
  const [exposed, setExposed] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // 수정 중인 노출 자신의 대상은 다시 골라도 된다.
  const ownKey = exposure ? initialTarget(exposure) : null;
  const blocked = new Set([...takenKeys].filter((key) => !ownKey || key !== targetKey(ownKey)));

  const errors = submitted
    ? {
        target: target ? undefined : '띄울 공고를 골라 주세요.',
        endAt:
          Boolean(startAt) !== Boolean(endAt)
            ? '노출 시작과 끝을 함께 넣거나 둘 다 비워 주세요. 둘 다 비우면 상시예요.'
            : startAt && startAt >= endAt
              ? '노출 끝은 시작보다 뒤여야 해요.'
              : undefined,
      }
    : {};

  const save = () => {
    setSubmitted(true);
    if (!target || Boolean(startAt) !== Boolean(endAt) || (startAt && startAt >= endAt)) return;
    const body = {
      contractId,
      name: null,
      imageUrl: null,
      mobileImageUrl: null,
      linkUrl: null,
      targetType: target.targetType,
      targetId: target.targetId,
      adLabel,
      startAt: toServerValue(startAt),
      endAt: toServerValue(endAt),
    };
    if (exposure) {
      replaceMutation.mutate(body, { onSuccess: onClose });
    } else {
      createMutation.mutate({ ...body, productId: product.id, exposed }, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      open
      title={exposure ? '광고 공고 수정' : '새 광고 공고'}
      description={`${product.name} · ${AD_POSTING_POSITION_LABELS[position]} 자리`}
      onClose={onClose}
      className="w-[min(56rem,calc(100vw-2rem))]"
    >
      {saveMutation.isError ? (
        <Callout tone="error" className="mb-4">
          {advertisementErrorMessage(
            saveMutation.error,
            '저장하지 못했습니다. 입력값을 확인해 주세요.',
          )}
        </Callout>
      ) : null}

      <Field label="띄울 공고" required error={errors.target}>
        {target ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-gray-900">
                {target.title}
              </span>
              <span className="block text-xs text-gray-500">
                {target.targetType === 'BOOTCAMP' ? '부트캠프' : '채용공고'}
                {target.companyName ? ` · ${target.companyName}` : ''} · {target.targetId}번
              </span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => setTarget(null)}>
              바꾸기
            </Button>
          </div>
        ) : (
          <ContentTargetPicker
            takenKeys={blocked}
            fixedType={AD_POSTING_FIXED_TARGET[position]}
            onPick={setTarget}
          />
        )}
      </Field>

      <ContractField
        id="ad-posting-contract"
        value={contractId}
        currentCompanyName={exposure?.advertiserCompanyName ?? null}
        onChange={setContractId}
        hint="돈을 받고 싣는 광고 공고는 그 광고 계약을 고릅니다. 계약 리포트의 광고 카드 숫자가 이 연결로 모입니다."
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="노출 시작(KST)" htmlFor="ad-posting-start" hint="시작·끝을 모두 비우면 상시">
          <Input
            id="ad-posting-start"
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
          />
        </Field>
        <Field label="노출 끝(KST)" htmlFor="ad-posting-end" error={errors.endAt}>
          <Input
            id="ad-posting-end"
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4">
        {exposure ? null : (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={exposed}
              onChange={(event) => setExposed(event.target.checked)}
            />
            켜기
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={adLabel}
            onChange={(event) => setAdLabel(event.target.checked)}
          />
          광고 표시(카드에 광고 딱지를 붙인다)
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
