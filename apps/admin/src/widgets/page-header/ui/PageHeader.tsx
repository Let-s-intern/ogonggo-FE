import { type ReactNode } from 'react';
import { Link } from 'react-router';

export interface PageHeaderProps {
  title: string;
  /** 상세 화면에서 목록으로 돌아가는 링크. `to` 와 `label` 을 함께 넘긴다. */
  backTo?: { to: string; label: string };
  /** 제목 오른쪽. 저장 버튼 등. */
  action?: ReactNode;
}

/** 모든 화면의 제목 줄. 여백과 글자 크기를 한 곳에서 잡는다. */
export function PageHeader({ title, backTo, action }: PageHeaderProps) {
  return (
    <div className="pb-6">
      {backTo ? (
        <Link
          to={backTo.to}
          className="inline-block pb-2 text-sm text-gray-500 hover:text-gray-900"
        >
          ← {backTo.label}
        </Link>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {action}
      </div>
    </div>
  );
}
