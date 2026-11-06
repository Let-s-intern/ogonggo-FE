import { useState } from 'react';
import { Button, Callout, DataTable, Field, Input, Modal, Pagination, cn } from '@ogonggo/ui';
import type { AdvertiserSummary } from '@ogonggo/api/src/advertisers';
import { adPostingTargetType, type AdPostingPlacement } from '@ogonggo/api/src/ad-postings';
import type { AdContract } from '@/entities/ad-contract/api/useAdContracts';
import {
  useCreateAdPosting,
  useUpdateAdPosting,
  type AdPosting,
} from '@/entities/ad-posting/api/useAdPostings';
import { AD_PLACEMENT_LABELS } from '@/entities/ad-posting/lib/adPosting';
import { useBootcampList, useJobList } from '@/entities/content/api/useContent';
import { adPostingProduct } from '@/features/ad-contract-picker/lib/adContractProduct';
import {
  AdContractField,
  useDefaultAdContract,
} from '@/features/ad-contract-picker/ui/AdContractField';
import { AdvertiserField } from '@/features/advertiser-picker/ui/AdvertiserField';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { SearchBox } from '@/widgets/list-toolbar';

/** 고른 대상. 표에 보일 제목·회사만 들고 있다. */
interface Target {
  id: number;
  title: string;
  companyName: string;
}

interface AdPostingFormModalProps {
  placement: AdPostingPlacement;
  /** `null` 이면 새 광고다. 등록한 뒤에는 대상을 바꾸지 않는다 — 지우고 새로 등록한다. */
  adPosting: AdPosting | null;
  /** 이 자리에 이미 든 대상. 다시 고를 수 없다. */
  takenTargetIds: Set<number>;
  /** 새 광고에 미리 고를 광고주. 광고주별 광고 화면에서 열 때 준다. */
  initialAdvertiser?: AdvertiserSummary;
  /** 새 광고에 미리 고를 계약(`initialAdvertiser` 의 계약). 주면 노출 기간을 계약 기간으로 채운다. */
  initialContract?: AdContract | null;
  onClose: () => void;
}

/** `datetime-local` 값과 서버 값(KST, 초까지)을 오간다. 배너 모달과 같다. */
const toInputValue = (value: string | null) => (value ? value.slice(0, 16) : '');
const toServerValue = (value: string) => (value ? `${value}:00` : null);

/**
 * 광고 공고 추가·수정 모달(이슈 #573). 대상(채용공고, 부트캠프 목록 자리는 부트캠프)을 검색해 고르고, 광고주·노출 기간·켜기를
 * 정한다. 새 광고는 그 자리의 맨 뒤 칸에 들어가고 칸은 표의 위로·아래로로 옮긴다.
 *
 * 대상 검색은 콘텐츠 목록 API(`GET /api/v1/admin/jobs`·`/bootcamps`)의 공개 중인 것만 본다. 사용자 화면에 나가지 않는 대상은
 * 광고로 걸어도 보이지 않는다.
 */
export function AdPostingFormModal({
  placement,
  adPosting,
  takenTargetIds,
  initialAdvertiser,
  initialContract,
  onClose,
}: AdPostingFormModalProps) {
  const targetLabel = adPostingTargetType(placement) === 'BOOTCAMP' ? '부트캠프' : '채용공고';
  const create = useCreateAdPosting();
  const update = useUpdateAdPosting(placement, adPosting?.id ?? 0);
  const mutation = adPosting ? update : create;

  const [target, setTarget] = useState<Target | null>(
    adPosting
      ? {
          id: adPosting.targetId,
          title: adPosting.targetTitle,
          companyName: adPosting.targetCompanyName,
        }
      : null,
  );
  const [advertiser, setAdvertiser] = useState<AdvertiserSummary | null>(
    adPosting?.advertiser ?? initialAdvertiser ?? null,
  );
  // 새 광고에 계약이 미리 골라져 오면 기간을 계약 기간으로 채운다.
  const startContract = adPosting ? null : (initialContract ?? null);
  const [contractId, setContractId] = useState<number | null>(
    adPosting?.contractId ?? startContract?.id ?? null,
  );
  const [startAt, setStartAt] = useState(
    toInputValue(adPosting?.startAt ?? startContract?.startAt ?? null),
  );
  const [endAt, setEndAt] = useState(
    toInputValue(adPosting?.endAt ?? startContract?.endAt ?? null),
  );
  const defaultContract = useDefaultAdContract();

  /** 계약을 고르면 노출 기간을 계약 기간으로 채운다. 채운 뒤에도 고칠 수 있다. */
  const applyContract = (contract: AdContract | null) => {
    setContractId(contract?.id ?? null);
    if (contract) {
      setStartAt(toInputValue(contract.startAt));
      setEndAt(toInputValue(contract.endAt));
    }
  };

  /** 광고주를 바꾸면 계약을 비우고, 새 광고면 그 광고주의 기본 계약을 고른다(배너 모달과 같다). */
  const changeAdvertiser = async (next: AdvertiserSummary | null) => {
    if (next?.id === advertiser?.id) {
      return;
    }
    setAdvertiser(next);
    setContractId(null);
    if (next && !adPosting) {
      applyContract(await defaultContract(next.id));
    }
  };
  const [enabled, setEnabled] = useState(adPosting?.enabled ?? true);
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted
    ? {
        target: target ? undefined : `광고할 ${targetLabel}를 골라 주세요.`,
        advertiser: advertiser ? undefined : '어느 기업의 광고인지 골라 주세요.',
        endAt: startAt && endAt && startAt >= endAt ? '노출 끝은 시작보다 뒤여야 해요.' : undefined,
      }
    : {};

  const save = () => {
    setSubmitted(true);
    if (!target || !advertiser || (startAt && endAt && startAt >= endAt)) {
      return;
    }
    const period = { startAt: toServerValue(startAt), endAt: toServerValue(endAt) };
    if (adPosting) {
      update.mutate(
        { advertiserId: advertiser.id, contractId, ...period, enabled },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(
        {
          placement,
          targetId: target.id,
          advertiserId: advertiser.id,
          contractId,
          ...period,
          enabled,
        },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Modal
      open
      title={adPosting ? '광고 공고 수정' : '광고 공고 추가'}
      description={`${AD_PLACEMENT_LABELS[placement]} 자리`}
      onClose={onClose}
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      {mutation.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(mutation.error) ?? '저장하지 못했습니다. 입력값을 확인해 주세요.'}
        </Callout>
      ) : null}

      <Field label={`광고할 ${targetLabel}`} required error={errors.target}>
        {target ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-gray-900">
                {target.title}
              </span>
              <span className="block text-xs text-gray-500">
                {target.companyName} · {target.id}번
              </span>
            </span>
            {adPosting ? null : (
              <Button size="sm" variant="secondary" onClick={() => setTarget(null)}>
                바꾸기
              </Button>
            )}
          </div>
        ) : (
          <TargetPicker
            placement={placement}
            takenTargetIds={takenTargetIds}
            onPick={(picked) => setTarget(picked)}
          />
        )}
      </Field>

      <AdvertiserField
        id="ad-posting-advertiser"
        value={advertiser}
        onChange={(next) => void changeAdvertiser(next)}
        required
        error={errors.advertiser}
      />

      <AdContractField
        id="ad-posting-contract"
        advertiserId={advertiser?.id ?? null}
        value={contractId}
        onChange={applyContract}
        period={{ startAt: toServerValue(startAt), endAt: toServerValue(endAt) }}
        product={adPostingProduct(placement)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="노출 시작(KST)" htmlFor="ad-posting-start" hint="비우면 켜는 즉시">
          <Input
            id="ad-posting-start"
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
          />
        </Field>
        <Field
          label="노출 끝(KST)"
          htmlFor="ad-posting-end"
          error={errors.endAt}
          hint="비우면 끌 때까지"
        >
          <Input
            id="ad-posting-end"
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 pb-4 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        켜기
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={save} disabled={mutation.isPending}>
          {mutation.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}

/** 공개 중인 채용공고·부트캠프를 검색해 고른다. 오공고 PICK 공고 추가(`TodayJobsPage` 의 `JobPicker`)와 같은 방식이다. */
function TargetPicker({
  placement,
  takenTargetIds,
  onPick,
}: {
  placement: AdPostingPlacement;
  takenTargetIds: Set<number>;
  onPick: (target: Target) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const isBootcamp = adPostingTargetType(placement) === 'BOOTCAMP';
  const common = { page, keyword, visibility: 'VISIBLE', source: '', reviewStatus: '' };
  // 훅은 둘 다 부르되 자리에 맞는 쪽만 켠다. 다른 쪽은 쿼리 키만 생기고 요청은 나가지 않는다.
  const jobs = useJobList({ ...common, recruitmentStatus: '', sort: 'REGISTERED_AT' }, !isBootcamp);
  const bootcamps = useBootcampList({ ...common, status: '', sort: 'REGISTERED_AT' }, isBootcamp);
  const query = isBootcamp ? bootcamps : jobs;
  const rows: Target[] = (query.data?.items ?? []).map(({ id, title, companyName }) => ({
    id,
    title,
    companyName,
  }));

  return (
    <div className="flex flex-col gap-2">
      <SearchBox
        value={keyword}
        onSubmit={(next) => {
          setKeyword(next);
          setPage(1);
        }}
        placeholder={isBootcamp ? '과정명·운영사 검색' : '제목·회사 검색'}
      />
      {query.isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <div
            className={cn(
              'max-h-[40vh] overflow-y-auto rounded-lg',
              query.isFetching && 'opacity-50',
            )}
          >
            <DataTable
              columns={[
                { key: 'title', header: '제목', render: (row) => row.title },
                { key: 'company', header: '회사', width: 'w-40', render: (row) => row.companyName },
                {
                  key: 'select',
                  header: '선택',
                  width: 'w-24',
                  render: (row) => {
                    const taken = takenTargetIds.has(row.id);
                    return (
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`${row.title} ${taken ? '이미 등록됨' : '고르기'}`}
                        aria-disabled={taken}
                        className={cn(taken && 'cursor-not-allowed text-gray-400')}
                        onClick={() => {
                          if (!taken) {
                            onPick(row);
                          }
                        }}
                      >
                        {taken ? '등록됨' : '고르기'}
                      </Button>
                    );
                  },
                },
              ]}
              rows={rows}
              rowKey={(row) => row.id}
              isLoading={query.isPending}
              emptyMessage="조건에 맞는 대상이 없습니다."
            />
          </div>
          <Pagination
            page={page}
            totalPages={query.data?.pageInfo.totalPages ?? 1}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
