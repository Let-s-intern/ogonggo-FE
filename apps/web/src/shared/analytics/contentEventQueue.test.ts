import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AD_ENTRY_KEY,
  AD_ENTRY_TTL_MS,
  FLUSH_DELAY_MS,
  createContentEventQueue,
  detailSource,
  landingSource,
  readVisitorId,
  rememberAdEntry,
  staysInThisTab,
  takeAdEntry,
  type ContentEvent,
  type ContentEventsRequest,
} from './contentEventQueue';

const view = (targetId: number): ContentEvent => ({
  type: 'VIEW',
  targetType: 'JOB',
  targetId,
  exposureId: null,
  source: 'LIST',
});

function setup({ beaconAccepts = true, postStarts = true } = {}) {
  const posted: ContentEventsRequest[] = [];
  const beacons: string[] = [];
  const timers: { callback: () => void; ms: number; cleared: boolean }[] = [];
  const queue = createContentEventQueue({
    getVisitorId: () => 'visitor-1',
    transport: {
      post: (request) => {
        posted.push(request);
        return postStarts;
      },
      beacon: (body) => {
        beacons.push(body);
        return beaconAccepts;
      },
    },
    setTimer: (callback, ms) => {
      const timer = { callback, ms, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      (timer as { cleared: boolean }).cleared = true;
    },
  });
  const fire = () => {
    for (const timer of timers.filter((t) => !t.cleared)) {
      timer.cleared = true;
      timer.callback();
    }
  };
  return { queue, posted, beacons, timers, fire };
}

test('2초 뒤에 모인 것을 한 요청으로 보낸다', () => {
  const { queue, posted, timers, fire } = setup();
  queue.push(view(1));
  queue.push(view(2));
  assert.equal(posted.length, 0);
  assert.equal(timers.length, 1);
  assert.equal(timers[0]?.ms, FLUSH_DELAY_MS);
  fire();
  assert.deepEqual(posted, [{ visitorId: 'visitor-1', events: [view(1), view(2)] }]);
});

test('10건이 차면 기다리지 않고 보내고 타이머를 지운다', () => {
  const { queue, posted, timers } = setup();
  for (let id = 1; id <= 10; id += 1) {
    queue.push(view(id));
  }
  assert.equal(posted.length, 1);
  assert.equal(posted[0]?.events.length, 10);
  assert.equal(timers[0]?.cleared, true);
});

test('떠날 때는 남은 것을 토큰 실은 post 한 번으로 보내고 비콘은 쓰지 않는다', () => {
  const { queue, posted, beacons } = setup();
  for (let id = 1; id <= 9; id += 1) {
    queue.push(view(id));
  }
  queue.flushOnLeave();
  assert.equal(posted.length, 1);
  assert.equal(posted[0]?.visitorId, 'visitor-1');
  assert.equal(posted[0]?.events.length, 9);
  assert.equal(beacons.length, 0);
});

test('post 를 못 시작할 때만 비콘으로 보낸다', () => {
  const { queue, posted, beacons } = setup({ postStarts: false });
  queue.push(view(1));
  queue.flushOnLeave();
  assert.equal(posted.length, 1);
  assert.equal(beacons.length, 1);
  const body = JSON.parse(beacons[0] ?? '') as ContentEventsRequest;
  assert.deepEqual(body, { visitorId: 'visitor-1', events: [view(1)] });
});

test('빈 큐는 아무것도 보내지 않는다', () => {
  const { queue, posted, beacons } = setup();
  queue.flush();
  queue.flushOnLeave();
  assert.equal(posted.length, 0);
  assert.equal(beacons.length, 0);
});

test('보낸 뒤 다시 쌓이면 새 타이머가 걸린다', () => {
  const { queue, posted, timers, fire } = setup();
  queue.push(view(1));
  fire();
  queue.push(view(2));
  assert.equal(timers.length, 2);
  fire();
  assert.equal(posted.length, 2);
});

test('방문자 id 쿠키를 읽고, 모양이 틀리면 버린다', () => {
  assert.equal(
    readVisitorId('a=1; ogg_vid=5f0c2e9e-1b7a-4c1e-9a43-0d2f3b6c7a11; b=2'),
    '5f0c2e9e-1b7a-4c1e-9a43-0d2f3b6c7a11',
  );
  assert.equal(readVisitorId('a=1'), null);
  assert.equal(readVisitorId('ogg_vid=<script>'), null);
  assert.equal(readVisitorId(`ogg_vid=${'a'.repeat(37)}`), null);
});

test('사이트 밖에서 바로 연 상세의 유입 경로', () => {
  const origin = 'https://www.ogonggo.co.kr';
  assert.equal(landingSource('', origin), 'DIRECT');
  assert.equal(landingSource('https://www.google.com/', origin), 'SEARCH');
  assert.equal(landingSource('https://search.naver.com/search.naver?q=x', origin), 'SEARCH');
  assert.equal(landingSource('https://www.instagram.com/', origin), 'EXTERNAL');
  assert.equal(landingSource('https://blog.naver.com/someone/1', origin), 'EXTERNAL');
  assert.equal(landingSource('https://m.blog.naver.com/someone/1', origin), 'EXTERNAL');
  assert.equal(landingSource('https://cafe.naver.com/club', origin), 'EXTERNAL');
  assert.equal(landingSource('https://m.search.naver.com/search.naver?q=x', origin), 'SEARCH');
  assert.equal(landingSource('https://www.ogonggo.co.kr/jobs', origin), 'OTHER');
});

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

test('광고로 들어온 상세는 30분 안에 같은 대상이면 노출 id 를 한 번 읽는다', () => {
  const storage = memoryStorage();
  const entry = {
    targetType: 'JOB',
    targetId: 7,
    exposureId: 31,
    source: 'AD_CARD',
    at: 1000,
  } as const;
  rememberAdEntry(storage, entry);
  assert.deepEqual(takeAdEntry(storage, 'JOB', 7, 1000 + AD_ENTRY_TTL_MS), entry);
  assert.equal(storage.map.has(AD_ENTRY_KEY), false);
  assert.equal(takeAdEntry(storage, 'JOB', 7, 2000), null);
});

test('대상이 다르거나 30분이 지나면 광고 몫이 아니다', () => {
  const storage = memoryStorage();
  const entry = {
    targetType: 'JOB',
    targetId: 7,
    exposureId: 31,
    source: 'BANNER',
    at: 1000,
  } as const;
  rememberAdEntry(storage, entry);
  assert.equal(takeAdEntry(storage, 'BOOTCAMP', 7, 1000), null);
  rememberAdEntry(storage, entry);
  assert.equal(takeAdEntry(storage, 'JOB', 8, 1000), null);
  rememberAdEntry(storage, entry);
  assert.equal(takeAdEntry(storage, 'JOB', 7, 1001 + AD_ENTRY_TTL_MS), null);
});

const click = (overrides: Partial<Parameters<typeof staysInThisTab>[0]> = {}) => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...overrides,
});

test('수정키 없는 왼쪽 클릭만 이 탭이 상세로 옮겨 간다', () => {
  assert.equal(staysInThisTab(click()), true);
  assert.equal(staysInThisTab(click(), '_self'), true);
  assert.equal(staysInThisTab(click({ metaKey: true })), false);
  assert.equal(staysInThisTab(click({ ctrlKey: true })), false);
  assert.equal(staysInThisTab(click({ shiftKey: true })), false);
  assert.equal(staysInThisTab(click({ altKey: true })), false);
  assert.equal(staysInThisTab(click({ button: 1 })), false);
});

test('링크가 새 탭이면 이 탭은 그대로다', () => {
  assert.equal(staysInThisTab(click(), '_blank'), false);
});

const landing = {
  firstJudgement: true,
  navigation: { name: 'https://www.ogonggo.co.kr/jobs/1', type: 'navigate' },
  pathname: '/jobs/1',
  referrer: 'https://www.google.com/',
  ownOrigin: 'https://www.ogonggo.co.kr',
};

test('처음 들어온 그 상세는 이전 페이지 주소로 가른다', () => {
  assert.equal(detailSource(landing), 'SEARCH');
  assert.equal(detailSource({ ...landing, referrer: 'https://blog.naver.com/a/1' }), 'EXTERNAL');
  assert.equal(detailSource({ ...landing, referrer: '' }), 'DIRECT');
});

test('착지를 소비한 뒤에는 같은 주소를 다시 열어도 목록에서 온 것이다', () => {
  assert.equal(detailSource({ ...landing, firstJudgement: false }), 'LIST');
});

test('처음 들어온 페이지가 아닌 상세는 목록에서 온 것이다', () => {
  assert.equal(detailSource({ ...landing, pathname: '/jobs/2' }), 'LIST');
  assert.equal(detailSource({ ...landing, navigation: undefined }), 'LIST');
});

test('새로 고침이나 뒤로 가기로 다시 열린 문서는 처음 referrer 를 쓰지 않는다', () => {
  assert.equal(detailSource({ ...landing, navigation: { ...landing.navigation, type: 'reload' } }), 'OTHER');
  assert.equal(
    detailSource({ ...landing, navigation: { ...landing.navigation, type: 'back_forward' } }),
    'OTHER',
  );
});
