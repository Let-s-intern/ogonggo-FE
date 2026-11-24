import type { MyAdvertisementContractProductResponse } from '@ogonggo/api';

/**
 * 상품별 리포트 응답(`광고-리포트-API-계약-2026-11-19.md` 3절). 백엔드(Push 3) 배포 전이라 생성 타입이 없어 계약을 그대로
 * 옮겨 적는다. 배포 뒤 `api-codegen` 이 만든 타입으로 바꾼다(task 7.1).
 */

/** 리포트를 못 여는 이유. 기간을 아직 안 넣었거나(`NO_PERIOD`), 오늘의 공고 화면 밖 채널 상품이다(`NOT_EXPOSABLE`). */
export type ReportUnavailableReason = 'NO_PERIOD' | 'NOT_EXPOSABLE';

/** 계약 상세의 `products[]`. 리포트를 열 수 있는지(`reportAvailable`)와 못 여는 이유를 함께 가진다. */
export type ReportableProduct = MyAdvertisementContractProductResponse;

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
    /** 상품의 소개용 가격(정가, 원). 비용 효율의 광고비다. 견적 문의 상품은 null 이고 배포 전 응답에는 없다. */
    price?: number | null;
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
     * 전체다. 방문자별로 가장 깊이 내린 값으로 센다. 배너 상품은 null 이다(계약 5절, 배너는 상세 페이지가 아니다).
     */
    scrollFunnel: ScrollFunnelStep[] | null;
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
    total: ReportDetailMetrics & {
      /** 기간 안에 저장했고 지금도 저장 중인 사람 수. */
      saves: number;
      shares: number;
    };
    bySource: { source: ReportSource; views: number; ctaClicks: number }[];
  }[];
  /** 로그인 회원의 희망 직무별 나눔(계약 6.1). 비회원은 없다. 회원 순 방문자 큰 순. */
  byJobField: JobFieldRow[];
  /** 상품 몫을 본 사람의 구성. */
  audience: ReportAudience;
  /** 운영자가 써서 보낸 인사이트. 보내지 않은 임시 저장은 오지 않는다. 인사이트 배포(LC-3657) 전 응답에는 없다. */
  insights?: { title: string; body: string }[];
}

/**
 * 도달·평균 빈도는 기간 동안 광고를 본 서로 다른 사람(회원·비회원 합) 기준이다. 원본 보관 기간(365일)보다 앞날이 걸리면
 * `reach`·`avgFrequency`·`adClickVisitors` 가 null 이다.
 */
export interface ReportAudience {
  reach: number | null;
  avgFrequency: number | null;
  adClickVisitors: number | null;
  /** 광고가 띄우는 공고의 직군과 노출을 띄우는 직군 탭. 없으면 빈 배열이고 일치율은 null. */
  targetJobFields: string[];
  targetMatch: {
    matchedMembers: number;
    members: number;
    /** 0~1. 타깃 직군이 없거나 공고를 연 회원이 없으면 null. */
    rate: number | null;
  };
  /** 공고를 연 로그인 회원의 학년. 학년 순이고 미설정이 맨 뒤. */
  byGrade: { grade: string | null; label: string; memberUniqueVisitors: number }[];
}

export interface JobFieldRow {
  /** 희망 직무 enum 값. 직무를 안 정한 회원은 null. */
  jobField: string | null;
  label: string;
  memberUniqueVisitors: number;
  memberViews: number;
  ctaUniqueMembers: number;
  adClickMembers: number;
}

/** 계약 전체 합계(`GET .../{contractId}/report-summary`, 계약 6.2). 리포트를 열 수 있는 상품만 합친다. */
export interface ContractReportSummary {
  total: {
    impressions: number;
    adClicks: number;
    adClickRate: number | null;
    views: number;
    ctaClicks: number;
  };
  products: {
    contractProductId: number;
    category: string;
    position: string | null;
    name: string;
    startDate: string;
    endDate: string;
    impressions: number;
    adClicks: number;
    views: number;
    ctaClicks: number;
  }[];
}

/**
 * 대시보드의 진행 중 광고 요약 한 줄(`GET /api/v1/users/me/advertisement-reports/active`, 계약 4절). 숫자는 상품 시작일부터
 * 오늘까지의 상품 몫이다.
 */
export interface ActiveAd {
  contractId: number;
  contractProductId: number;
  category: string;
  position: string | null;
  name: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  impressions: number;
  adClicks: number;
  adClickRate: number | null;
  views: number;
  ctaClicks: number;
  /** 스크롤 50% 까지 내린 순 방문자 비율(0~1). */
  scroll50Rate: number | null;
  /** 광고 공고 상품이 걸린 공고·부트캠프. 카드는 상품명 아래 제목 한 줄만 쓴다. */
  target: { targetType: 'JOB' | 'BOOTCAMP'; targetId: number; title: string } | null;
  /** 수집 시작일. 카드 그래프는 이 날부터 그린다. */
  collectedSince: string;
  daily: { date: string; impressions: number; adClicks: number; views: number }[];
}
