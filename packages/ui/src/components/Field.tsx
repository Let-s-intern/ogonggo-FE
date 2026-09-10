import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface FieldProps {
  label: string;
  /** 없으면 `label` 이 `htmlFor` 없이 렌더된다 — 항상 넘기는 편이 낫다. */
  htmlFor?: string;
  /** 입력 아래 회색 보조 문구. */
  hint?: string;
  /** 있으면 hint 대신 빨간 문구가 나간다. */
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** 라벨 + 입력 + 보조 문구 한 묶음. 폼 화면의 세로 리듬을 한 곳에서 잡는다. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('pb-4', className)}>
      <label htmlFor={htmlFor} className="block pb-1.5 text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="pl-0.5 text-error">*</span> : null}
      </label>
      {children}
      {error ? <p className="pt-1.5 text-sm text-error">{error}</p> : null}
      {!error && hint ? <p className="pt-1.5 text-sm text-gray-500">{hint}</p> : null}
    </div>
  );
}
