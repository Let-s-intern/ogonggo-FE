import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bannerLink, bannerTarget } from './bannerLink';

test('사이트 안 경로는 같은 탭이고 그대로다', () => {
  assert.deepEqual(bannerLink('/jobs/1'), { href: '/jobs/1', newTab: false });
});

test('외부 주소는 새 탭이다', () => {
  assert.deepEqual(bannerLink('https://www.letscareer.co.kr/x'), {
    href: 'https://www.letscareer.co.kr/x',
    newTab: true,
  });
});

test('우리 사이트의 절대 주소는 경로로 바꿔 같은 탭이다', () => {
  assert.deepEqual(bannerLink('https://www.ogonggo.co.kr/jobs/1'), {
    href: '/jobs/1',
    newTab: false,
  });
  assert.deepEqual(bannerLink('http://ogonggo.co.kr/bootcamps/7?ref=a#top'), {
    href: '/bootcamps/7?ref=a#top',
    newTab: false,
  });
});

test('호스트 이름이 비슷한 다른 사이트는 외부다', () => {
  assert.equal(bannerLink('https://www.ogonggo.co.kr.evil.com/jobs/1').newTab, true);
  assert.equal(bannerLink('https://ogonggo.co.krx/jobs/1').newTab, true);
  assert.equal(bannerLink('https://biz.ogonggo.co.kr/').newTab, true);
});

test('공고·부트캠프 상세 경로면 대상을 준다', () => {
  assert.deepEqual(bannerTarget('/jobs/12'), { targetType: 'JOB', targetId: 12 });
  assert.deepEqual(bannerTarget('/bootcamps/3?x=1'), { targetType: 'BOOTCAMP', targetId: 3 });
  assert.equal(bannerTarget('/jobs'), null);
  assert.equal(bannerTarget('/jobs/abc'), null);
  assert.equal(bannerTarget('/calendar'), null);
});

test('절대 주소를 경로로 바꾼 뒤 대상을 읽는다', () => {
  assert.deepEqual(bannerTarget(bannerLink('https://www.ogonggo.co.kr/jobs/1').href), {
    targetType: 'JOB',
    targetId: 1,
  });
  assert.equal(bannerTarget(bannerLink('https://example.com/jobs/1').href), null);
});
