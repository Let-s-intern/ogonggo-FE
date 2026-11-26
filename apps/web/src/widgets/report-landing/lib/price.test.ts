import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landingPrice } from './price';

const p990 = { originalPrice: 990, discountRate: 0, finalPrice: 990 };

test('할인이 없으면 결제 금액만 준다', () => {
  assert.deepEqual(landingPrice(p990), { final: '990원', original: null });
});

test('할인 중이면 정가를 함께 준다', () => {
  assert.deepEqual(landingPrice({ originalPrice: 1500, discountRate: 34, finalPrice: 990 }), {
    final: '990원',
    original: '1,500원',
  });
});

test('0원이면 무료다', () => {
  assert.equal(landingPrice({ originalPrice: 0, discountRate: 0, finalPrice: 0 })?.final, '무료');
});

test('가격을 읽지 못했으면 null 이다', () => {
  assert.equal(landingPrice(null), null);
});
