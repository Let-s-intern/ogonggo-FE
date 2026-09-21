import type { ReactNode } from 'react';

export interface ProfileFieldProps {
  label: string;
  /** 오른쪽 칸의 `id`. 라벨이 그 칸을 가리킨다. */
  htmlFor: string;
  /** 칸 위 회색 안내 한 줄. 목업의 수신용 이메일 칸에만 있다. */
  note?: string;
  children: ReactNode;
}

/**
 * 개인 정보 화면의 한 줄(목업 `docs/asset/v4 마이페이지/개인정보/image.png`). 왼쪽 라벨,
 * 오른쪽 칸이다.
 *
 * 가입 화면의 `SignUpField`(라벨이 칸 위) 와 배치가 다르다. 그쪽은 입력만 있는 좁은 단이고
 * 이쪽은 넓은 본문이라, 목업이 라벨을 왼쪽으로 뺐다.
 */
export function ProfileField({ label, htmlFor, note, children }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-6">
      <label htmlFor={htmlFor} className="w-36 shrink-0 pt-3 text-sm text-gray-700">
        {label}
      </label>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {note ? <p className="text-xs text-gray-400">{note}</p> : null}
        {children}
      </div>
    </div>
  );
}
