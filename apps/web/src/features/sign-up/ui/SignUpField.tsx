import type { ReactNode } from 'react';

export interface SignUpFieldProps {
  label: string;
  htmlFor: string;
  /** 라벨 뒤 파란 `*`. */
  required?: boolean;
  /** 칸 아래 빨간 문구. */
  error?: string | null;
  children: ReactNode;
}

/**
 * 가입 화면의 라벨 + 입력 + 오류 한 묶음.
 *
 * `@ogonggo/ui` 의 `Field` 와 모양이 달라 따로 둔다. 디자인(`회원가입 기업.png`) 은 라벨이 더 크고 필수 표시가
 * 빨간색이 아니라 파란색이다. 오류 문구는 입력의 `aria-describedby` 로 잇도록 `${htmlFor}-error` id 를 단다.
 */
export function SignUpField({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: SignUpFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-base font-medium text-gray-900">
        {label}
        {required ? <span className="pl-1 text-blue-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** 가입 화면 입력칸의 공통 클래스. 디자인의 칸 높이와 모서리. */
export const SIGN_UP_INPUT_CLASS = 'h-12 rounded-xs';

/** 가입하기 버튼. 막혔을 때 디자인이 파랑이 아니라 회색이다. */
export const SIGN_UP_SUBMIT_CLASS =
  'h-12 w-full rounded-xs disabled:bg-gray-300 disabled:text-white';
