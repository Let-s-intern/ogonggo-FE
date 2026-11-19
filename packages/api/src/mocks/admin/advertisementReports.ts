import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminAdvertisementContractDetailResponse } from '../../generated/admin/models';
import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { advertisementStore } from '../fixtures/advertisement-exposures';
import { ok } from './paging';

/**
 * 광고 계약의 리포트 대상 공고 연결 목(PRD `prd-business-report.md` 6.3·6.7, API 계약
 * `.claude/tasks/memos/광고-리포트-API-계약-2026-11-19.md` 3절). BE(Push 3) 가 아직 없어 이 모양이 그대로 계약이다.
 *
 * 계약 상세(`GET /advertisement-contracts/{id}`)를 여기서 먼저 받아 `targets` 를 얹는다. `./handlers.ts` 에서
 * `advertisementAdminHandlers` 보다 앞에 둔다. 계약 저장소는 그쪽과 같이 쓰고, 연결한 대상만 따로 `localStorage` 에 둔다.
 */

const CONTRACTS = '*/api/v1/admin/advertisement-contracts';
const STORAGE_KEY = 'ogonggo.mock.admin.contractTargets';

export type ContractTargetType = 'JOB' | 'BOOTCAMP';

/** 계약 상세 응답의 `targets[]`. */
export interface AdminContractTarget {
  targetType: ContractTargetType;
  targetId: number;
  title: string;
  companyName: string;
}

export interface AddContractTargetRequest {
  targetType: ContractTargetType;
  targetId: number;
}

/** 계약 상세 응답에 이 목이 얹는 칸. 코드젠 뒤에는 생성 타입이 갖는다. */
export type AdminContractDetailWithTargets = AdminAdvertisementContractDetailResponse & {
  targets: AdminContractTarget[];
};

type TargetKey = AddContractTargetRequest;

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ status, code, message }, { status });
}

/** 공고·부트캠프 픽스처에서 제목·회사·공개 여부를 찾는다. 없으면 `undefined`. */
export function findContent(targetType: ContractTargetType, targetId: number) {
  const row =
    targetType === 'JOB'
      ? ADMIN_JOB_FIXTURES.find((job) => job.id === targetId)
      : ADMIN_BOOTCAMP_FIXTURES.find((bootcamp) => bootcamp.id === targetId);
  return row
    ? { title: row.title, companyName: row.companyName, published: row.visibility === 'VISIBLE' }
    : undefined;
}

/** 시드: 새싹컴퍼니 신청서 계약(1번)에 공고 하나를 미리 연결해 둔다. 나머지 신청서 계약은 비어 있다. */
function seed(): Record<number, TargetKey[]> {
  const job = ADMIN_JOB_FIXTURES[0];
  return job ? { 1: [{ targetType: 'JOB', targetId: job.id }] } : {};
}

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): Record<number, TargetKey[]> {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<number, TargetKey[]>;
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return seed();
}

const linked: Record<number, TargetKey[]> = load();

function save() {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(linked));
  } catch {
    // 메모리에는 남는다.
  }
}

/** 공고 등록 계약은 계약의 공고가 자동으로 대상이다. 지울 수 없다. */
function fixedTarget(contract: AdminAdvertisementContractDetailResponse): TargetKey | null {
  if (contract.source !== 'COMPANY_POSTING' || contract.targetId == null) return null;
  return {
    targetType: contract.promotionTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB',
    targetId: contract.targetId,
  };
}

const sameTarget = (a: TargetKey, b: TargetKey) =>
  a.targetType === b.targetType && a.targetId === b.targetId;

/** 계약의 대상 전부. 자동 대상이 맨 앞이다. */
export function contractTargets(
  contract: AdminAdvertisementContractDetailResponse,
): AdminContractTarget[] {
  const fixed = fixedTarget(contract);
  const keys = [
    ...(fixed ? [fixed] : []),
    ...(linked[contract.id] ?? []).filter((key) => !fixed || !sameTarget(key, fixed)),
  ];
  return keys.map((key) => {
    const content = findContent(key.targetType, key.targetId);
    return {
      ...key,
      title: content?.title ?? contract.recruitmentTitle,
      companyName: content?.companyName ?? contract.companyName,
    };
  });
}

function findContract(raw: unknown) {
  const id = Number(raw);
  return advertisementStore.contracts.find((contract) => contract.id === id);
}

const contractNotFound = () =>
  error(404, 'ADVERTISEMENT_CONTRACT_NOT_FOUND', '광고 계약을 찾을 수 없습니다.');

const getContractHandler = http.get(`${CONTRACTS}/:contractId`, ({ params }) => {
  const contract = findContract(params.contractId);
  if (!contract) return contractNotFound();
  const body: AdminContractDetailWithTargets = { ...contract, targets: contractTargets(contract) };
  return HttpResponse.json(ok(body), { status: 200 });
});

/** 중복 409, 없는 대상 404. 공고 등록 계약의 자동 대상도 중복이다. */
const addTargetHandler = http.post(
  `${CONTRACTS}/:contractId/targets`,
  async ({ params, request }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const body = (await request.json().catch(() => null)) as Partial<TargetKey> | null;
    const targetType = body?.targetType;
    const targetId = Number(body?.targetId);
    if ((targetType !== 'JOB' && targetType !== 'BOOTCAMP') || !Number.isInteger(targetId)) {
      return error(400, 'BAD_REQUEST', 'targetType, targetId 를 보내 주세요.');
    }
    if (!findContent(targetType, targetId)) {
      return error(404, 'ADVERTISEMENT_CONTRACT_TARGET_NOT_FOUND', '대상 공고를 찾을 수 없습니다.');
    }
    const key = { targetType, targetId };
    if (contractTargets(contract).some((target) => sameTarget(target, key))) {
      return error(
        409,
        'ADVERTISEMENT_CONTRACT_TARGET_DUPLICATED',
        '이미 이 계약에 연결한 대상입니다.',
      );
    }
    linked[contract.id] = [...(linked[contract.id] ?? []), key];
    save();
    return HttpResponse.json({ status: 201, message: 'Created', data: null }, { status: 201 });
  },
);

const removeTargetHandler = http.delete(
  `${CONTRACTS}/:contractId/targets/:targetType/:targetId`,
  ({ params }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const key = {
      targetType: params.targetType as ContractTargetType,
      targetId: Number(params.targetId),
    };
    const fixed = fixedTarget(contract);
    if (fixed && sameTarget(fixed, key)) {
      return error(
        409,
        'ADVERTISEMENT_CONTRACT_TARGET_FIXED',
        '공고 등록 계약의 공고는 대상에서 뺄 수 없습니다.',
      );
    }
    const before = linked[contract.id] ?? [];
    if (!before.some((item) => sameTarget(item, key))) {
      return error(
        404,
        'ADVERTISEMENT_CONTRACT_TARGET_NOT_FOUND',
        '이 계약에 연결한 대상이 아닙니다.',
      );
    }
    linked[contract.id] = before.filter((item) => !sameTarget(item, key));
    save();
    return new HttpResponse(null, { status: 204 });
  },
);

export const advertisementReportHandlers: HttpHandler[] = [
  getContractHandler,
  addTargetHandler,
  removeTargetHandler,
];
