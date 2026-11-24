import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claimSignUpEvent, SIGN_UP_SENT_KEY } from './signUpOnce';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    map,
  };
}

test('처음은 보내고 표식을 남긴다', () => {
  const storage = memoryStorage();
  assert.equal(claimSignUpEvent(storage), true);
  assert.equal(storage.map.get(SIGN_UP_SENT_KEY), '1');
});

test('같은 세션의 두 번째부터는 보내지 않는다', () => {
  const storage = memoryStorage();
  assert.equal(claimSignUpEvent(storage), true);
  assert.equal(claimSignUpEvent(storage), false);
  assert.equal(claimSignUpEvent(storage), false);
});

test('저장소가 없으면 중복을 가릴 수 없어 보낸다', () => {
  assert.equal(claimSignUpEvent(undefined), true);
});

test('저장소가 던져도 보낸다', () => {
  const broken = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
  assert.equal(claimSignUpEvent(broken), true);
});
