import { enumLabel } from '@ogonggo/api';
import type { ReportableProduct, ReportSource } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** 오늘(브라우저 시간대). 리포트 날짜는 KST 이고 이 화면을 여는 사람도 KST 라 그대로 쓴다. */
export function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `2026-11-05` → `11.05`. */
export const shortDate = (ymd: string) => `${ymd.slice(5, 7)}.${ymd.slice(8, 10)}`;

/** `2026-11-05` → `2026.11.05`. */
export const dotDate = (ymd: string) => ymd.replaceAll('-', '.');

export const formatCount = (value: number) => value.toLocaleString('ko-KR');

/** 0~1 비율을 `2.4%` 로. 분모가 0 이라 null 이면 `-`. */
export const formatRate = (value: number | null) =>
  value == null ? '-' : `${(value * 100).toFixed(1)}%`;

export const formatPercent = (value: number | null) =>
  value == null ? '-' : `${value.toFixed(1)}%`;

/** 초를 `41초`, `1분 5초` 로. */
export function formatSeconds(value: number | null): string {
  if (value == null) return '-';
  const total = Math.round(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
}

/** 광고 공고 자리는 enum 카탈로그에 아직 없다(백엔드 Push 5 배포 전). 그동안 여기 이름을 쓴다. */
const NEW_POSITION_LABELS: Record<string, string> = {
  JOB_LIST: '채용공고 목록',
  BOOTCAMP_LIST: '부트캠프 목록',
  JOB_DETAIL_SIDE: '공고 상세 옆 추천',
};

export function positionLabel(position: string): string {
  const label = enumLabel('AdvertisementProductPosition', position);
  return label === position ? (NEW_POSITION_LABELS[position] ?? position) : label;
}

export const SOURCE_LABELS: Record<ReportSource, string> = {
  AD_CARD: '광고 카드',
  BANNER: '배너',
  LIST: '일반 목록',
  SEARCH: '검색',
  DIRECT: '직접 방문',
  EXTERNAL: '외부',
  OTHER: '기타',
};

export type ProductProgress = 'NO_PERIOD' | 'SCHEDULED' | 'RUNNING' | 'ENDED';

/** 상품의 진행 상태. 날짜 문자열은 같은 모양이라 글자로 비교한다. */
export function productProgress(product: ReportableProduct, today = todayYmd()): ProductProgress {
  if (!product.startDate || !product.endDate) return 'NO_PERIOD';
  if (today < product.startDate) return 'SCHEDULED';
  if (today > product.endDate) return 'ENDED';
  return 'RUNNING';
}

export const PROGRESS_LABELS: Record<ProductProgress, string> = {
  NO_PERIOD: '기간 미정',
  SCHEDULED: '시작 전',
  RUNNING: '진행 중',
  ENDED: '종료',
};

/**
 * 리포트를 열 수 있는지. 응답의 `reportAvailable` 을 먼저 믿고, 그 칸이 없는 응답(백엔드 배포 전)이면 기간이 있는지로
 * 가늠한다. 시작 전인 상품은 볼 숫자가 없어 열지 않는다.
 */
export function unavailableReason(
  product: ReportableProduct,
): 'NO_PERIOD' | 'NOT_EXPOSABLE' | 'SCHEDULED' | null {
  if (product.reportAvailable === false) {
    return product.reportUnavailableReason ?? 'NOT_EXPOSABLE';
  }
  const progress = productProgress(product);
  if (progress === 'NO_PERIOD') return 'NO_PERIOD';
  if (progress === 'SCHEDULED') return 'SCHEDULED';
  return null;
}

export const UNAVAILABLE_MESSAGES: Record<'NO_PERIOD' | 'NOT_EXPOSABLE' | 'SCHEDULED', string> = {
  NO_PERIOD: '게시 기간이 정해지면 이 상품의 리포트를 볼 수 있어요.',
  NOT_EXPOSABLE:
    '카카오톡·인스타그램처럼 오늘의 공고 밖에서 나가는 상품은 숫자를 모으지 않아 리포트가 없어요.',
  SCHEDULED: '게시가 시작되면 이 상품의 리포트를 볼 수 있어요.',
};
