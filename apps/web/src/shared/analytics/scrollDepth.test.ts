import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrollDepthPercent } from './scrollDepth';

const metrics = (scrollTop: number, scrollHeight = 3000, clientHeight = 1000) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
});

test('맨 위는 0 이다', () => {
  assert.equal(scrollDepthPercent(metrics(0)), 0);
});

test('맨 아래는 100 이다', () => {
  assert.equal(scrollDepthPercent(metrics(2000)), 100);
});

test('내릴 수 있는 길이 중 내린 비율이다', () => {
  assert.equal(scrollDepthPercent(metrics(500)), 25);
  assert.equal(scrollDepthPercent(metrics(1000)), 50);
  assert.equal(scrollDepthPercent(metrics(1500)), 75);
});

test('창보다 짧은 글은 100 이다', () => {
  assert.equal(scrollDepthPercent(metrics(0, 800, 1000)), 100);
  assert.equal(scrollDepthPercent(metrics(0, 1000, 1000)), 100);
});

test('범위를 벗어난 값은 0~100 으로 자른다', () => {
  assert.equal(scrollDepthPercent(metrics(2500)), 100);
  assert.equal(scrollDepthPercent(metrics(-30)), 0);
});
