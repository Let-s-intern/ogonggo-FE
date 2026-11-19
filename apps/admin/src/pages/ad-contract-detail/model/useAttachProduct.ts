import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@ogonggo/api';
import {
  createAdvertisementContractProduct,
  createAdvertisementExposure,
  listAdvertisementExposures,
  moveAdvertisementExposure,
  type CreateAdminAdvertisementExposureRequest,
  type CreateAdminAdvertisementExposureRequestJobField,
} from '@ogonggo/api/src/admin';
import { jobFieldLabel } from '@/entities/advertisement-exposure/lib/adPosting';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { adminWrite } from '@/shared/api/adminClient';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 계약에 상품을 붙이면서 광고 공고 노출과 광고할 공고 연결까지 한 번에 하는 흐름(6.7). 새 BE API 없이 기존 API 를 차례로
 * 부른다 — 계약 상품 추가 → 광고 공고 노출 등록(+ 맨 앞으로) → 광고할 공고 연결.
 *
 * 중간에 실패하면 거기서 멈추고 단계별 결과를 남긴다. `다시 시도` 는 끝나지 않은 단계만 다시 부른다. 이미 붙인 상품을 또
 * 붙이면 같은 상품이 두 번 들어가므로 끝난 단계는 절대 다시 부르지 않는다.
 */

export type StepKey = 'product' | 'exposure' | 'target';
export type StepStatus = 'waiting' | 'running' | 'done' | 'skipped' | 'failed';
export interface StepState {
  status: StepStatus;
  /** 실패 이유나 건너뛴 이유. */
  message?: string;
}

export const STEP_LABELS: Record<StepKey, string> = {
  product: '계약에 상품 넣기',
  exposure: '광고 공고 자리에 노출 걸기',
  target: '광고할 공고로 등록',
};

export interface AttachInput {
  productId: number;
  startDate: string;
  endDate: string;
  /** 광고 공고 상품일 때만. 없으면 노출·대상 단계를 건너뛴다. */
  posting: {
    targetType: 'JOB' | 'BOOTCAMP';
    targetId: number;
    /**
     * 노출을 걸 탭마다 하나씩의 직무. 리스트 상단 고정(`JOB_LIST`)은 고른 탭 수만큼이고 `전체` 탭은 null 이다(계약 10절).
     * 다른 자리는 `[null]` 하나다.
     */
    jobFields: (string | null)[];
    /** 오공고 PICK(`JOB_PICK`) 노출의 추천 문구(계약 9절). 다른 자리는 null. */
    recommendation: { title: string; description: string } | null;
    expose: boolean;
    /** 맨 앞(상단 고정) 또는 맨 뒤. */
    order: 'first' | 'last';
    registerTarget: boolean;
  } | null;
}

/** `YYYY-MM-DD` 다음 날. 노출 끝은 종료일 다음 날 00:00(KST) 이다 — 종료일 하루 전체가 노출된다. */
function nextDay(date: string): string {
  const time = Date.parse(`${date}T00:00:00Z`) + 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

/** 한 번에 세팅의 노출 등록 본문. 상품 기간 그대로이고 광고 표시를 켠다. */
function exposureBody(
  contractId: number,
  next: AttachInput,
  posting: NonNullable<AttachInput['posting']>,
  jobField: string | null,
): CreateAdminAdvertisementExposureRequest {
  return {
    productId: next.productId,
    contractId,
    name: null,
    imageUrl: null,
    mobileImageUrl: null,
    linkUrl: null,
    targetType: posting.targetType,
    targetId: posting.targetId,
    // 직무 고르기의 값은 JobField 목록에서만 나온다. `전체` 탭이면 비운다.
    jobField: (jobField ?? undefined) as
      | CreateAdminAdvertisementExposureRequestJobField
      | undefined,
    recommendationTitle: posting.recommendation?.title.trim() ?? null,
    recommendationDescription: posting.recommendation?.description.trim() ?? null,
    adLabel: true,
    startAt: `${next.startDate}T00:00:00`,
    endAt: `${nextDay(next.endDate)}T00:00:00`,
    exposed: true,
  };
}

const initialSteps = (input: AttachInput | null): Record<StepKey, StepState> => ({
  product: { status: 'waiting' },
  exposure:
    input?.posting?.expose === false
      ? { status: 'skipped', message: '체크를 꺼서 건너뜀' }
      : { status: 'waiting' },
  target:
    input?.posting?.registerTarget === false
      ? { status: 'skipped', message: '체크를 꺼서 건너뜀' }
      : { status: 'waiting' },
});

const isConflict = (failure: unknown) => failure instanceof HttpError && failure.status === 409;

/** 노출 단계에서 일부 탭만 실패했을 때. 메시지에 탭별 실패 이유를 모은다. */
class TabsFailed extends Error {}

/** 탭을 가르는 열쇠. `전체` 탭(직무 없음)은 빈 문자열이다. */
const tabKey = (jobField: string | null) => jobField ?? '';

export function useAttachProduct(contractId: number) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState<AttachInput | null>(null);
  const [steps, setSteps] = useState<Record<StepKey, StepState> | null>(null);
  const [running, setRunning] = useState(false);
  // 노출은 만들었는데 순서 옮기기에서 실패했으면, 다시 시도할 때 또 만들지 않고 옮기기만 한다. 탭마다 따로 센다.
  const createdExposureIds = useRef(new Map<string, number>());
  // 만들고 순서까지 끝낸 탭. 다시 시도할 때 건너뛴다.
  const finishedTabs = useRef(new Set<string>());

  /** 탭 하나의 노출을 만들고(이미 만들었으면 건너뛰고) 고른 순서로 옮긴다. */
  const exposeOne = async (
    next: AttachInput,
    posting: NonNullable<AttachInput['posting']>,
    jobField: string | null,
    key: string,
  ) => {
    const createdId =
      createdExposureIds.current.get(key) ??
      (
        await unwrapData(
          createAdvertisementExposure(exposureBody(contractId, next, posting, jobField)),
        )
      )?.id;
    if (createdId === undefined) return;
    createdExposureIds.current.set(key, createdId);
    if (posting.order === 'last') return;
    // 새 노출은 맨 뒤에 붙는다. 맨 앞으로 가려면 앞에 있는 수만큼 한 칸씩 올린다(BE 에 순서 지정이 없다).
    const siblings =
      (await unwrapData(listAdvertisementExposures({ productId: next.productId, size: 100 })))
        ?.items ?? [];
    const index = siblings.findIndex((item) => item.id === createdId);
    for (let step = 0; step < index; step += 1) {
      await unwrapData(moveAdvertisementExposure(createdId, { direction: 'UP' }));
    }
  };

  const run = async (next: AttachInput, from: Record<StepKey, StepState>) => {
    setInput(next);
    setRunning(true);
    const state = { ...from };
    const update = (key: StepKey, value: StepState) => {
      state[key] = value;
      setSteps({ ...state });
    };
    const attempt = async (key: StepKey, call: () => Promise<string | void>) => {
      if (state[key].status === 'done' || state[key].status === 'skipped') return true;
      update(key, { status: 'running' });
      try {
        const message = await call();
        update(key, { status: 'done', message: message || undefined });
        return true;
      } catch (failure) {
        update(key, {
          status: 'failed',
          message:
            failure instanceof TabsFailed
              ? failure.message
              : advertisementErrorMessage(failure, '알 수 없는 이유로 실패했어요.'),
        });
        return false;
      }
    };

    try {
      if (
        !(await attempt('product', async () => {
          await unwrapData(
            createAdvertisementContractProduct(contractId, {
              productId: next.productId,
              startDate: next.startDate,
              endDate: next.endDate,
            }),
          );
        }))
      ) {
        return;
      }
      const posting = next.posting;
      if (!posting) {
        update('exposure', { status: 'skipped', message: '광고 공고 상품이 아님' });
        update('target', { status: 'skipped', message: '광고 공고 상품이 아님' });
        return;
      }
      if (
        !(await attempt('exposure', async () => {
          // 리스트 상단 고정은 고른 탭마다 노출 하나다. 한 탭이 실패해도 나머지 탭은 걸고, 실패한 탭만 모아 알린다.
          const failures: string[] = [];
          for (const jobField of posting.jobFields) {
            const key = tabKey(jobField);
            if (finishedTabs.current.has(key)) continue;
            try {
              await exposeOne(next, posting, jobField, key);
              finishedTabs.current.add(key);
            } catch (failure) {
              const reason = advertisementErrorMessage(failure, '알 수 없는 이유로 실패했어요.');
              failures.push(
                posting.jobFields.length > 1 ? `${jobFieldLabel(jobField)} 탭: ${reason}` : reason,
              );
            }
          }
          if (failures.length > 0) throw new TabsFailed(failures.join(' / '));
        }))
      ) {
        return;
      }
      await attempt('target', async () => {
        try {
          await adminWrite('POST', `/api/v1/admin/advertisement-contracts/${contractId}/targets`, {
            targetType: posting.targetType,
            targetId: posting.targetId,
          });
        } catch (failure) {
          // 이미 대상이면 할 일이 끝난 것이다.
          if (isConflict(failure)) return '이미 대상이라 그대로 둠';
          throw failure;
        }
      });
    } finally {
      setRunning(false);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'advertisement-contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'advertisement-exposures'] });
    }
  };

  const failed = steps ? Object.values(steps).some((step) => step.status === 'failed') : false;
  const finished =
    steps !== null &&
    !running &&
    Object.values(steps).every((step) => step.status === 'done' || step.status === 'skipped');

  return {
    steps,
    running,
    failed,
    finished,
    start: (next: AttachInput) => {
      createdExposureIds.current = new Map();
      finishedTabs.current = new Set();
      return run(next, initialSteps(next));
    },
    /** 끝나지 않은 단계만 다시 부른다. */
    retry: () => {
      if (input && steps) void run(input, steps);
    },
    /**
     * 실패한 노출·대상 단계를 건너뛰고 이어 간다. 같은 자리에 이미 그 공고가 있는 409 처럼 다시 해도 안 되는 실패용이다. 상품
     * 넣기는 건너뛸 수 없다 — 그 뒤 단계가 의미가 없다.
     */
    canSkip: Boolean(steps && steps.product.status === 'done' && failed && !running),
    skipFailed: () => {
      if (!input || !steps) return;
      const next = { ...steps };
      for (const key of ['exposure', 'target'] as const) {
        if (next[key].status === 'failed') {
          next[key] = { status: 'skipped', message: `실패해서 건너뜀: ${next[key].message ?? ''}` };
        }
      }
      void run(input, next);
    },
    reset: () => {
      setInput(null);
      setSteps(null);
    },
  };
}
