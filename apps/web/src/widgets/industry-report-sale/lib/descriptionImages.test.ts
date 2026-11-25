import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDescriptionImages } from './descriptionImages';

const state = (children: unknown[]) => JSON.stringify({ root: { type: 'root', children } });

test('문단과 링크 안의 이미지를 나온 순서대로 뽑는다', () => {
  const description = state([
    {
      type: 'paragraph',
      children: [{ type: 'image', src: 'https://a.test/1.png', altText: '하나' }],
    },
    { type: 'paragraph', children: [{ type: 'text', text: '글자' }] },
    {
      type: 'paragraph',
      children: [
        { type: 'link', children: [{ type: 'image', src: 'https://a.test/2.png', altText: '' }] },
      ],
    },
  ]);
  assert.deepEqual(extractDescriptionImages(description), [
    { src: 'https://a.test/1.png', alt: '하나' },
    { src: 'https://a.test/2.png', alt: '' },
  ]);
});

test('http 가 아닌 주소와 주소 없는 이미지는 버린다', () => {
  const description = state([
    { type: 'image', src: 'javascript:alert(1)' },
    { type: 'image', src: 'data:image/png;base64,AAAA' },
    { type: 'image' },
    { type: 'image', src: 'http://a.test/ok.png' },
  ]);
  assert.deepEqual(extractDescriptionImages(description), [
    { src: 'http://a.test/ok.png', alt: '' },
  ]);
});

test('비었거나 읽을 수 없거나 모양이 다르면 빈 목록이다', () => {
  assert.deepEqual(extractDescriptionImages(null), []);
  assert.deepEqual(extractDescriptionImages(''), []);
  assert.deepEqual(extractDescriptionImages('{깨진 JSON'), []);
  assert.deepEqual(extractDescriptionImages('[]'), []);
  assert.deepEqual(extractDescriptionImages(JSON.stringify({ root: 'x' })), []);
});
