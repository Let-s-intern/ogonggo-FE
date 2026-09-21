'use client';

import { useEffect, useState } from 'react';
import {
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
  getMyAccount,
} from '@ogonggo/api';
import { isSignedIn, subscribeTokens } from './authTokens';

export type MyAccountState =
  | { kind: 'signedOut' }
  | { kind: 'loading' }
  | { kind: 'ready'; account: MyAccountResponse }
  | { kind: 'error' };

/**
 * 진행 중이거나 이미 끝난 요청. 헤더와 마이페이지 껍데기가 같은 화면에 함께 있어서, 이것이
 * 없으면 `/mypage` 를 열 때마다 `getMyAccount` 가 두 번 나간다.
 *
 * 값이 아니라 `Promise` 를 캐시한다 — 둘이 같은 프레임에 마운트되면 첫 응답이 오기 전에
 * 두 번째가 시작하므로, 결과를 캐시해서는 늦는다.
 */
let pending: Promise<MyAccountResponse | null> | null = null;

function fetchAccount(): Promise<MyAccountResponse | null> {
  pending ??= (getMyAccount() as unknown as Promise<SuccessResponseMyAccountResponse>)
    .then((body) => body.data ?? null)
    .catch(() => {
      // 다음 마운트에서 다시 시도할 수 있게 실패한 약속은 남기지 않는다. 401 이고 재발급도
      // 실패했으면 `shared/api/reissue.ts` 가 이미 로그인 화면으로 보냈다.
      pending = null;
      throw new Error('getMyAccount failed');
    });
  return pending;
}

/**
 * 로그인한 계정을 읽는다. **`role` 이 필요한 곳의 유일한 출처다** — 로그인 응답에도 토큰
 * 저장소에도 역할이 없고 `getMyAccount` 에만 있다.
 *
 * 토큰이 브라우저 저장소에만 있어 서버는 로그인 여부를 알 수 없다. 그래서 첫 렌더는 언제나
 * `signedOut` 이고, 마운트 뒤에 저장소를 읽어 바뀐다 — 헤더가 `로그인` 으로 그렸다가 바꾸는
 * 것과 같은 순서다(`SiteHeader`).
 */
export function useMyAccount(): MyAccountState {
  const [state, setState] = useState<MyAccountState>({ kind: 'signedOut' });

  useEffect(() => {
    let active = true;

    const read = () => {
      if (!isSignedIn()) {
        setState({ kind: 'signedOut' });
        return;
      }
      setState({ kind: 'loading' });
      fetchAccount()
        .then((account) => {
          if (active) {
            setState(account ? { kind: 'ready', account } : { kind: 'error' });
          }
        })
        .catch(() => {
          if (active) {
            setState({ kind: 'error' });
          }
        });
    };

    read();
    // 로그아웃·로그인으로 계정이 바뀌면 캐시를 버리고 다시 읽는다. 구독은 여기서 건다 —
    // `subscribeTokens` 가 `window` 를 직접 만지므로 모듈 최상위에서 부르면 서버에서 깨진다.
    const unsubscribe = subscribeTokens(() => {
      pending = null;
      read();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}
