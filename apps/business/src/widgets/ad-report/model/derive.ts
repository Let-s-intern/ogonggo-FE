import { formatCount } from './format';
import type { AdReport } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `2026-11-05` 두 날짜 사이 일수(양 끝 포함). 날짜 문자열은 UTC 자정으로 읽어 시간대에 흔들리지 않는다. */
export function inclusiveDays(from: string, to: string): number {
  const diff = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
  return Math.max(0, Math.round(diff) + 1);
}

/** `2026-11-19` → `11.19 (목)`. 오늘이면 뒤에 `· 집계 중` 을 붙인다. 오늘은 하루치가 다 모이지 않았다. */
export function dayLabel(ymd: string, today: string): string {
  const weekday = WEEKDAYS[new Date(`${ymd}T00:00:00Z`).getUTCDay()];
  const label = `${ymd.slice(5, 7)}.${ymd.slice(8, 10)} (${weekday})`;
  return ymd === today ? `${label} · 집계 중` : label;
}

/** 게시 진행. 게시 기간 중 오늘까지 지난 날(시작 전 0, 끝난 뒤 전체)과 전체 일수. */
export function publishProgress(
  startDate: string,
  endDate: string,
  today: string,
): { elapsed: number; total: number } {
  const total = inclusiveDays(startDate, endDate);
  const last = today < endDate ? today : endDate;
  return { elapsed: Math.min(total, inclusiveDays(startDate, last)), total };
}

/** 분모가 0 이면 null. */
export const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;

export interface CostItem {
  label: string;
  /** 계산할 수 없으면(분모 0) `-`. */
  value: string;
  sub: string;
}

export interface CostEfficiency {
  /** 리포트 기간에 해당하는 광고비(원). 기간을 좁혔으면 정가를 일수로 나눈 값이다. */
  cost: number;
  /** 정가 전체가 아니라 일부 기간 몫이면 그 일수 `[리포트 일수, 게시 일수]`. */
  prorated: [number, number] | null;
  items: CostItem[];
}

const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;

/**
 * 비용 효율. 광고비는 상품 정가다 — 무료 혜택이어도 정가로 환산한다(2026-11-23 목업). 견적 문의 상품(정가 없음)과
 * 정가 0원(무료) 상품은 null.
 * 기간을 좁히거나 아직 진행 중이면 정가를 게시 일수로 나눠 리포트 일수만큼만 쓴다. 하루치 숫자에 한 달 광고비를 나누면
 * 단가가 부풀기 때문이다.
 */
export function costEfficiency(report: AdReport, banner: boolean): CostEfficiency | null {
  const price = report.product.price;
  if (price == null || price === 0) return null;
  const total = inclusiveDays(report.product.startDate, report.product.endDate);
  const days = inclusiveDays(report.from, report.to);
  const prorated = days > 0 && days < total ? ([days, total] as [number, number]) : null;
  const cost = prorated ? (price * days) / total : price;
  const { summary } = report;
  const per = (count: number) => (count > 0 ? won(cost / count) : '-');
  const clickLabel = banner ? '클릭' : '조회';
  const items: CostItem[] = [
    {
      label: '노출 1,000회당 비용',
      value: summary.impressions > 0 ? won((cost / summary.impressions) * 1000) : '-',
      sub: `광고비 ÷ ${formatCount(summary.impressions)} × 1,000`,
    },
    {
      label: `${clickLabel}당 비용`,
      value: per(summary.adClicks),
      sub: `광고비 ÷ ${clickLabel} ${formatCount(summary.adClicks)}`,
    },
  ];
  if (!banner || summary.ctaClicks > 0) {
    items.push({
      label: '지원하기 클릭당 비용',
      value: per(summary.ctaClicks),
      sub: `광고비 ÷ 지원하기 클릭 ${formatCount(summary.ctaClicks)}`,
    });
  }
  return { cost, prorated, items };
}

export const GRADUATE_GRADE = 'GRADUATE';

/**
 * 학년 칸을 목업의 신분으로 묶는다. 오공고에는 신분이 없고 학년만 있어, 1~4학년·5학년 이상은 재학, 졸업생은 졸업으로 본다.
 * 졸업 예정은 따로 받지 않아 나누지 못한다. 학년을 적지 않은 회원은 미설정이다.
 */
export function statusCounts(byGrade: AdReport['audience']['byGrade']): {
  studying: number;
  graduated: number;
  unset: number;
} {
  const sum = (pick: (row: AdReport['audience']['byGrade'][number]) => boolean) =>
    byGrade.filter(pick).reduce((acc, row) => acc + row.memberUniqueVisitors, 0);
  return {
    studying: sum((row) => row.grade != null && row.grade !== GRADUATE_GRADE),
    graduated: sum((row) => row.grade === GRADUATE_GRADE),
    unset: sum((row) => row.grade == null),
  };
}

/** `조회` → `조회율`, `클릭` → `클릭률`. */
export const rateLabelOf = (clickLabel: string) => (clickLabel === '클릭' ? '클릭률' : '조회율');
