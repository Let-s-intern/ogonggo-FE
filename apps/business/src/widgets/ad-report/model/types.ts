import type { MyAdvertisementContractProductResponse } from '@ogonggo/api';

/**
 * 상품별 리포트 응답(`광고-리포트-API-계약-2026-11-19.md` 3절). 백엔드(Push 3) 배포 전이라 생성 타입이 없어 계약을 그대로
 * 옮겨 적는다. 배포 뒤 `api-codegen` 이 만든 타입으로 바꾼다(task 7.1).
 */

/** 리포트를 못 여는 이유. 기간을 아직 안 넣었거나(`NO_PERIOD`), 오늘의 공고 화면 밖 채널 상품이다(`NOT_EXPOSABLE`). */
export type ReportUnavailableReason = 'NO_PERIOD' | 'NOT_EXPOSABLE';

/** 계약 상세의 `products[]` 에 리포트 계약이 더하는 두 칸. 코드젠 전에는 응답에 있어도 타입에 없다. */
export interface ReportableProduct extends MyAdvertisementContractProductResponse {
  reportAvailable?: boolean;
  reportUnavailableReason?: ReportUnavailableReason | null;
}

export type ReportSource =
  | 'AD_CARD'
  | 'BANNER'
  | 'LIST'
  | 'SEARCH'
  | 'DIRECT'
  | 'EXTERNAL'
  | 'OTHER';

export interface ScrollFunnelStep {
  threshold: 0 | 25 | 50 | 75 | 100;
  visitors: number;
  /** 0~1. 순 방문자가 0 이면 null. */
  rate: number | null;
}

export interface ReportDetailMetrics {
  views: number;
  uniqueVisitors: number;
  memberViews: number;
  ctaClicks: number;
  ctaUniqueVisitors: number;
  avgScrollPercent: number | null;
  avgDurationSeconds: number | null;
}

export interface ReportDailyRow extends ReportDetailMetrics {
  date: string;
  impressions: number;
  adClicks: number;
}

export interface AdReport {
  product: {
    contractProductId: number;
    productId: number;
    category: string;
    position: string | null;
    name: string;
    startDate: string;
    endDate: string;
  };
  from: string;
  to: string;
  /** 수집 시작일. `from` 보다 늦으면 그 앞은 "집계 전" 이다. */
  collectedSince: string;
  summary: {
    impressions: number;
    adClicks: number;
    /** 0~1. 분모가 0 이면 null. */
    adClickRate: number | null;
    views: number;
    uniqueVisitors: number;
    memberViews: number;
    memberUniqueVisitors: number;
    ctaClicks: number;
    ctaUniqueVisitors: number;
    ctaUniqueMembers: number;
    ctaClickRate: number | null;
    avgScrollPercent: number | null;
    /**
     * 스크롤 깊이 깔때기. 상세를 연 순 방문자 중 0·25·50·75·100% 까지 내린 순 방문자 수와 비율. 0% 단계는 순 방문자
     * 전체다. 방문자별로 가장 깊이 내린 값으로 센다.
     */
    scrollFunnel: ScrollFunnelStep[];
    avgDurationSeconds: number | null;
  };
  daily: ReportDailyRow[];
  exposures: {
    exposureId: number;
    name: string;
    impressions: number;
    adClicks: number;
    adClickRate: number | null;
  }[];
  targets: {
    targetType: 'JOB' | 'BOOTCAMP';
    targetId: number;
    title: string;
    total: ReportDetailMetrics;
    bySource: { source: ReportSource; views: number; ctaClicks: number }[];
  }[];
}
