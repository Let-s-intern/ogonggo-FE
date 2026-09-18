'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  type MyProfileResponse,
  type SuccessResponseMyAccountResponse,
  getMyAccount,
} from '@ogonggo/api';
import { CareerInfoForm } from '@/features/sign-up';
import { isSignedIn } from '@/shared/api/authTokens';
import { takeReturnPath } from '@/shared/lib/returnPath';
import { SignUpLayout } from './SignUpLayout';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; profile: MyProfileResponse }
  | { kind: 'error' };

/** 로그인하지 않았을 때 보낼 곳. 로그인하면 이 화면으로 돌아온다. */
const SIGN_IN_PATH = '/login?redirect=/signup/career';

/**
 * 커리어 정보 화면(`회원가입 유저 정보.png`). 첫 교환으로 오공고 계정이 막 생긴 일반 회원이 온다
 * (`shared/api/letsCareerSignIn.ts` 의 `pathAfterLetsCareerSignIn`).
 *
 * 일반 회원만 쓴다. 토큰이 없으면 로그인 화면으로, 기업·관리자 계정이면 홈으로 보낸다 — 커리어 정보는 일반 회원의
 * `profile` 이고 기업 계정에는 없다. 역할은 토큰에 없어 `getMyAccount` 의 `role` 로 본다. 토큰이 브라우저
 * 저장소에만 있어 서버에서는 알 수 없으므로 첫 렌더 뒤에 본다.
 *
 * 지금 저장된 값을 읽어 폼을 채운다. 읽지 못하면 폼을 열지 않는다 — 빈 폼으로 저장하면 렛츠커리어에서 복사해 온
 * 값을 지운다.
 */
export function CareerSignUpPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace(SIGN_IN_PATH);
      return;
    }
    let active = true;
    // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다. 로그인과 같다.
    (getMyAccount() as unknown as Promise<SuccessResponseMyAccountResponse>)
      .then((body) => {
        if (!active) {
          return;
        }
        if (body.data?.role !== 'USER') {
          router.replace('/');
          return;
        }
        setState({ kind: 'ready', profile: body.data.profile ?? {} });
      })
      .catch(() => {
        // 401 이고 재발급도 실패했으면 `shared/api/reissue.ts` 가 이미 로그인 화면으로 보냈다.
        if (active) {
          setState({ kind: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <SignUpLayout audience="user" eyebrow="정보입력" title="커리어 정보를 입력해 주세요. (선택)">
      {state.kind === 'ready' ? <CareerInfoForm initialProfile={state.profile} /> : null}
      {state.kind === 'loading' ? (
        <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : null}
      {state.kind === 'error' ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <p role="alert" className="text-sm text-error">
            내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={() => router.replace(takeReturnPath() ?? '/')}
            className="py-2 text-base text-gray-500 hover:text-gray-700"
          >
            다음에 하기
          </button>
        </div>
      ) : null}
    </SignUpLayout>
  );
}
