import { useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Callout, Checkbox, Field, Input, Modal, Select } from '@ogonggo/ui';
import { AD_CONTRACT_PRODUCTS, type AdContractProduct } from '@ogonggo/api/src/ad-contracts';
import {
  ADMIN_AD_POSTINGS_PATH,
  type AdPostingPlacement,
  type CreateAdminAdPostingRequest,
} from '@ogonggo/api/src/ad-postings';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import {
  ADMIN_BANNERS_PATH,
  type AdminBannerRequest,
  type BannerPlacement,
  isSideBannerPlacement,
} from '@ogonggo/api/src/banners';
import type { AdContract } from '@/entities/ad-contract/api/useAdContracts';
import { adContractName } from '@/entities/ad-contract/lib/adContract';
import type { AdPosting } from '@/entities/ad-posting/api/useAdPostings';
import { AD_PLACEMENT_LABELS } from '@/entities/ad-posting/lib/adPosting';
import {
  PC_IMAGE_SPECS,
  bannerPresets,
  formatPeriod,
  isLinkUrl,
} from '@/entities/banner/lib/banner';
import {
  adContractProductLabel,
  formatContractPeriod,
} from '@/features/ad-contract-picker/lib/adContractProduct';
import { adminGet, adminWrite } from '@/shared/api/adminClient';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { TargetPicker, type AdTarget } from '@/widgets/ad-posting-form';
import { BannerImageField } from '@/widgets/banner-form';

const NAME_MAX_LENGTH = 50;
const ALT_TEXT_MAX_LENGTH = 100;

/** 처음에 무엇을 체크해 둘지. 계약 행에서 열면 계약 상품 전부, 배너·광고 공고 칸에서 열면 그 종류만. */
export type BulkAdKind = 'ALL' | 'BANNER' | 'AD_POSTING';

const toInputValue = (value: string | null | undefined) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

const isBanner = (product: AdContractProduct) => product.startsWith('BANNER_');
const bannerPlacementOf = (product: AdContractProduct) =>
  product.slice('BANNER_'.length) as BannerPlacement;
const adPlacementOf = (product: AdContractProduct) =>
  product.slice('AD_POSTING_'.length) as AdPostingPlacement;

function initialChecks(contract: AdContract | null, kind: BulkAdKind): AdContractProduct[] {
  return (contract?.products ?? []).filter(
    (product) => kind === 'ALL' || (kind === 'BANNER') === isBanner(product),
  );
}

interface PlanItem {
  product: AdContractProduct;
  detail: string;
  /** 만들지 않고 건너뛰는 이유. 같은 자리에 같은 대상이 이미 있으면 서버가 거절한다. */
  skip?: string;
  run?: () => Promise<unknown>;
}

interface ResultItem {
  product: AdContractProduct;
  ok: boolean;
  message: string;
}

/**
 * 광고 한 번에 추가(이슈 #573, 2026-11-06 사용자). 광고 계약 상세에서 자리를 여러 개 체크하고, 배너 소재와 광고할 공고를
 * 한 번만 정해 자리마다 하나씩 만든다. 계약을 고르면 그 계약의 상품(자리)과 기간으로 채우고, 모두 고칠 수 있다.
 *
 * 순서: 입력 → 무엇이 만들어지는지 확인 → 만들기(자리마다 따로 보내고 성공·실패를 줄마다 보인다). 하나가 실패해도 나머지는
 * 만든다 — 자리별 API 가 따로라 한꺼번에 되돌릴 수 없다.
 */
export function BulkAdModal({
  advertiser,
  contracts,
  initialContract,
  kind,
  onClose,
  onDone,
}: {
  advertiser: AdvertiserSummary;
  contracts: AdContract[];
  initialContract: AdContract | null;
  kind: BulkAdKind;
  onClose: () => void;
  /** 다 만든 뒤 화면에 띄울 문구. */
  onDone: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [contract, setContract] = useState<AdContract | null>(initialContract);
  const [checked, setChecked] = useState<AdContractProduct[]>(() =>
    initialChecks(initialContract, kind),
  );
  const [startAt, setStartAt] = useState(toInputValue(initialContract?.startAt));
  const [endAt, setEndAt] = useState(toInputValue(initialContract?.endAt));
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState(initialContract?.name ?? '');
  const [altText, setAltText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [showAdLabel, setShowAdLabel] = useState(true);
  const [pcWide, setPcWide] = useState('');
  const [pcSide, setPcSide] = useState('');
  const [mobile, setMobile] = useState('');
  const [jobTarget, setJobTarget] = useState<AdTarget | null>(null);
  const [bootcampTarget, setBootcampTarget] = useState<AdTarget | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const banners = checked.filter(isBanner).map(bannerPlacementOf);
  const ads = checked.filter((product) => !isBanner(product)).map(adPlacementOf);
  const needsWide = banners.some((placement) => !isSideBannerPlacement(placement));
  const needsSide = banners.some(isSideBannerPlacement);
  const needsJob = ads.some((placement) => placement !== 'BOOTCAMP_LIST');
  const needsBootcamp = ads.includes('BOOTCAMP_LIST');

  // 체크한 광고 공고 자리에 이미 든 대상을 알아야 확인 단계에서 건너뛸 줄을 보인다. 키는 자리별 목록과 같다.
  const adLists = useQueries({
    queries: ads.map((placement) => ({
      queryKey: ['admin', 'ad-postings', placement],
      queryFn: () => adminGet<AdPosting[]>(ADMIN_AD_POSTINGS_PATH, { placement }),
    })),
  });

  const allErrors: Record<string, string | undefined> = {
    checked: checked.length === 0 ? '만들 자리를 하나 이상 체크해 주세요.' : undefined,
    endAt: startAt && endAt && startAt >= endAt ? '노출 끝은 시작보다 뒤여야 해요.' : undefined,
    name: banners.length > 0 && !name.trim() ? '배너 이름을 입력해 주세요.' : undefined,
    altText: banners.length > 0 && !altText.trim() ? '배너 문구를 입력해 주세요.' : undefined,
    linkUrl:
      banners.length > 0 && !isLinkUrl(linkUrl.trim())
        ? 'http:// 또는 https:// 로 시작하는 주소나 / 로 시작하는 경로를 입력해 주세요.'
        : undefined,
    pcWide:
      needsWide && !pcWide ? '목록 위·아래 자리 PC 이미지(1200×120)를 올려 주세요.' : undefined,
    pcSide: needsSide && !pcSide ? '상세 사이드 자리 PC 이미지(400×500)를 올려 주세요.' : undefined,
    mobile:
      needsSide && !mobile ? '상세 사이드 배너는 모바일 이미지(750×200)가 있어야 해요.' : undefined,
    jobTarget: needsJob && !jobTarget ? '광고할 채용공고를 골라 주세요.' : undefined,
    bootcampTarget: needsBootcamp && !bootcampTarget ? '광고할 부트캠프를 골라 주세요.' : undefined,
  };
  const hasErrors = Object.values(allErrors).some(Boolean);
  // 검증 문구는 `다음` 을 누른 뒤부터 보인다(배너 모달과 같다).
  const errors = submitted ? allErrors : {};

  const period = { startAt: toServerValue(startAt), endAt: toServerValue(endAt) };

  const plan: PlanItem[] = checked.map((product): PlanItem => {
    if (isBanner(product)) {
      const placement = bannerPlacementOf(product);
      const body: AdminBannerRequest = {
        placement,
        name: name.trim(),
        pcImageUrl: isSideBannerPlacement(placement) ? pcSide : pcWide,
        mobileImageUrl: mobile || null,
        linkUrl: linkUrl.trim(),
        openInNewTab,
        altText: altText.trim(),
        showAdLabel,
        ...period,
        enabled,
        advertiserId: advertiser.id,
        contractId: contract?.id ?? null,
      };
      return {
        product,
        detail: `${name.trim()} · ${linkUrl.trim()}`,
        run: () => adminWrite('POST', ADMIN_BANNERS_PATH, body),
      };
    }
    const placement = adPlacementOf(product);
    const target = placement === 'BOOTCAMP_LIST' ? bootcampTarget : jobTarget;
    const index = ads.indexOf(placement);
    const taken = adLists[index]?.data?.some((row) => row.targetId === target?.id) ?? false;
    const body: CreateAdminAdPostingRequest = {
      placement,
      targetId: target?.id ?? 0,
      advertiserId: advertiser.id,
      contractId: contract?.id ?? null,
      ...period,
      enabled,
    };
    return {
      product,
      detail: target ? `${target.title} · ${target.companyName}` : '',
      skip: taken ? '이 자리에 이미 든 대상이라 건너뜁니다.' : undefined,
      run: taken ? undefined : () => adminWrite('POST', ADMIN_AD_POSTINGS_PATH, body),
    };
  });

  const create = useMutation({
    mutationFn: async () => {
      const done: ResultItem[] = [];
      for (const item of plan) {
        if (!item.run) {
          done.push({ product: item.product, ok: false, message: item.skip ?? '건너뜀' });
          continue;
        }
        try {
          await item.run();
          done.push({ product: item.product, ok: true, message: '만듦' });
        } catch (error) {
          done.push({
            product: item.product,
            ok: false,
            message: serverErrorMessage(error) ?? '만들지 못했습니다.',
          });
        }
      }
      return done;
    },
    onSuccess: async (done) => {
      setResults(done);
      setStep('done');
      await Promise.all(
        [
          ['admin', 'banners'],
          ['admin', 'ad-postings'],
          ['admin', 'advertisers'],
        ].map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );
      const okCount = done.filter((item) => item.ok).length;
      onDone(
        okCount === done.length
          ? `광고 ${okCount}건을 만들었습니다.`
          : `광고 ${okCount}건을 만들고 ${done.length - okCount}건은 만들지 못했습니다.`,
      );
    },
  });

  const pickContract = (next: AdContract | null) => {
    setContract(next);
    if (next) {
      setChecked(initialChecks(next, kind));
      setStartAt(toInputValue(next.startAt));
      setEndAt(toInputValue(next.endAt));
      if (!name.trim() && next.name) {
        setName(next.name);
      }
    }
  };

  const toggle = (product: AdContractProduct, on: boolean) =>
    setChecked((current) =>
      AD_CONTRACT_PRODUCTS.filter((item) => (item === product ? on : current.includes(item))),
    );

  const group = (title: string, banner: boolean) => (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-gray-500">{title}</span>
      {AD_CONTRACT_PRODUCTS.filter((product) => isBanner(product) === banner).map((product) => (
        <Checkbox
          key={product}
          checked={checked.includes(product)}
          onChange={(on) => toggle(product, on)}
          label={
            <span>
              {adContractProductLabel(product).replace(/^(배너|광고 공고) /, '')}
              {contract?.products.includes(product) ? (
                <span className="text-xs text-blue-500"> 계약 상품</span>
              ) : null}
            </span>
          }
          labelClassName="text-sm text-gray-700"
        />
      ))}
    </div>
  );

  if (step === 'done') {
    return (
      <Modal open title="광고 한 번에 추가" description="만든 결과" onClose={onClose}>
        <ResultList items={results} />
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </Modal>
    );
  }

  if (step === 'confirm') {
    return (
      <Modal
        open
        title="광고 한 번에 추가"
        description="아래 광고를 만듭니다. 맞는지 확인해 주세요."
        onClose={onClose}
        className="w-[min(44rem,calc(100vw-2rem))]"
      >
        <p className="pb-3 text-sm text-gray-700">
          광고주 {advertiser.name} · 계약 {contract ? adContractName(contract) : '없음'} · 노출{' '}
          {formatPeriod(period)} · {enabled ? '켜기' : '꺼 둠'}
        </p>
        <ul
          className="divide-y divide-gray-100 rounded-md border border-gray-200"
          aria-label="만들 광고"
        >
          {plan.map((item) => (
            <li key={item.product} className="flex items-start justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">
                  {adContractProductLabel(item.product)}
                </span>
                <span className="block truncate text-xs text-gray-500">{item.detail}</span>
              </span>
              {item.skip ? (
                <Badge tone="urgent" className="shrink-0">
                  건너뜀
                </Badge>
              ) : (
                <Badge tone="main" className="shrink-0">
                  만듦
                </Badge>
              )}
            </li>
          ))}
        </ul>
        {plan.some((item) => item.skip) ? (
          <p className="pt-2 text-xs text-gray-500">
            건너뛰는 줄은 그 자리에 같은 공고가 이미 있어서입니다.
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setStep('form')}>
            고치기
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || plan.every((item) => !item.run)}
          >
            {create.isPending ? '만드는 중' : `${plan.filter((item) => item.run).length}건 만들기`}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      title="광고 한 번에 추가"
      description={`${advertiser.name}. 자리를 여러 개 체크하면 자리마다 하나씩 만듭니다.`}
      onClose={onClose}
      className="w-[min(52rem,calc(100vw-2rem))]"
    >
      <Field
        label="계약"
        htmlFor="bulk-contract"
        hint="고르면 계약 상품(자리)과 기간으로 채웁니다. 채운 뒤에도 고칠 수 있습니다."
      >
        <Select
          id="bulk-contract"
          options={[
            { value: '', label: '계약 없음' },
            ...contracts.map((item) => ({
              value: String(item.id),
              label: `${adContractName(item)} · ${formatContractPeriod(item)}`,
            })),
          ]}
          value={contract ? String(contract.id) : ''}
          onChange={(event) =>
            pickContract(contracts.find((item) => String(item.id) === event.target.value) ?? null)
          }
        />
      </Field>

      <Field label="광고 자리 선택" required error={errors.checked}>
        <div className="grid grid-cols-2 gap-4 rounded-md border border-gray-200 p-3">
          {group('배너', true)}
          {group('광고 공고', false)}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="노출 시작(KST)" htmlFor="bulk-start" hint="비우면 켜는 즉시">
          <Input
            id="bulk-start"
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
          />
        </Field>
        <Field label="노출 끝(KST)" htmlFor="bulk-end" error={errors.endAt} hint="비우면 끌 때까지">
          <Input
            id="bulk-end"
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </Field>
      </div>
      <div className="pb-4">
        <Checkbox
          checked={enabled}
          onChange={setEnabled}
          label="켜기"
          labelClassName="text-sm text-gray-700"
        />
      </div>

      {banners.length > 0 ? (
        <section aria-label="배너 내용" className="mb-4 rounded-md border border-gray-200 p-3">
          <h3 className="pb-3 text-sm font-semibold text-gray-900">
            배너 {banners.length}개에 같이 쓸 내용
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="이름(내부용)" htmlFor="bulk-banner-name" required error={errors.name}>
              <Input
                id="bulk-banner-name"
                value={name}
                maxLength={NAME_MAX_LENGTH}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="링크" htmlFor="bulk-banner-link" required error={errors.linkUrl}>
              <Input
                id="bulk-banner-link"
                value={linkUrl}
                placeholder="https://"
                onChange={(event) => setLinkUrl(event.target.value)}
              />
            </Field>
          </div>
          <Field
            label="배너 문구(대체 텍스트)"
            htmlFor="bulk-banner-alt"
            required
            error={errors.altText}
          >
            <Input
              id="bulk-banner-alt"
              value={altText}
              maxLength={ALT_TEXT_MAX_LENGTH}
              onChange={(event) => setAltText(event.target.value)}
            />
          </Field>
          {needsWide ? (
            <BannerImageField
              id="bulk-pc-wide"
              label="PC 이미지(1200×120) · 목록 위·아래 자리"
              sizeHint={PC_IMAGE_SPECS.HOME_TOP.sizeHint}
              aspectClassName={PC_IMAGE_SPECS.HOME_TOP.aspectClassName}
              presets={bannerPresets('HOME_TOP').map(({ key, label, pcImageUrl }) => ({
                key,
                label,
                url: pcImageUrl,
              }))}
              value={pcWide}
              onChange={setPcWide}
              error={errors.pcWide}
            />
          ) : null}
          {needsSide ? (
            <div className="max-w-56">
              <BannerImageField
                id="bulk-pc-side"
                label="PC 이미지(400×500) · 상세 사이드 자리"
                sizeHint={PC_IMAGE_SPECS.JOB_DETAIL_SIDE.sizeHint}
                aspectClassName={PC_IMAGE_SPECS.JOB_DETAIL_SIDE.aspectClassName}
                presets={bannerPresets('JOB_DETAIL_SIDE').map(({ key, label, pcImageUrl }) => ({
                  key,
                  label,
                  url: pcImageUrl,
                }))}
                value={pcSide}
                onChange={setPcSide}
                error={errors.pcSide}
              />
            </div>
          ) : null}
          <div className="max-w-xs">
            <BannerImageField
              id="bulk-mobile"
              label="모바일 이미지(750×200) · 체크한 배너 모두"
              sizeHint={
                needsSide
                  ? '750×200 비율. 상세 사이드 배너가 있어 꼭 있어야 합니다.'
                  : '750×200 비율. 비워 두면 좁은 화면에도 PC 이미지를 씁니다.'
              }
              aspectClassName="aspect-[750/200]"
              required={needsSide}
              presets={bannerPresets('HOME_TOP').map(({ key, label, mobileImageUrl }) => ({
                key,
                label,
                url: mobileImageUrl,
              }))}
              value={mobile}
              onChange={setMobile}
              error={errors.mobile}
            />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Checkbox
              checked={openInNewTab}
              onChange={setOpenInNewTab}
              label="새 탭에서 열기(외부 주소는 늘 새 탭)"
              labelClassName="text-sm text-gray-700"
            />
            <Checkbox
              checked={showAdLabel}
              onChange={setShowAdLabel}
              label="광고 표시"
              labelClassName="text-sm text-gray-700"
            />
          </div>
        </section>
      ) : null}

      {needsJob ? (
        <TargetField
          label={`광고할 채용공고 · ${ads
            .filter((placement) => placement !== 'BOOTCAMP_LIST')
            .map((placement) => AD_PLACEMENT_LABELS[placement])
            .join(', ')}`}
          placement={ads.find((placement) => placement !== 'BOOTCAMP_LIST') ?? 'JOB_LIST'}
          value={jobTarget}
          onChange={setJobTarget}
          error={errors.jobTarget}
        />
      ) : null}
      {needsBootcamp ? (
        <TargetField
          label="광고할 부트캠프 · 부트캠프 목록"
          placement="BOOTCAMP_LIST"
          value={bootcampTarget}
          onChange={setBootcampTarget}
          error={errors.bootcampTarget}
        />
      ) : null}

      {submitted && hasErrors ? (
        <Callout tone="error" className="mb-4">
          빠진 칸을 채워 주세요.
        </Callout>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button
          onClick={() => {
            setSubmitted(true);
            if (!hasErrors) {
              setStep('confirm');
            }
          }}
        >
          다음: 확인
        </Button>
      </div>
    </Modal>
  );
}

function TargetField({
  label,
  placement,
  value,
  onChange,
  error,
}: {
  label: string;
  placement: AdPostingPlacement;
  value: AdTarget | null;
  onChange: (target: AdTarget | null) => void;
  error?: string;
}) {
  return (
    <Field label={label} required error={error}>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-900">{value.title}</span>
            <span className="block text-xs text-gray-500">
              {value.companyName} · {value.id}번
            </span>
          </span>
          <Button size="sm" variant="secondary" onClick={() => onChange(null)}>
            바꾸기
          </Button>
        </div>
      ) : (
        <TargetPicker placement={placement} takenTargetIds={new Set()} onPick={onChange} />
      )}
    </Field>
  );
}

function ResultList({ items }: { items: ResultItem[] }) {
  return (
    <ul
      className="divide-y divide-gray-100 rounded-md border border-gray-200"
      aria-label="만든 결과"
    >
      {items.map((item) => (
        <li key={item.product} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-sm text-gray-900">{adContractProductLabel(item.product)}</span>
          <span className="flex items-center gap-2">
            {item.ok ? null : <span className="text-xs text-gray-500">{item.message}</span>}
            <Badge tone={item.ok ? 'success' : 'danger'}>{item.ok ? '성공' : '실패'}</Badge>
          </span>
        </li>
      ))}
    </ul>
  );
}
