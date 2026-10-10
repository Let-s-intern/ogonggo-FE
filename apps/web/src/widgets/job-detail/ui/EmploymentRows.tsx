import type { Employment } from '@ogonggo/api';
import { Condition, FactText } from './ConditionRow';

/**
 * 근무 조건 네 줄(`docs/asset/v12 채용공고 상세/상세 기본.webp`): 형태, 전환, 급여, 소속. 값이 없는 줄도
 * 지우지 않고 `공고에 명시 없음` 으로 둔다 — 시안이 그렇고, 줄이 사라지면 공고에 없다는 사실이 가려진다.
 * `note` 는 값 옆에 작은 회색 글로 붙는다.
 *
 * 부르는 쪽이 네 줄 중 하나라도 값이나 `note` 가 있을 때만 이 컴포넌트를 쓴다.
 */
export function EmploymentRows({ employment }: { employment: Employment }) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <Condition label="형태">
        <FactText fact={employment.type} />
      </Condition>
      <Condition label="전환">
        <FactText fact={employment.conversion} />
      </Condition>
      <Condition label="급여">
        <FactText fact={employment.salary} />
      </Condition>
      <Condition label="소속">
        <FactText fact={employment.affiliation} />
      </Condition>
    </dl>
  );
}
