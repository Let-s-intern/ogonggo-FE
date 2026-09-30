'use client';

import { useSyncExternalStore } from 'react';

/**
 * 오공고를 홈 화면에 웹 앱으로 설치했는지, 설치 창을 바로 띄울 수 있는지. 네이티브 앱은 없고
 * `app/manifest.ts` 의 웹 앱(`display: 'standalone'`)을 설치한다.
 *
 * 설치했다고 보는 경우는 둘이다.
 * - 지금 설치된 앱으로 열려 있다(`display-mode: standalone`, iOS 는 `navigator.standalone`).
 * - 이 브라우저에서 설치를 마쳤다(`appinstalled`, 또는 설치 창에서 수락). 브라우저로 다시 들어와도
 *   알 수 있게 `localStorage` 에 남긴다. 저장이 막혔으면 설치 안 한 것으로 본다.
 *
 * 설치 창은 크롬 계열이 `beforeinstallprompt` 로 넘겨준 것만 띄울 수 있다. 이 이벤트는 페이지가 뜨자마자
 * 올 수 있어 컴포넌트가 붙기 전에 놓치지 않도록 모듈이 읽힐 때 듣기 시작한다.
 */
const INSTALLED_KEY = 'ogonggo.appInstalled';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState =
  /** 서버 렌더와 첫 하이드레이션. 아직 모른다. */
  | { kind: 'unknown' }
  | { kind: 'installed' }
  /** 설치 안 함. `canPrompt` 면 설치 창을 바로 띄울 수 있다. */
  | { kind: 'not-installed'; canPrompt: boolean };

let deferredPrompt: BeforeInstallPromptEvent | undefined;
let installedInThisBrowser = false;
const listeners = new Set<() => void>();
let snapshot: InstallState = { kind: 'unknown' };

function readInstalledFlag(): boolean {
  try {
    return window.localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

function markInstalled() {
  installedInThisBrowser = true;
  deferredPrompt = undefined;
  try {
    window.localStorage.setItem(INSTALLED_KEY, '1');
  } catch {
    // 저장이 막혔으면 이번 방문 동안만 설치한 것으로 본다.
  }
  update();
}

function compute(): InstallState {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone || installedInThisBrowser || readInstalledFlag()) {
    return { kind: 'installed' };
  }
  return { kind: 'not-installed', canPrompt: deferredPrompt !== undefined };
}

function update() {
  const next = compute();
  const same =
    next.kind === snapshot.kind &&
    (next.kind !== 'not-installed' ||
      (snapshot.kind === 'not-installed' && next.canPrompt === snapshot.canPrompt));
  if (!same) {
    snapshot = next;
    listeners.forEach((notify) => notify());
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // 브라우저가 스스로 띄우는 설치 막대를 막고, 우리 버튼을 누를 때 띄운다.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    update();
  });
  window.addEventListener('appinstalled', markInstalled);
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  update();
  return () => listeners.delete(notify);
}

const SERVER_SNAPSHOT: InstallState = { kind: 'unknown' };

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

/**
 * 설치 창을 띄운다. 띄울 수 없으면 `false` 를 돌려주고, 부르는 쪽이 설치 방법을 안내한다.
 * 창은 한 번만 쓸 수 있는 이벤트라 쓰고 나면 버린다 — 거절하면 브라우저가 다시 넘겨줄 때까지 안내로 간다.
 */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt;
  if (!event) {
    return false;
  }
  deferredPrompt = undefined;
  update();
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === 'accepted') {
    markInstalled();
  }
  return true;
}
