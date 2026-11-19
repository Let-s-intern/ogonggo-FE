import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@ogonggo/api';
import {
  createAdvertisementContractProduct,
  createAdvertisementExposure,
  listAdvertisementExposures,
  moveAdvertisementExposure,
} from '@ogonggo/api/src/admin';
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

export function useAttachProduct(contractId: number) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState<AttachInput | null>(null);
  const [steps, setSteps] = useState<Record<StepKey, StepState> | null>(null);
  const [running, setRunning] = useState(false);
  // 노출은 만들었는데 순서 옮기기에서 실패했으면, 다시 시도할 때 또 만들지 않고 옮기기만 한다.
  const createdExposureId = useRef<number | null>(null);

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
          message: advertisementErrorMessage(failure, '알 수 없는 이유로 실패했어요.'),
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
          const created =
            createdExposureId.current !== null
              ? { id: createdExposureId.current }
              : await unwrapData(
                  createAdvertisementExposure({
                    productId: next.productId,
                    contractId,
                    name: null,
                    imageUrl: null,
                    mobileImageUrl: null,
                    linkUrl: null,
                    targetType: posting.targetType,
                    targetId: posting.targetId,
                    adLabel: true,
                    startAt: `${next.startDate}T00:00:00`,
                    endAt: `${nextDay(next.endDate)}T00:00:00`,
                    exposed: true,
                  }),
                );
          if (!created) return;
          createdExposureId.current = created.id;
          if (posting.order === 'last') return;
          // 새 노출은 맨 뒤에 붙는다. 맨 앞으로 가려면 앞에 있는 수만큼 한 칸씩 올린다(BE 에 순서 지정이 없다).
          const siblings =
            (await unwrapData(listAdvertisementExposures({ productId: next.productId, size: 100 })))
              ?.items ?? [];
          const index = siblings.findIndex((item) => item.id === created.id);
          for (let step = 0; step < index; step += 1) {
            await unwrapData(moveAdvertisementExposure(created.id, { direction: 'UP' }));
          }
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
      createdExposureId.current = null;
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
