import { useState } from 'react';
import type { CreateAdminAdvertisementExposureRequest } from '@ogonggo/api/src/admin';
import { Button, Callout, Field, Input, Modal, Select } from '@ogonggo/ui';
import {
  useAdvertisementExposures,
  useCreateExposure,
  useMoveExposure,
  useReplaceExposure,
  useToggleExposure,
} from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import {
  AD_POSTING_ALL_TAB,
  AD_POSTING_FIXED_TARGET,
  AD_POSTING_TAB_OPTIONS,
  jobFieldLabel,
  jobFieldOfTab,
  needsJobField,
  needsRecommendation,
  tabOf,
  type AdPostingExposure,
  type AdPostingPosition,
} from '@/entities/advertisement-exposure/lib/adPosting';
import type { AdvertisementProduct } from '@/entities/advertisement-product/api/useAdvertisementProducts';
import { positionLabel } from '@/entities/advertisement-product/lib/product';
import { isRecommendationValid } from '@/features/today-job/lib/validate';
import { RecommendationFields } from '@/features/today-job/ui/RecommendationFields';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { ContractField } from '@/widgets/banner-form';
import {
  ContentTargetPicker,
  QuickTargetPicks,
  targetKey,
  type ContentTarget,
} from '@/widgets/content-target-picker';

interface AdPostingFormModalProps {
  /** 노출을 거는 광고 공고 상품(자리). 열 때의 탭으로 정해지고 바꾸지 않는다. */
  product: AdvertisementProduct;
  /** 자리가 없는 광고 공고 상품(`비즈니스 공고 등록`)이면 `null`. 노출은 걸리지만 웹 목록에 나오지 않는다. */
  position: AdPostingPosition | null;
  /** `null` 이면 새 광고 공고다. */
  exposure: AdPostingExposure | null;
  /**
   * 이 자리(상품)에 이미 건 노출. 같은 자리에 같은 공고를 두 번 걸 수 없다(BE 409). 리스트 상단 고정은 같은 탭(`전체`
   * 또는 직무) 안에서만 막는다 — 다른 탭이면 같은 공고를 또 걸 수 있다(계약 8·10절).
   */
  taken: AdPostingExposure[];
  onClose: () => void;
  /** 새 광고 공고의 연결 계약을 미리 채운다(계약 상세에서 열 때). */
  initialContract?: { id: number; companyName: string };
  /** 새 광고 공고의 대상을 미리 채운다(계약의 광고할 공고). 바꿀 수 있다. */
  initialTarget?: ContentTarget | null;
  /**
   * 검색 없이 바로 고를 대상(계약 상세에서 열 때 그 계약의 광고할 공고). 이 자리에 걸 수 있는 종류만 검색 위에 보인다.
   */
  quickTargets?: ContentTarget[];
  /** 새 광고 공고의 노출 기간(`datetime-local` 값). 계약 상품 기간이다. */
  initialPeriod?: { startAt: string; endAt: string };
  /**
   * 넘기면 새 광고 공고에 `광고할 공고로 등록` 체크(기본 켬)가 나오고, 저장한 뒤 그 대상을 계약의 광고할 공고로 연결한다.
   * 계약 상세에서 열 때만 넘긴다.
   */
  onRegisterTarget?: (target: ContentTarget) => Promise<void>;
  /** 같은 계약·상품의 노출이 여럿일 때 수정 모달 안에서 고른다. */
  siblings?: AdPostingExposure[];
  onSwitch?: (exposure: AdPostingExposure) => void;
}

/** 탭 이름. `전체` 탭 값은 직무가 없는 것과 같다. */
const tabName = (tab: string) => jobFieldLabel(jobFieldOfTab(tab));

/** `datetime-local` 값과 서버 값(KST, 초까지)을 오간다. 배너 모달과 같다. */
const toInputValue = (value: string | null | undefined) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

function targetOf(exposure: AdPostingExposure | null): ContentTarget | null {
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
 * 리스트 상단 고정은 새로 걸 때 `전체` 와 직무 탭을 여럿 골라, 고른 탭마다 노출을 하나씩 차례로 만든다(계약 10절). 일부
 * 탭만 실패하면 만든 노출은 두고 실패한 탭만 남겨 알린다 — 다시 저장하면 남은 탭만 만든다. 고칠 때는 탭 하나다.
 *
 * 수정은 `PUT` 전체 교체라 모든 칸을 다시 보낸다. 켜기는 교체 본문에 칸이 없어 바뀌었을 때만 따로 보낸다. 순서는 수정할 때
 * 한 칸씩 바로 옮긴다(배너 세팅의 위로·아래로와 같다).
 */
export function AdPostingFormModal({
  product,
  position,
  exposure,
  taken,
  onClose,
  initialContract,
  initialTarget,
  quickTargets = [],
  initialPeriod,
  onRegisterTarget,
  siblings = [],
  onSwitch,
}: AdPostingFormModalProps) {
  const createMutation = useCreateExposure();
  const replaceMutation = useReplaceExposure(exposure?.id ?? 0);
  const toggle = useToggleExposure(exposure?.id ?? 0);
  const move = useMoveExposure();
  // 순서는 자리 전체에서 정해진다. 수정할 때 몇 번째인지 보이고 한 칸씩 옮긴다.
  const allInProduct = useAdvertisementExposures(exposure ? product.id : null);
  const orderIndex = exposure
    ? (allInProduct.data ?? []).findIndex((row) => row.id === exposure.id)
    : -1;
  const orderTotal = allInProduct.data?.length ?? 0;
  const [target, setTarget] = useState<ContentTarget | null>(() =>
    exposure ? targetOf(exposure) : (initialTarget ?? null),
  );
  const [contractId, setContractId] = useState<number | null>(
    exposure ? (exposure.contractId ?? null) : (initialContract?.id ?? null),
  );
  const [startAt, setStartAt] = useState(
    exposure ? toInputValue(exposure.startAt) : (initialPeriod?.startAt ?? ''),
  );
  const [endAt, setEndAt] = useState(
    exposure ? toInputValue(exposure.endAt) : (initialPeriod?.endAt ?? ''),
  );
  const [registerTarget, setRegisterTarget] = useState(true);
  const [registerError, setRegisterError] = useState<string | null>(null);
  // 광고 공고는 돈을 받고 싣는 자리라 광고 표시를 켠 채로 시작한다.
  const [adLabel, setAdLabel] = useState(exposure?.adLabel ?? true);
  const [exposed, setExposed] = useState(exposure?.exposed ?? true);
  const withJobField = needsJobField(position);
  // 고칠 때의 탭 하나. `jobField` 가 없는 노출은 `전체` 탭이다.
  const [jobField, setJobField] = useState(tabOf(exposure?.jobField));
  // 새로 걸 때 고른 탭들. 고른 탭마다 노출을 하나씩 만든다.
  const [tabs, setTabs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // 일부 탭만 실패해 다시 저장할 때 광고할 공고 연결을 또 부르지 않는다.
  const [registered, setRegistered] = useState(false);
  // 오공고 PICK 은 운영자 PICK 처럼 추천 문구 두 칸이 있어야 한다(계약 9절). 입력칸·글자 수·검사는 운영자 PICK 것 그대로다.
  const withRecommendation = needsRecommendation(position);
  const [recommendation, setRecommendation] = useState({
    title: exposure?.recommendationTitle ?? '',
    description: exposure?.recommendationDescription ?? '',
  });
  const [submitted, setSubmitted] = useState(false);

  // 수정 중인 노출 자신은 빼고, 리스트 상단 고정이면 고른 탭의 노출만 본다. 새로 걸 때는 고른 탭 중 하나라도 이미 그
  // 공고가 있으면 막는다 — 그 탭은 409 로 실패한다.
  const chosenTabs = exposure ? [jobField] : tabs;
  const fixedType = position ? AD_POSTING_FIXED_TARGET[position] : undefined;
  const blocked = new Set(
    taken.flatMap((row) =>
      row.id !== exposure?.id &&
      row.targetType &&
      row.targetId != null &&
      (!withJobField || chosenTabs.includes(tabOf(row.jobField)))
        ? [targetKey({ targetType: row.targetType, targetId: row.targetId })]
        : [],
    ),
  );

  const errors = submitted
    ? {
        target: target ? undefined : '띄울 공고를 골라 주세요.',
        jobField:
          withJobField && !exposure && tabs.length === 0
            ? '띄울 탭을 하나 이상 골라 주세요.'
            : undefined,
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
    if (
      !target ||
      (withJobField && !exposure && tabs.length === 0) ||
      (withRecommendation && !isRecommendationValid(recommendation)) ||
      Boolean(startAt) !== Boolean(endAt) ||
      (startAt && startAt >= endAt)
    )
      return;
    const body = {
      contractId,
      name: null,
      imageUrl: null,
      mobileImageUrl: null,
      linkUrl: null,
      targetType: target.targetType,
      targetId: target.targetId,
      // 리스트 상단 고정 노출의 직무(계약 8·10절). `전체` 탭이면 비운다. 새로 걸 때는 아래에서 탭마다 채운다.
      jobField: withJobField && exposure ? jobFieldOfTab(jobField) : undefined,
      recommendationTitle: withRecommendation ? recommendation.title.trim() : null,
      recommendationDescription: withRecommendation ? recommendation.description.trim() : null,
      adLabel,
      startAt: toServerValue(startAt),
      endAt: toServerValue(endAt),
    };
    if (exposure) {
      replaceMutation.mutate(body, {
        onSuccess: async () => {
          // 켜기는 교체 본문에 칸이 없어 바뀌었을 때만 따로 보낸다.
          if (exposed !== exposure.exposed) await toggle.mutateAsync(exposed);
          onClose();
        },
      });
    } else {
      void createAll(body, target);
    }
  };

  // 새 노출. 리스트 상단 고정은 고른 탭마다 하나씩 차례로 만들고, 다른 자리는 하나다.
  const createAll = async (
    body: Omit<CreateAdminAdvertisementExposureRequest, 'productId' | 'exposed'>,
    picked: ContentTarget,
  ) => {
    setCreating(true);
    setCreateError(null);
    const failed: { tab: string; message: string }[] = [];
    let createdAny = false;
    for (const tab of withJobField ? tabs : [AD_POSTING_ALL_TAB]) {
      try {
        await createMutation.mutateAsync({
          ...body,
          jobField: withJobField ? jobFieldOfTab(tab) : undefined,
          productId: product.id,
          exposed,
        });
        createdAny = true;
      } catch (failure) {
        failed.push({
          tab,
          message: advertisementErrorMessage(
            failure,
            '저장하지 못했습니다. 입력값을 확인해 주세요.',
          ),
        });
      }
    }
    setCreating(false);
    if (failed.length > 0) {
      // 만든 탭은 고르기에서 빼, 다시 저장하면 실패한 탭만 만든다.
      setTabs(failed.map(({ tab }) => tab));
      setCreateError(
        withJobField
          ? `${createdAny ? '나머지 탭은 걸었지만 ' : ''}${failed
              .map(({ tab, message }) => `${tabName(tab)} 탭은 걸지 못했어요(${message})`)
              .join(' ')}`
          : (failed[0]?.message ?? null),
      );
    }
    if (!createdAny) return;
    if (onRegisterTarget && registerTarget && !registered) {
      try {
        await onRegisterTarget(picked);
        setRegistered(true);
      } catch (failure) {
        // 노출은 저장됐다. 연결만 실패했다고 알리고 모달은 닫지 않는다.
        setRegisterError(advertisementErrorMessage(failure, '광고할 공고로 연결하지 못했어요.'));
        return;
      }
    }
    if (failed.length === 0) onClose();
  };

  const saveError = exposure
    ? replaceMutation.isError
      ? advertisementErrorMessage(
          replaceMutation.error,
          '저장하지 못했습니다. 입력값을 확인해 주세요.',
        )
      : null
    : createError;
  const saving = exposure ? replaceMutation.isPending : creating;

  return (
    <Modal
      open
      title={exposure ? '광고 공고 수정' : '새 광고 공고'}
      description={position ? `${product.name} · ${positionLabel(position)}` : product.name}
      onClose={onClose}
      className="w-[min(56rem,calc(100vw-2rem))]"
    >
      {saveError ? (
        <Callout tone="error" className="mb-4">
          {saveError}
        </Callout>
      ) : null}
      {position === null ? (
        <Callout tone="info" className="mb-4">
          이 상품에는 노출 자리가 없어 웹 목록에는 나오지 않아요. 광고 상품에서 자리를 정하면 그
          자리에 나와요.
        </Callout>
      ) : null}
      {registerError ? (
        <Callout tone="error" className="mb-4">
          광고 공고는 저장했지만 {registerError} 계약 정보의 광고할 공고에서 다시 연결해 주세요.
        </Callout>
      ) : null}

      {exposure && siblings.length > 1 && onSwitch ? (
        <Field
          label="수정할 노출"
          htmlFor="ad-posting-sibling"
          hint={`이 계약·상품의 노출이 ${siblings.length}개예요.`}
        >
          <Select
            id="ad-posting-sibling"
            options={siblings.map((sibling, index) => ({
              value: String(sibling.id),
              label: `${index + 1}. ${sibling.targetTitle ?? `${sibling.targetId}번`}`,
            }))}
            value={String(exposure.id)}
            onChange={(event) => {
              const next = siblings.find((sibling) => String(sibling.id) === event.target.value);
              if (next) onSwitch(next);
            }}
          />
        </Field>
      ) : null}

      {withJobField && exposure ? (
        <Field
          label="탭"
          htmlFor="ad-posting-job-field"
          required
          hint="웹 채용공고 목록의 이 탭 1페이지 맨 위에 나가요. 탭당 한 칸이에요."
        >
          <Select
            id="ad-posting-job-field"
            options={AD_POSTING_TAB_OPTIONS}
            value={jobField}
            onChange={(event) => setJobField(event.target.value)}
          />
        </Field>
      ) : null}
      {withJobField && !exposure ? (
        <Field
          label="탭"
          required
          error={errors.jobField}
          hint="고른 탭마다 웹 채용공고 목록 1페이지 맨 위에 나가요. 탭마다 노출이 하나씩 생겨요."
        >
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {AD_POSTING_TAB_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={tabs.includes(option.value)}
                  onChange={(event) =>
                    setTabs((current) =>
                      event.target.checked
                        ? AD_POSTING_TAB_OPTIONS.map(({ value }) => value).filter(
                            (value) => value === option.value || current.includes(value),
                          )
                        : current.filter((value) => value !== option.value),
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </Field>
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
          <div className="flex flex-col gap-3">
            <QuickTargetPicks
              targets={quickTargets.filter(
                (candidate) => !fixedType || candidate.targetType === fixedType,
              )}
              takenKeys={blocked}
              onPick={setTarget}
            />
            <ContentTargetPicker takenKeys={blocked} fixedType={fixedType} onPick={setTarget} />
          </div>
        )}
      </Field>

      {withRecommendation ? (
        <Field
          label="추천 문구"
          required
          hint="웹 오공고 PICK 카드 아래 상자에 운영자 PICK 과 같은 모양으로 나가요."
        >
          <RecommendationFields
            idPrefix="ad-posting"
            value={recommendation}
            onChange={setRecommendation}
          />
        </Field>
      ) : null}

      <ContractField
        id="ad-posting-contract"
        value={contractId}
        currentCompanyName={
          exposure
            ? (exposure.advertiserCompanyName ?? null)
            : (initialContract?.companyName ?? null)
        }
        onChange={setContractId}
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
            checked={exposed}
            onChange={(event) => setExposed(event.target.checked)}
          />
          켜기
        </label>
        {!exposure && onRegisterTarget ? (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={registerTarget}
              onChange={(event) => setRegisterTarget(event.target.checked)}
            />
            광고할 공고로 등록(계약 정보의 광고할 공고에 들어가요)
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={adLabel}
            onChange={(event) => setAdLabel(event.target.checked)}
          />
          광고 표시(AD 딱지를 붙인다)
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}
