import { useState } from 'react';
import { Button, Callout, Field, Input, Modal, Select, Textarea } from '@ogonggo/ui';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import { INSTAGRAM_AD_STATUSES, type InstagramAdStatus } from '@ogonggo/api/src/instagram';
import type { AdContract } from '@/entities/ad-contract/api/useAdContracts';
import { formatWon } from '@/entities/ad-contract/lib/adContract';
import {
  useInstagramAccounts,
  useInstagramFormats,
  useSaveInstagramAd,
  type InstagramAd,
  type InstagramFormat,
} from '@/entities/instagram/api/useInstagram';
import {
  INSTAGRAM_AD_STATUS_BADGES,
  instagramAdPeriod,
  instagramHandle,
  isHttpUrl,
  kstDate,
} from '@/entities/instagram/lib/instagram';
import {
  AdContractField,
  useDefaultAdContract,
} from '@/features/ad-contract-picker/ui/AdContractField';
import { AdvertiserField } from '@/features/advertiser-picker/ui/AdvertiserField';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const MEMO_MAX_LENGTH = 1000;

/** 새 광고에 미리 채울 값. 광고 계약 상세(광고주)와 계약 행(광고주·계약)에서 연다. */
export interface InstagramAdInitial {
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

/** 이 계정으로 올릴 수 있는 유형인가. 유형의 계정이 비어 있으면 모든 계정이다. */
const supportsAccount = (format: InstagramFormat, accountId: number | null) =>
  accountId === null || format.accountIds.length === 0 || format.accountIds.includes(accountId);

/**
 * 인스타 광고 추가·수정 모달(이슈 #573, 2026-11-06 사용자). 인스타 광고 화면, 광고 계약 상세, 계약 행의 `인스타 광고 추가` 가
 * 같이 쓴다.
 *
 * - 광고주는 필수, 계약은 선택이다. 광고주를 고르면 그 광고주의 기본 계약(진행 중, 없으면 가장 가까운 예정)을 고르고 게시
 *   예정일을 채운다(배너·광고 공고 모달과 같다)
 * - 계정·유형은 `사용` 인 것만 고른다. 고친 광고에 이미 든 계정·유형은 꺼져 있어도 남는다. 계정을 고르면 그 계정이 올릴 수
 *   있는 유형만 보인다
 * - 노출 끝 날은 스토리·하이라이트 고정처럼 기간이 있는 것만 적는다. 비우면 게시 하루짜리다
 */
export function InstagramAdFormModal({
  ad,
  initial,
  onClose,
  onSaved,
}: {
  /** `null` 이면 새 광고다. */
  ad: InstagramAd | null;
  initial?: InstagramAdInitial;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const save = useSaveInstagramAd(ad?.id ?? null);
  const accounts = useInstagramAccounts();
  const formats = useInstagramFormats();
  const defaultContract = useDefaultAdContract();

  const [advertiser, setAdvertiser] = useState<AdvertiserSummary | null>(
    ad?.advertiser ?? initial?.advertiser ?? null,
  );
  const [contractId, setContractId] = useState<number | null>(
    ad ? ad.contractId : (initial?.contract?.id ?? null),
  );
  const [accountId, setAccountId] = useState<number | null>(ad?.accountId ?? null);
  const [formatId, setFormatId] = useState<number | null>(ad?.formatId ?? null);
  const [postDate, setPostDate] = useState(
    ad?.postDate ?? (initial?.contract ? contractPostDate(initial.contract) : ''),
  );
  const [endDate, setEndDate] = useState(ad?.endDate ?? '');
  const [status, setStatus] = useState<InstagramAdStatus>(ad?.status ?? 'SCHEDULED');
  const [postUrl, setPostUrl] = useState(ad?.postUrl ?? '');
  const [creativeMemo, setCreativeMemo] = useState(ad?.creativeMemo ?? '');
  const [adminMemo, setAdminMemo] = useState(ad?.adminMemo ?? '');
  const [submitted, setSubmitted] = useState(false);

  const allFormats = formats.data ?? [];
  const selectedFormat = allFormats.find((format) => format.id === formatId) ?? null;
  const accountOptions = (accounts.data ?? []).filter(
    (account) => account.enabled || account.id === ad?.accountId,
  );
  const formatOptions = allFormats.filter(
    (format) =>
      (format.enabled || format.id === ad?.formatId) && supportsAccount(format, accountId),
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

  const changeAccount = (next: number | null) => {
    setAccountId(next);
    // 새 계정이 올리지 않는 유형이면 비운다.
    if (selectedFormat && !supportsAccount(selectedFormat, next)) {
      setFormatId(null);
    }
  };

  const trimmedUrl = postUrl.trim();
  const errors = submitted
    ? {
        advertiser: advertiser ? undefined : '어느 기업의 광고인지 골라 주세요.',
        account: accountId === null ? '올릴 계정을 골라 주세요.' : undefined,
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
      accountId === null ||
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
        accountId,
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
          onSaved(ad ? '인스타 광고를 고쳤습니다.' : '인스타 광고를 더했습니다.');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={ad ? '인스타 광고 수정' : '인스타 광고 추가'}
      onClose={onClose}
      className="w-[min(44rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}
      {accounts.isError || formats.isError ? (
        <Callout tone="error" className="mb-4">
          계정·게재 유형을 불러오지 못했습니다.
        </Callout>
      ) : null}

      <AdvertiserField
        id="instagram-ad-advertiser"
        value={advertiser}
        onChange={(next) => void changeAdvertiser(next)}
        required
        error={errors.advertiser}
      />

      <AdContractField
        id="instagram-ad-contract"
        advertiserId={advertiser?.id ?? null}
        value={contractId}
        onChange={applyContract}
        period={instagramAdPeriod({ postDate, endDate: endDate || null })}
        instagramFormat={selectedFormat}
        hint="계약을 고르면 게시 예정일을 계약 기간 안의 날로 채웁니다. 채운 뒤에도 고칠 수 있습니다."
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="계정" htmlFor="instagram-ad-account" required error={errors.account}>
          <Select
            id="instagram-ad-account"
            className="w-full"
            options={[
              { value: '', label: '계정 고르기' },
              ...accountOptions.map((account) => ({
                value: String(account.id),
                label: `${instagramHandle(account.handle)} · ${account.displayName}${
                  account.enabled ? '' : ' (사용 안 함)'
                }`,
              })),
            ]}
            value={accountId === null ? '' : String(accountId)}
            onChange={(event) =>
              changeAccount(event.target.value ? Number(event.target.value) : null)
            }
          />
        </Field>
        <Field
          label="게재 유형"
          htmlFor="instagram-ad-format"
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
              : accountId === null
                ? undefined
                : '이 계정이 올릴 수 있는 유형만 보입니다.'
          }
        >
          <Select
            id="instagram-ad-format"
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
          htmlFor="instagram-ad-post-date"
          required
          error={errors.postDate}
        >
          <Input
            id="instagram-ad-post-date"
            type="date"
            value={postDate}
            onChange={(event) => setPostDate(event.target.value)}
          />
        </Field>
        <Field
          label="노출 끝 날"
          htmlFor="instagram-ad-end-date"
          error={errors.endDate}
          hint="스토리·고정처럼 기간이 있을 때만. 그날까지"
        >
          <Input
            id="instagram-ad-end-date"
            type="date"
            value={endDate}
            min={postDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Field>
        <Field label="상태" htmlFor="instagram-ad-status">
          <Select
            id="instagram-ad-status"
            className="w-full"
            options={INSTAGRAM_AD_STATUSES.map((value) => ({
              value,
              label: INSTAGRAM_AD_STATUS_BADGES[value].label,
            }))}
            value={status}
            onChange={(event) => setStatus(event.target.value as InstagramAdStatus)}
          />
        </Field>
      </div>

      <Field
        label="게시물 주소"
        htmlFor="instagram-ad-url"
        error={errors.postUrl}
        hint="게시한 뒤 적습니다."
      >
        <Input
          id="instagram-ad-url"
          value={postUrl}
          placeholder="https://www.instagram.com/p/"
          onChange={(event) => setPostUrl(event.target.value)}
        />
      </Field>
      <Field label="소재·문구 메모" htmlFor="instagram-ad-creative">
        <Textarea
          id="instagram-ad-creative"
          rows={3}
          value={creativeMemo}
          maxLength={MEMO_MAX_LENGTH}
          placeholder="광고주가 준 문구, 이미지·영상 위치, 링크 등"
          onChange={(event) => setCreativeMemo(event.target.value)}
        />
      </Field>
      <Field label="담당자 메모" htmlFor="instagram-ad-admin-memo">
        <Textarea
          id="instagram-ad-admin-memo"
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
