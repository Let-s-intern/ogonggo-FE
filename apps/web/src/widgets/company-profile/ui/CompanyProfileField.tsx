import type { ReactNode } from 'react';

export interface CompanyProfileFieldProps {
  label: string;
  /** 오른쪽 칸의 `id`. 라벨이 그 칸을 가리킨다. */
  htmlFor: string;
  /** 칸 위 회색 안내 한 줄. 목업의 수신용 이메일 칸에만 있다. */
  note?: string;
  children: ReactNode;
}

/**
 * 기업/기관 정보 화면의 한 줄(목업 `docs/asset/v5 기업회원 마이페이지/기업 기관 정보.png`).
 * 왼쪽 라벨, 오른쪽 칸이다.
 */
export function CompanyProfileField({ label, htmlFor, note, children }: CompanyProfileFieldProps) {
  return (
    <div className="flex items-start gap-6">
      {/* `break-keep` 이 없으면 두 줄짜리 라벨이 낱말 가운데서 끊긴다 — 목업은 `오늘의 공고 정보`
          / `수신용 이메일` 로 끊는다. */}
      <label htmlFor={htmlFor} className="w-36 shrink-0 break-keep pt-3 text-sm text-gray-700">
        {label}
      </label>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {note ? <p className="text-xs text-gray-400">{note}</p> : null}
        {children}
      </div>
    </div>
  );
}
