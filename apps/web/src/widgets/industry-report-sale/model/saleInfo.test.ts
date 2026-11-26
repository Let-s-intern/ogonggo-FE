import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saleInfoRows } from './saleInfo';

const EMPTY = { contentComposition: null, accessMethod: null, recommendedFor: null };

test('렛츠커리어 값이 모두 비면 줄이 없다(대체 문구를 만들지 않는다)', () => {
  assert.deepEqual(saleInfoRows(EMPTY), []);
});

test('값이 있는 칸만 그 값 그대로 줄이 된다', () => {
  assert.deepEqual(
    saleInfoRows({
      contentComposition: '미션 템플릿',
      accessMethod: null,
      recommendedFor: '취업준비생',
    }),
    [
      { label: '구성', value: '미션 템플릿' },
      { label: '대상', value: '취업준비생' },
    ],
  );
});

test('공백뿐인 값은 비어 있는 것으로 본다', () => {
  assert.deepEqual(
    saleInfoRows({ contentComposition: '  ', accessMethod: '', recommendedFor: ' ' }),
    [],
  );
});
