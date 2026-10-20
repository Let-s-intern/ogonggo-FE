import { type ReactNode, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Callout, cn } from '@ogonggo/ui';
import type { RedashQueryResult } from '@/shared/api/redash';
import { formatRetrievedAt } from '../lib/format';
import { ResultTable } from './ResultTable';

interface QueryCardProps {
  title: string;
  description?: string;
  query: UseQueryResult<RedashQueryResult>;
  /** 차트. 넘기면 차트와 표를 오갈 수 있다. 넘기지 않으면 `children` 만 그린다. */
  chart?: (result: RedashQueryResult) => ReactNode;
  /** 차트 대신, 또는 표 자리에 그릴 것. 비우면 결과 전체 표다. */
  children?: (result: RedashQueryResult) => ReactNode;
  /** 제목 줄 오른쪽. 이 카드에만 걸리는 필터 등. */
  action?: ReactNode;
  className?: string;
}

/**
 * Redash 쿼리 하나를 그리는 카드. 불러오는 중·실패·집계 시각을 모든 카드가 같은 모양으로 보여준다.
 *
 * 차트 카드에는 표 보기를 둔다. 색만으로 계열을 가르지 않도록, 또 정확한 값을 옮겨 적을 수 있도록
 * 같은 숫자를 표로도 볼 수 있어야 한다.
 */
export function QueryCard({
  title,
  description,
  query,
  chart,
  children,
  action,
  className,
}: QueryCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const { data, isPending, isError, error, isFetching } = query;

  const body = (result: RedashQueryResult) => {
    if (chart && view === 'chart') {
      return chart(result);
    }
    return children ? children(result) : <ResultTable result={result} maxHeight={360} />;
  };

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 pb-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {description ? <p className="pt-1 text-sm text-gray-500">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {chart ? (
            <div className="flex rounded-md border border-gray-200 p-0.5 text-sm">
              {(['chart', 'table'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  className={cn(
                    'rounded px-2.5 py-1 transition-colors',
                    view === value
                      ? 'bg-gray-100 font-medium text-gray-900'
                      : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  {value === 'chart' ? '차트' : '표'}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={cn('min-h-0 flex-1 transition-opacity', isFetching && data ? 'opacity-50' : '')}
      >
        {isError ? (
          <Callout tone="error">{error.message}</Callout>
        ) : isPending ? (
          <div className="flex h-60 items-center justify-center text-sm text-gray-400">
            불러오는 중입니다.
          </div>
        ) : (
          body(data)
        )}
      </div>

      {data ? (
        <p className="pt-3 text-right text-xs text-gray-400">
          {formatRetrievedAt(data.retrievedAt)} 집계
        </p>
      ) : null}
    </section>
  );
}
