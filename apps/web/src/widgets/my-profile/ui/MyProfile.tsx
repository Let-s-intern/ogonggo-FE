'use client';

import { useEffect, useState } from 'react';
import {
  getMyAccount,
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
} from '@ogonggo/api';
import { Callout } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { BasicInfoSection } from './BasicInfoSection';
import { CareerInfoSection } from './CareerInfoSection';
import { KakaoChannelBanner } from './KakaoChannelBanner';
import { MarketingSection, PasswordSection, WithdrawAction } from './PreparingSections';

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
  /** 커리어 정보를 저장한 뒤 계정을 다시 읽으려고 올리는 값. */
  const [reloadToken, setReloadToken] = useState(0);

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
  }, [reloadToken]);

  const account = state.kind === 'ready' ? state.account : undefined;
  /**
   * 커리어 정보 구역에 넘길 값. **`account.profile` 을 그대로 넘기면 안 된다** — 그 필드는
   * 선택이라 커리어 정보를 한 번도 넣지 않은 계정에는 아예 없는데, 구역 쪽은 `undefined` 를
   * "아직 안 왔다" 로 읽어 폼을 영영 열지 않는다. 읽기에 성공했으면 값이 비어도 폼을 연다.
   * `views/signup/ui/CareerSignUpPage.tsx` 가 같은 이유로 같은 `?? {}` 를 쓴다.
   */
  const profile = account ? (account.profile ?? {}) : undefined;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-bold text-gray-950">개인 정보</h1>

      {state.kind === 'error' ? (
        <p role="alert" className="text-sm text-error">
          내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      {/* 비활성 칸마다 `title` 로도 같은 말을 달지만, 마우스를 올려야 보인다. 화면에
          드러나는 한 줄이 먼저 있어야 한다 — 지원·신청 내역의 안내 띠와 같은 판단이다. */}
      <Callout
        tone="warning"
        className="flex items-start gap-2 border-transparent bg-orange-50 text-orange-800"
      >
        <span aria-hidden="true" className="icon-[lucide--info] mt-0.5 block h-4 w-4 shrink-0" />
        <span>
          <b className="font-semibold">{PLACEHOLDER_NOTICE}</b> 휴대폰 번호, 정보 수신용 이메일,
          비밀번호 변경, 마케팅 수신 동의, 회원 탈퇴는 아직 고칠 수 없어요. 지금 저장되는 것은
          커리어 정보뿐이에요.
        </span>
      </Callout>

      <BasicInfoSection name={account?.profile?.name} email={account?.email} />

      <CareerInfoSection profile={profile} onSaved={() => setReloadToken((token) => token + 1)} />

      <PasswordSection />
      <KakaoChannelBanner />
      <MarketingSection />
      <WithdrawAction />
    </div>
  );
}
