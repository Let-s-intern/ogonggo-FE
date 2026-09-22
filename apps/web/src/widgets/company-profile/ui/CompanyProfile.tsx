'use client';

import { useEffect, useState } from 'react';
import {
  getMyAccount,
  replaceMyCompanyProfile,
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
} from '@ogonggo/api';
import { isSignedIn } from '@/shared/api/authTokens';
import { toCompanyProfileValues, type CompanyProfileDraft } from '../model/values';
import { CompanyProfileView } from './CompanyProfileView';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; account: MyAccountResponse }
  | { kind: 'error' };

/**
 * `기업/기관 정보`(v5 PRD 5 절) 에서 **값을 읽는 쪽**. 그리는 것은 `CompanyProfileView` 다.
 *
 * 계정을 여기서 한 번 더 읽는다. 바깥 껍데기(`views/mypage/ui/MyPageLayout.tsx`) 도 읽지만
 * 그쪽은 사이드바 카드에만 쓰고 본문으로 내려 주지 않는다 — v4 의 `widgets/my-profile` 과
 * 같은 이유다.
 *
 * 로그인 가드도 껍데기가 한다. 여기서는 토큰이 없으면 요청을 보내지 않기만 한다.
 */
export function CompanyProfile() {
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

  /**
   * 두 칸을 저장하고 **계정을 다시 읽는다.** 응답이 저장된 값을 돌려주지 않아서
   * (`PUT` 의 `data` 가 비어 있다) 서버에 무엇이 들어갔는지는 다시 읽어야만 알 수 있다.
   *
   * 저장이 실패하면 그대로 던진다 — 어느 칸에 무슨 문구를 띄울지는 그리는 쪽이 안다. 반대로
   * 다시 읽기가 실패한 것은 저장 실패가 아니므로 위쪽 배너로만 알린다. 저장은 끝났다고 말해
   * 놓고 화면에 옛 값이 남는 쪽이, 실패했다고 말해 다시 누르게 하는 것보다 낫다.
   */
  const save = async (draft: CompanyProfileDraft): Promise<void> => {
    await replaceMyCompanyProfile(draft);
    try {
      const body = (await getMyAccount()) as unknown as SuccessResponseMyAccountResponse;
      setState(body.data ? { kind: 'ready', account: body.data } : { kind: 'error' });
    } catch {
      setState({ kind: 'error' });
    }
  };

  return (
    <>
      {state.kind === 'error' ? (
        <p role="alert" className="mb-6 text-sm text-error">
          내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
      <CompanyProfileView
        values={state.kind === 'ready' ? toCompanyProfileValues(state.account) : undefined}
        onSave={save}
      />
    </>
  );
}
