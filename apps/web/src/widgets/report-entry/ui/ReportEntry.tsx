'use client';

import type { ReactNode } from 'react';
import { useFeatureFlag } from '@/shared/api/useFeatureFlag';

/** 산업 트렌드 리포트 판매의 진입점 노출을 정하는 플래그 key. */
const INDUSTRY_TREND_REPORT_SALE_FLAG = 'industry_trend_report_sale';

/**
 * 산업 트렌드 리포트 판매로 가는 링크·배너·메뉴 항목을 감싸는 자리. 플래그가 켜졌을 때만 자식을 그리고,
 * 읽는 동안·읽지 못했을 때·플래그가 없을 때는 아무것도 그리지 않는다(`useFeatureFlag`).
 *
 * 켜고 끄는 것은 오공고 안의 진입점뿐이다. 판매 상세와 `/mypage/reports` 는 플래그와 상관없이 주소로 열린다
 * (PRD 7.1). 어느 화면에 놓을지는 정하지 않아 아직 어디에도 놓지 않았다.
 */
export function ReportEntry({ children }: { children: ReactNode }) {
  const enabled = useFeatureFlag(INDUSTRY_TREND_REPORT_SALE_FLAG);
  return enabled ? children : null;
}
