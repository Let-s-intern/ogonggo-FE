import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saleInfoRows } from './saleInfo';

const EMPTY = { contentComposition: null, accessMethod: null, recommendedFor: null };

test('렛츠커리어 값이 모두 비면 기본 세 줄만 준다', () => {
  assert.deepEqual(saleInfoRows(EMPTY), [
    { label: '발행', value: '매주 월요일' },
    { label: '형식', value: 'PDF' },
    { label: '열람', value: '결제 후 내 리포트에서' },
  ]);
});

test('렛츠커리어 값이 있으면 그 값이 기본 문구보다 먼저다', () => {
  assert.deepEqual(
    saleInfoRows({
      contentComposition: '미션 템플릿',
      accessMethod: '노션 복제',
      recommendedFor: '취업준비생',
    }),
    [
      { label: '발행', value: '매주 월요일' },
      { label: '형식', value: '미션 템플릿' },
      { label: '열람', value: '노션 복제' },
      { label: '대상', value: '취업준비생' },
    ],
  );
});

test('공백뿐인 값은 비어 있는 것으로 본다', () => {
  const rows = saleInfoRows({ contentComposition: '  ', accessMethod: '', recommendedFor: ' ' });
  assert.equal(rows.length, 3);
  assert.equal(rows[1]?.value, 'PDF');
});
