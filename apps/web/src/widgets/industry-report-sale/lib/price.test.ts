import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceView } from './price';

test('할인이 있으면 정가와 할인율을 함께 준다', () => {
  assert.deepEqual(priceView({ originalPrice: 50000, discountRate: 22, finalPrice: 39000 }), {
    final: '39,000원',
    discount: { original: '50,000원', rate: 22 },
  });
});

test('할인이 없으면 결제 금액만 준다', () => {
  assert.deepEqual(priceView({ originalPrice: 990, discountRate: 0, finalPrice: 990 }), {
    final: '990원',
    discount: null,
  });
});

test('0원이면 무료다', () => {
  assert.equal(priceView({ originalPrice: 0, discountRate: 0, finalPrice: 0 }).final, '무료');
});
