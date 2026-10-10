import { Fragment } from 'react';
import type { Task } from '@ogonggo/api';

/**
 * 담당 업무를 일의 성격(`tag`)과 문장으로 그린다(`docs/asset/v12 채용공고 상세/상세 기본.webp` 의
 * `기획` `제품화` `협업` 칩). 태그 칸은 가장 긴 태그에 맞춰 한 폭으로 늘어나서 문장 시작 자리가 줄마다
 * 같다. 모바일에서 문장이 길어져도 칩 오른쪽에서 줄바꿈한다.
 *
 * 부르는 쪽이 `tasks` 가 하나 이상일 때만 이 컴포넌트를 쓴다.
 */
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2.5">
      {tasks.map((task, index) => (
        <Fragment key={`${index}-${task.tag}`}>
          <dt className="min-w-12 rounded-md bg-blue-50 px-2 py-1 text-center text-xs leading-4 font-medium text-blue-500">
            {task.tag}
          </dt>
          <dd className="min-w-0 text-sm leading-6 text-gray-700">{task.text}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
