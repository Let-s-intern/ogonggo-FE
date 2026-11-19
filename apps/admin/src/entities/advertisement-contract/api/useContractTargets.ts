import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AddContractTargetRequest,
  AdminContractDetailWithTargets,
  AdminContractTarget,
} from '@ogonggo/api/src/mocks/admin/advertisementReports';
import type { AdminAdvertisementContractDetailResponse } from '@ogonggo/api/src/admin';
import { adminDelete, adminWrite } from '@/shared/api/adminClient';

/**
 * 계약의 광고할 공고·부트캠프(PRD `prd-business-report.md` 6.3, D2). 목록은 계약 상세 응답의 `targets` 에 온다.
 *
 * BE(Push 3) 배포 전이라 생성 함수가 없어 `adminClient` 로 부르고 목의 타입을 쓴다. 코드젠 뒤 생성 함수로 옮긴다.
 */
export type ContractTarget = AdminContractTarget;

const CONTRACTS_KEY = ['admin', 'advertisement-contracts'] as const;

/** 코드젠 전 생성 타입에는 `targets` 가 없다. 없으면 빈 목록이다. */
export function targetsOf(contract: AdminAdvertisementContractDetailResponse): ContractTarget[] {
  return (contract as Partial<AdminContractDetailWithTargets>).targets ?? [];
}

/**
 * 광고 공고를 걸 때 바로 고를 수 있는 계약의 대상(2026-11-20 사용자 요청). 광고할 공고 전부이고, 공고 등록 계약이면 그 공고를
 * 맨 앞에 둔다 — 응답의 `targets` 에 이미 있으면 그것을 쓰고, 없으면 계약의 공고 제목·회사로 채운다.
 */
export function quickTargetsOf(
  contract: AdminAdvertisementContractDetailResponse,
): ContractTarget[] {
  const targets = targetsOf(contract);
  if (contract.source !== 'COMPANY_POSTING' || contract.targetId == null) return targets;
  const fixed: ContractTarget = {
    targetType: contract.promotionTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB',
    targetId: contract.targetId,
    title: contract.recruitmentTitle,
    companyName: contract.companyName,
  };
  const listed = targets.find((target) => isFixedTarget(contract, target));
  return [listed ?? fixed, ...targets.filter((target) => target !== listed)];
}

/** 공고 등록 계약의 공고는 자동 대상이라 뺄 수 없다. */
export function isFixedTarget(
  contract: AdminAdvertisementContractDetailResponse,
  target: ContractTarget,
): boolean {
  return (
    contract.source === 'COMPANY_POSTING' &&
    contract.targetId === target.targetId &&
    (contract.promotionTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB') === target.targetType
  );
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CONTRACTS_KEY });
}

/** 중복은 409, 없는 대상은 404 다. */
export function useAddContractTarget(contractId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: AddContractTargetRequest) =>
      adminWrite<null>('POST', `/api/v1/admin/advertisement-contracts/${contractId}/targets`, body),
    onSuccess: invalidate,
  });
}

export function useRemoveContractTarget(contractId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ targetType, targetId }: AddContractTargetRequest) =>
      adminDelete(
        `/api/v1/admin/advertisement-contracts/${contractId}/targets/${targetType}/${targetId}`,
      ),
    onSuccess: invalidate,
  });
}
