import { useState } from 'react';
import { Button, Callout } from '@ogonggo/ui';
import type { AdminAdvertisementContractDetailResponse } from '@ogonggo/api/src/admin';
import {
  isFixedTarget,
  targetsOf,
  useAddContractTarget,
  useRemoveContractTarget,
  type ContractTarget,
} from '@/entities/advertisement-contract/api/useContractTargets';
import { useBootcampList, useJobList } from '@/entities/content/api/useContent';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { WEB_HOME } from '@/shared/api/webHandoff';
import { ContentTargetPicker, targetKey } from '@/widgets/content-target-picker';

const webHref = (target: Pick<ContractTarget, 'targetType' | 'targetId'>) =>
  `${WEB_HOME}/${target.targetType === 'BOOTCAMP' ? 'bootcamps' : 'jobs'}/${target.targetId}`;

/**
 * 계약 정보의 `광고할 공고` 한 줄(6.9, PRD 6.3·D2). 이 계약이 광고하는 공고·부트캠프를 칩으로 보이고, 리포트의 `광고할 공고
 * 전체 숫자` 가 이 공고들을 센다. 계약당 여럿이다.
 *
 * - 칩: 제목 · 회사. 누르면 오공고 웹 상세 새 탭, `x` 로 해제. 공고 등록 계약의 공고는 자동으로 들어가 `자동` 이고 뺄 수 없다
 * - 비어 있으면 한 줄 안내. 신청서 계약이면 신청서의 공고명·URL 을 회색으로 보이고, 그 제목으로 찾은 첫 후보를 제안한다
 * - `공고 연결` 은 공고·부트캠프 검색 피커를 연다. 계약에 광고 공고 상품을 넣을 때 체크하면 여기 자동으로 들어온다
 */
export function AdTargetsField({
  contract,
}: {
  contract: AdminAdvertisementContractDetailResponse;
}) {
  const targets = targetsOf(contract);
  const add = useAddContractTarget(contract.id);
  const remove = useRemoveContractTarget(contract.id);
  const [picking, setPicking] = useState(false);
  const takenKeys = new Set(targets.map(targetKey));
  const connect = (target: Pick<ContractTarget, 'targetType' | 'targetId'>) =>
    add.mutate({ targetType: target.targetType, targetId: target.targetId });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-2">
        {targets.length > 0 ? (
          <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {targets.map((target) => {
              const fixed = isFixedTarget(contract, target);
              return (
                <li
                  key={targetKey(target)}
                  className="flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-gray-50 py-1 pr-1.5 pl-3 text-sm"
                >
                  <a
                    href={webHref(target)}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 truncate text-gray-900 hover:text-blue-600 hover:underline"
                    title={`${target.title} · ${target.companyName} (오공고 웹에서 열기)`}
                  >
                    {target.targetType === 'BOOTCAMP' ? '[부트캠프] ' : ''}
                    {target.title}
                    <span className="text-gray-500"> · {target.companyName}</span>
                  </a>
                  {fixed ? (
                    <span className="rounded-full bg-gray-200 px-1.5 text-[11px] text-gray-600">
                      자동
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`${target.title} 연결 해제`}
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate({ targetType: target.targetType, targetId: target.targetId })
                      }
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    >
                      x
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyHint contract={contract} disabled={add.isPending} onConnect={connect} />
        )}
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={() => setPicking((open) => !open)}
        >
          {picking ? '검색 닫기' : '공고 연결'}
        </Button>
      </div>
      {add.isError || remove.isError ? (
        <Callout tone="error">
          {advertisementErrorMessage(add.error ?? remove.error, '광고할 공고를 바꾸지 못했습니다.')}
        </Callout>
      ) : null}
      {picking ? (
        <div className="rounded-lg border border-gray-200 p-3">
          <ContentTargetPicker
            takenKeys={takenKeys}
            disabled={add.isPending}
            initialType={contract.promotionTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB'}
            onPick={connect}
          />
        </div>
      ) : null}
    </div>
  );
}

/** 비었을 때. 신청서 계약이면 신청서 공고명으로 찾은 첫 후보를 `이 공고 연결` 로 제안한다. */
function EmptyHint({
  contract,
  disabled,
  onConnect,
}: {
  contract: AdminAdvertisementContractDetailResponse;
  disabled: boolean;
  onConnect: (target: Pick<ContractTarget, 'targetType' | 'targetId'>) => void;
}) {
  const fromForm = contract.source === 'APPLICATION_FORM' && Boolean(contract.recruitmentTitle);
  const isBootcamp = contract.promotionTarget === 'BOOTCAMP';
  const common = {
    page: 1,
    keyword: contract.recruitmentTitle,
    visibility: '',
    source: '',
    reviewStatus: '',
  };
  const jobs = useJobList(
    { ...common, recruitmentStatus: '', sort: 'REGISTERED_AT' },
    fromForm && !isBootcamp,
  );
  const bootcamps = useBootcampList(
    { ...common, status: '', sort: 'REGISTERED_AT' },
    fromForm && isBootcamp,
  );
  const first = (isBootcamp ? bootcamps : jobs).data?.items[0];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
      <p className="text-gray-500">
        광고할 공고를 연결하면 리포트에 그 공고의 전체 조회·지원 클릭이 함께 나와요.
      </p>
      {fromForm ? (
        <p className="text-xs break-all text-gray-400">
          신청서: {contract.recruitmentTitle}
          {contract.recruitmentUrl ? ` · ${contract.recruitmentUrl}` : ''}
        </p>
      ) : null}
      {first ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-gray-500">
            후보: {first.title} · {first.companyName} ({first.id}번)
          </span>
          <Button
            size="sm"
            disabled={disabled}
            onClick={() =>
              onConnect({ targetType: isBootcamp ? 'BOOTCAMP' : 'JOB', targetId: first.id })
            }
          >
            이 공고 연결
          </Button>
        </div>
      ) : null}
    </div>
  );
}
