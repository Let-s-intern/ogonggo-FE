'use client';

import { useEffect, useState } from 'react';
import {
  getMyAccount,
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
} from '@ogonggo/api';
import { isSignedIn } from '@/shared/api/authTokens';
import { BasicInfoSection } from './BasicInfoSection';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; account: MyAccountResponse }
  | { kind: 'error' };

/**
 * `개인 정보`(PRD 6 절). 기본 정보 구역부터 그린다.
 *
 * 계정을 여기서 한 번 더 읽는다. 바깥 껍데기(`views/mypage/ui/MyPageLayout.tsx`) 도 읽지만
 * 그쪽은 사이드바 카드에만 쓰고 본문으로 내려 주지 않는다 — 본문 넷 중 계정이 필요한 것은
 * 이 화면 하나뿐이라, 넷 모두가 지나는 껍데기의 `children` 타입을 계정 때문에 바꾸지 않는다.
 *
 * 로그인 가드도 껍데기가 한다. 여기서는 토큰이 없으면 요청을 보내지 않기만 한다 — 보내 봐야
 * 401 이고, 그 사이 껍데기가 이미 `/login` 으로 보내고 있다.
 */
export function MyProfile() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!isSignedIn()) {
      return;
    }
    let active = true;
    // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다.
    (getMyAccount() as unknown as Promise<SuccessResponseMyAccountResponse>)
      .then((body) => {
        if (!active) {
          return;
        }
        setState(body.data ? { kind: 'ready', account: body.data } : { kind: 'error' });
      })
      .catch(() => {
        if (active) {
          setState({ kind: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const account = state.kind === 'ready' ? state.account : undefined;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-bold text-gray-950">개인 정보</h1>

      {state.kind === 'error' ? (
        <p role="alert" className="text-sm text-error">
          내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      <BasicInfoSection name={account?.profile?.name} email={account?.email} />
    </div>
  );
}
