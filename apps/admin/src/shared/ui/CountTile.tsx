import { type ReactNode } from 'react';

interface CountTileProps {
  label: ReactNode;
  value: ReactNode;
}

/**
 * 집계 한 칸. 알림 발송 요약과 발송 결과 상세가 같은 모양을 쓴다.
 *
 * `@ogonggo/ui` 의 `StatTile` 은 대시보드 KPI 용이라 숫자가 크고(`text-5xl`) 숫자만 받는다. 여기는 한 줄에 대여섯
 * 칸이 서고 `개별 발송` 같은 낱말도 들어간다.
 */
export function CountTile({ label, value }: CountTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-gray-50 px-3.5 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  );
}
