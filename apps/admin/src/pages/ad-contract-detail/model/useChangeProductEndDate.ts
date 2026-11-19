import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  replaceAdvertisementExposure,
  updateAdvertisementContractProduct,
  type UpdateAdminAdvertisementExposureRequest,
  type UpdateAdminAdvertisementExposureRequestJobField,
} from '@ogonggo/api/src/admin';
import type { AdvertisementExposure } from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { unwrapData } from '@/shared/api/unwrapData';

/** `YYYY-MM-DD` 다음 날. 광고 공고 노출 끝은 게시 종료일 다음 날 00:00(KST)이다. */
function nextDay(date: string): string {
  const time = Date.parse(`${date}T00:00:00Z`) + 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

/** 노출 끝이 `date` 다음 날 00:00 인지. 서버 값은 초까지(`T00:00:00`) 오지만 분까지만 저장된 값도 같게 본다. */
export function endsAfterDay(exposure: AdvertisementExposure, date: string): boolean {
  const endAt = exposure.endAt;
  if (!endAt) return false;
  return new RegExp(`^${nextDay(date)}T00:00(:00(\\.0+)?)?$`).test(endAt);
}

/** 노출 교체(`PUT`)는 전체 교체라 끝만 바꾸고 나머지는 지금 값 그대로 보낸다. */
function replaceBody(exposure: AdvertisementExposure, endAt: string) {
  const body: UpdateAdminAdvertisementExposureRequest = {
    contractId: exposure.contractId ?? null,
    name: exposure.name ?? null,
    imageUrl: exposure.imageUrl ?? null,
    mobileImageUrl: exposure.mobileImageUrl ?? null,
    linkUrl: exposure.linkUrl ?? null,
    targetType: exposure.targetType ?? null,
    targetId: exposure.targetId ?? null,
    jobField: (exposure.jobField ?? null) as UpdateAdminAdvertisementExposureRequestJobField,
    recommendationTitle: exposure.recommendationTitle ?? null,
    recommendationDescription: exposure.recommendationDescription ?? null,
    adLabel: exposure.adLabel,
    startAt: exposure.startAt ?? null,
    endAt,
  };
  return body;
}

export interface EndDateChange {
  contractProductId: number;
  newEndDate: string;
  /** 끝을 옮길 노출. 비어 있으면 게시 종료일만 바꾼다. */
  exposures: AdvertisementExposure[];
}

export interface EndDateResult {
  moved: number;
  /** 끝을 옮기지 못한 노출과 이유. */
  failures: { exposure: AdvertisementExposure; reason: string }[];
}

/**
 * 계약 상품의 게시 종료일 바꾸기(BE #158). 게시 종료일을 바꾼 뒤, 고른 노출의 끝을 새 종료일 다음 날 00:00 으로 하나씩
 * 옮긴다(노출은 BE 가 바꾸지 않는다). 노출 하나가 실패해도 나머지는 옮기고 실패한 것만 모아 알린다.
 */
export function useChangeProductEndDate(contractId: number) {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EndDateResult | null>(null);

  const run = async (change: EndDateChange) => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      try {
        await unwrapData(
          updateAdvertisementContractProduct(contractId, change.contractProductId, {
            endDate: change.newEndDate,
          }),
        );
      } catch (failure) {
        setError(advertisementErrorMessage(failure, '게시 종료일을 바꾸지 못했어요.'));
        return;
      }
      const endAt = `${nextDay(change.newEndDate)}T00:00:00`;
      const failures: EndDateResult['failures'] = [];
      let moved = 0;
      for (const exposure of change.exposures) {
        try {
          await unwrapData(replaceAdvertisementExposure(exposure.id, replaceBody(exposure, endAt)));
          moved += 1;
        } catch (failure) {
          failures.push({
            exposure,
            reason: advertisementErrorMessage(failure, '알 수 없는 이유로 실패했어요.'),
          });
        }
      }
      setResult({ moved, failures });
    } finally {
      setRunning(false);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'advertisement-contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'advertisement-exposures'] });
    }
  };

  return { run, running, error, result };
}
