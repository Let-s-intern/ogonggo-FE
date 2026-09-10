import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** 버튼 등. 없으면 문구만 나간다. */
  action?: ReactNode;
  className?: string;
}

/** 목록이 비었거나 아직 아무것도 없을 때. 빈 화면을 그냥 두지 않기 위한 것이다. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <p className="font-medium text-gray-900">{title}</p>
      {description ? <p className="pt-1 text-sm text-gray-500">{description}</p> : null}
      {action ? <div className="pt-4">{action}</div> : null}
    </div>
  );
}
