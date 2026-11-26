import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saleInfoRows } from './saleInfo';

const EMPTY = { contentComposition: null, accessMethod: null, recommendedFor: null };

test('렛츠커리어 값이 모두 비면 상세 이미지의 말로 세 줄을 채운다', () => {
  assert.deepEqual(saleInfoRows(EMPTY), [
    { label: '구성', value: '분야별 산업 뉴스 · 취업 관점 · 용어 설명' },
    { label: '열람', value: '결제 후 PDF로 받아요' },
    { label: '대상', value: '산업 트렌드를 자소서에 녹이기 어려운 취준생' },
  ]);
});

test('렛츠커리어 값이 있는 칸은 그 값이 우선한다', () => {
  const rows = saleInfoRows({
    contentComposition: '미션 템플릿',
    accessMethod: null,
    recommendedFor: '취업준비생',
  });
  assert.deepEqual(rows[0], { label: '구성', value: '미션 템플릿' });
  assert.equal(rows[1]?.value, '결제 후 PDF로 받아요');
  assert.deepEqual(rows[2], { label: '대상', value: '취업준비생' });
});

test('공백뿐인 값은 비어 있는 것으로 본다', () => {
  const rows = saleInfoRows({ contentComposition: '  ', accessMethod: '', recommendedFor: ' ' });
  assert.equal(rows.length, 3);
  assert.equal(rows[0]?.value, '분야별 산업 뉴스 · 취업 관점 · 용어 설명');
});
