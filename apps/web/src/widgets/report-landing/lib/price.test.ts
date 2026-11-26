import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commonFinalPrice, landingPrice } from './price';

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

test('다섯 가격이 같으면 그 금액을 준다', () => {
  assert.equal(commonFinalPrice([p990, p990, p990, p990, p990]), '990원');
});

test('하나라도 다르거나 읽지 못했으면 null 이다', () => {
  assert.equal(commonFinalPrice([p990, p990, { ...p990, finalPrice: 1900 }, p990, p990]), null);
  assert.equal(commonFinalPrice([p990, null, p990, p990, p990]), null);
  assert.equal(commonFinalPrice([]), null);
});
