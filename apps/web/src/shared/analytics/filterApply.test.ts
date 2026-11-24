import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterApplyEvents, filterToggleEvents } from './filterApply';

const pairs = (events: ReturnType<typeof filterApplyEvents>) =>
  events.map(({ params }) => [params.filter_action, params.filter_value]);

test('값을 더하면 그 값 하나가 선택 한 건이다', () => {
  assert.deepEqual(pairs(filterApplyEvents('employment', [], ['INTERN'])), [['select', 'INTERN']]);
});

test('값을 빼면 그 값 하나가 해제 한 건이다', () => {
  assert.deepEqual(pairs(filterApplyEvents('employment', ['INTERN'], [])), [
    ['deselect', 'INTERN'],
  ]);
});

test('전체로 비우면 값마다 해제 한 건이고 쉼표로 묶지 않는다', () => {
  const events = filterApplyEvents('employment', ['REGULAR', 'INTERN', 'CONTRACT'], []);
  assert.deepEqual(pairs(events), [
    ['deselect', 'REGULAR'],
    ['deselect', 'INTERN'],
    ['deselect', 'CONTRACT'],
  ]);
  assert.ok(events.every(({ params }) => !params.filter_value.includes(',')));
});

test('다른 값으로 바꾸면 해제가 먼저이고 선택이 뒤다', () => {
  assert.deepEqual(pairs(filterApplyEvents('region', ['SEOUL'], ['BUSAN'])), [
    ['deselect', 'SEOUL'],
    ['select', 'BUSAN'],
  ]);
});

test('그대로 둔 값은 보내지 않는다', () => {
  assert.deepEqual(pairs(filterApplyEvents('experience', ['A', 'B'], ['B', 'C'])), [
    ['deselect', 'A'],
    ['select', 'C'],
  ]);
});

test('바뀐 것이 없으면 이벤트가 없다', () => {
  assert.deepEqual(filterApplyEvents('employment', ['A', 'B'], ['B', 'A']), []);
  assert.deepEqual(filterApplyEvents('employment', [], []), []);
});

test('같은 값이 겹쳐 들어 있어도 한 번만 센다', () => {
  assert.deepEqual(pairs(filterApplyEvents('employment', [], ['A', 'A'])), [['select', 'A']]);
});

test('이벤트 이름과 키는 명세 그대로다', () => {
  assert.deepEqual(filterApplyEvents('employment', [], ['A']), [
    {
      event: 'filter_apply',
      params: { filter_type: 'employment', filter_value: 'A', filter_action: 'select' },
    },
  ]);
});

test('꺼진 값을 누르면 선택 한 건이다', () => {
  assert.deepEqual(pairs(filterToggleEvents('employment', ['A'], 'B')), [['select', 'B']]);
});

test('켜진 값을 누르면 해제 한 건이다', () => {
  assert.deepEqual(pairs(filterToggleEvents('employment', ['A', 'B'], 'B')), [['deselect', 'B']]);
});

test('마지막 값을 골라 전체가 되어도 누른 값 한 건이다', () => {
  assert.deepEqual(pairs(filterToggleEvents('employment', ['A', 'B'], 'C')), [['select', 'C']]);
});

test('하나만 고르는 묶음은 골라 둔 다른 값의 해제가 앞에 붙는다', () => {
  assert.deepEqual(pairs(filterToggleEvents('region', ['SEOUL'], 'BUSAN', true)), [
    ['deselect', 'SEOUL'],
    ['select', 'BUSAN'],
  ]);
  assert.deepEqual(pairs(filterToggleEvents('region', [], 'BUSAN', true)), [['select', 'BUSAN']]);
  assert.deepEqual(pairs(filterToggleEvents('region', ['BUSAN'], 'BUSAN', true)), [
    ['deselect', 'BUSAN'],
  ]);
});
