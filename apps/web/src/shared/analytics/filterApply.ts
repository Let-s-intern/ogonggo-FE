/**
 * GTM `filter_apply` 이벤트를 만드는 순수 함수. 규칙은 하나다 — **값 하나에 한 건**이고, 선택(`select`)과
 * 해제(`deselect`)를 모두 보낸다. 값 여러 개를 쉼표로 묶어 한 건에 싣지 않는다.
 *
 * `dataLayer.ts` 를 가져오지 않는다. 단위 테스트가 그 파일의 `@/` 경로를 풀지 못해서다. 모양은
 * `DataLayerEvent` 와 같아 그대로 `track` 에 넘길 수 있다.
 */
export type FilterAction = 'select' | 'deselect';

export interface FilterApplyEvent {
  event: 'filter_apply';
  params: { filter_type: string; filter_value: string; filter_action: FilterAction };
}

function filterApplyEvent(
  filterType: string,
  value: string,
  action: FilterAction,
): FilterApplyEvent {
  return {
    event: 'filter_apply',
    params: { filter_type: filterType, filter_value: value, filter_action: action },
  };
}

/**
 * 묶음 하나의 선택이 `before` 에서 `after` 로 바뀔 때 나갈 이벤트. 빠진 값마다 해제, 더해진 값마다
 * 선택이고 해제가 먼저다. 둘이 같으면 목록이 바뀌지 않아 없다. 같은 값이 두 번 들어 있어도 한 번만 센다.
 */
export function filterApplyEvents(
  filterType: string,
  before: readonly string[],
  after: readonly string[],
): FilterApplyEvent[] {
  const unique = (values: readonly string[]) => [...new Set(values)];
  const kept = new Set(after);
  const previous = new Set(before);
  return [
    ...unique(before)
      .filter((value) => !kept.has(value))
      .map((value) => filterApplyEvent(filterType, value, 'deselect')),
    ...unique(after)
      .filter((value) => !previous.has(value))
      .map((value) => filterApplyEvent(filterType, value, 'select')),
  ];
}

/**
 * 값 하나를 눌러 켜거나 끌 때 나갈 이벤트. 누른 값 한 건이다. 하나만 고르는 묶음(`single`)에서 다른 값이
 * 골라져 있었다면 그 값의 해제가 앞에 붙는다 — 켜면 다른 값이 꺼지기 때문이다.
 *
 * `after - before` 로 구하지 않는 이유: 전부 고르면 `전체` 로 보고 선택을 비우는 규칙(`toggleSelection`)이
 * 있어, 마지막 값을 골랐을 때 차이를 보면 나머지 전부가 해제된 것으로 나온다. 사용자가 한 일은 값 하나를 고른 것이다.
 */
export function filterToggleEvents(
  filterType: string,
  current: readonly string[],
  value: string,
  single = false,
): FilterApplyEvent[] {
  if (current.includes(value)) {
    return [filterApplyEvent(filterType, value, 'deselect')];
  }
  const replaced = single ? current : [];
  return [
    ...replaced.map((other) => filterApplyEvent(filterType, other, 'deselect')),
    filterApplyEvent(filterType, value, 'select'),
  ];
}
