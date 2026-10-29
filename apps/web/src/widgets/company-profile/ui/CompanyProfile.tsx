'use client';

import { useEffect, useState } from 'react';
import {
  getMyAccount,
  replaceMyCompanyBasicInfo,
  replaceMyCompanyManagerInfo,
  type MyAccountResponse,
  type ReplaceMyCompanyBasicInfoRequestCompanyType,
  type ReplaceMyCompanyBasicInfoRequestEmployeeCountRange,
  type ReplaceMyCompanyManagerInfoRequestManagerDuty,
  type SuccessResponseMyAccountResponse,
} from '@ogonggo/api';
import { normalizeHomepage } from '@/features/sign-up';
import { isSignedIn } from '@/shared/api/authTokens';
import {
  toCompanyProfileValues,
  type CompanyBasicInfoDraft,
  type CompanyManagerInfoDraft,
} from '../model/values';
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
   * 저장 뒤 계정을 다시 읽는다. 응답이 저장된 값을 돌려주지 않아서(`PUT` 의 `data` 가 비어
   * 있다) 서버에 무엇이 들어갔는지는 다시 읽어야만 알 수 있다.
   *
   * 다시 읽기가 실패한 것은 저장 실패가 아니므로 위쪽 배너로만 알린다. 저장은 끝났다고 말해
   * 놓고 화면에 옛 값이 남는 쪽이, 실패했다고 말해 다시 누르게 하는 것보다 낫다.
   */
  const reload = async (): Promise<void> => {
    try {
      const body = (await getMyAccount()) as unknown as SuccessResponseMyAccountResponse;
      setState(body.data ? { kind: 'ready', account: body.data } : { kind: 'error' });
    } catch {
      setState({ kind: 'error' });
    }
  };

  /**
   * 기본 정보(기관명·로고)를 저장한다. 수정 API 가 기본 정보와 담당자 정보로 나뉘어
   * (ogonggo-BE LC-3396) 저장 버튼도 각자 자기 구역만 보낸다. 실패하면 그대로 던진다 — 어느
   * 칸에 무슨 문구를 띄울지는 그리는 쪽이 안다.
   */
  const saveBasicInfo = async (draft: CompanyBasicInfoDraft): Promise<void> => {
    const digits = draft.businessNumber.replace(/\D/g, '');
    await replaceMyCompanyBasicInfo({
      organizationName: draft.organizationName,
      logoImageId: draft.logoImageId || undefined,
      // 아래 기업 정보는 빼면 서버가 저장된 값을 그대로 둔다(LC-3530). 빈 칸은 보내지 않는다.
      businessNumberType: draft.overseas
        ? 'OVERSEAS'
        : digits
          ? draft.businessNumberType
          : undefined,
      businessNumber: draft.overseas ? undefined : digits || undefined,
      companyType: (draft.companyType || undefined) as
        | ReplaceMyCompanyBasicInfoRequestCompanyType
        | undefined,
      employeeCountRange: (draft.employeeCountRange || undefined) as
        | ReplaceMyCompanyBasicInfoRequestEmployeeCountRange
        | undefined,
      industry: draft.industry.trim() || undefined,
      address: draft.address.trim() || undefined,
      homepageUrl: normalizeHomepage(draft.homepageUrl) || undefined,
    });
    await reload();
  };

  /**
   * 담당자 정보를 저장한다. 이름·연락처·수신용 이메일은 한 번에 교체되고, 직책·담당 업무·추천인은 보낸 값만
   * 바뀐다(LC-3530).
   */
  const saveManagerInfo = async (draft: CompanyManagerInfoDraft): Promise<void> => {
    await replaceMyCompanyManagerInfo({
      managerName: draft.managerName,
      managerPhone: draft.managerPhone || undefined,
      notificationEmail: draft.notificationEmail || undefined,
      managerTitle: draft.managerTitle.trim() || undefined,
      managerDuty: (draft.managerDuty || undefined) as
        | ReplaceMyCompanyManagerInfoRequestManagerDuty
        | undefined,
      recommender: draft.recommender.trim() || undefined,
    });
    await reload();
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
        onSaveBasicInfo={saveBasicInfo}
        onSaveManagerInfo={saveManagerInfo}
      />
    </>
  );
}
