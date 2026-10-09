'use client';

import { useId, useState } from 'react';
import type { Competency } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';

/**
 * 이력서에 담을 경험(`docs/asset/v12 채용공고 상세/상세 기본.webp`). 역량 이름 칩을 하나 고르면 그 역량을
 * 요구하는 공고 속 문장(`quote`)과, 연결해 볼 만한 경험(`experiences`)이 아래에 바뀐다. 처음에는 첫 칩이
 * 골라져 있다.
 *
 * `description`(그 역량이 왜 중요하고 전형에서 어떻게 확인되는지에 대한 설명)은 시안에 자리가 없다. `공고 속
 * 문구` 상자는 공고에 실제로 있는 문장만 담는 곳이라 설명을 그 안에 섞지 않고, 상자 아래에 작은 회색 글로
 * 둔다.
 *
 * 칩이 하나도 없으면 아무것도 그리지 않는다. 다른 공고로 넘어갈 때는 부르는 쪽이 `key` 로 새로 시작시킨다.
 */
export function CompetencySection({ competencies }: { competencies: Competency[] }) {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const current = competencies[selected] ?? competencies[0];
  if (!current) {
    return null;
  }

  const tabId = (index: number) => `${id}-tab-${index}`;
  const panelId = `${id}-panel`;
  const selectedIndex = competencies.indexOf(current);

  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-lg font-bold text-gray-900">이력서에 담을 경험</h2>
        <p className="text-xs text-gray-400">
          공고에서 강조하는 역량과 연결할 수 있는 경험을 살펴보세요
        </p>
      </div>
      <div role="tablist" aria-label="역량" className="mt-4 flex flex-wrap gap-2">
        {competencies.map((competency, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={`${index}-${competency.name}`}
              id={tabId(index)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              onClick={() => setSelected(index)}
              className={cn(
                'rounded-md border px-3 py-2 text-sm transition-colors',
                isSelected
                  ? 'border-blue-500 bg-blue-500 font-medium text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              {competency.name}
            </button>
          );
        })}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(selectedIndex)}
        className="mt-3 flex flex-col gap-3"
      >
        <div className="rounded-lg border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">공고 속 문구</p>
          <p className="mt-2 text-sm text-gray-900">{current.quote}</p>
        </div>
        {current.description ? (
          <p className="px-1 text-xs leading-5 text-gray-500">{current.description}</p>
        ) : null}
        {current.experiences.length > 0 ? (
          <div className="rounded-lg bg-blue-50 px-4 py-3.5">
            <p className="text-xs font-semibold text-gray-900">이런 경험이 있다면 적어보세요</p>
            <ol className="mt-2.5 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-gray-700">
              {current.experiences.map((experience, index) => (
                <li key={`${index}-${experience}`}>{experience}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
