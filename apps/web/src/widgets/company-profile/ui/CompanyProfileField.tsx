import type { ReactNode } from 'react';

export interface CompanyProfileFieldProps {
  label: string;
  /** 오른쪽 칸의 `id`. 라벨이 그 칸을 가리킨다. */
  htmlFor: string;
  children: ReactNode;
}

/**
 * 기업/기관 정보 화면의 한 줄(목업 `docs/asset/v5 기업회원 마이페이지/기업 기관 정보.png`).
 * 왼쪽 라벨, 오른쪽 칸이다.
 */
export function CompanyProfileField({ label, htmlFor, children }: CompanyProfileFieldProps) {
  return (
    <div className="flex items-start gap-6">
      <label htmlFor={htmlFor} className="w-36 shrink-0 pt-3 text-sm text-gray-700">
        {label}
      </label>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}
