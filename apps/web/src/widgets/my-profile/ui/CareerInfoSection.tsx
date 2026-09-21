'use client';

import { useState } from 'react';
import type { MyProfileResponse } from '@ogonggo/api';
import { CareerInfoForm } from '@/features/sign-up';

export interface CareerInfoSectionProps {
  /**
   * 지금 저장된 커리어 정보. **값을 아직 못 읽었으면 `undefined` 이고, 그동안 폼을 열지
   * 않는다** — 이 구역의 전부다. `replaceMyProfile` 은 보내지 않은 값을 비우므로, 빈 폼을
   * 먼저 보여 주면 사용자가 한 칸만 고쳐 저장했을 때 나머지 일곱이 지워진다. 렛츠커리어에서
   * 복사해 온 값이 그렇게 사라진다.
   *
   * `/signup/career`(`views/signup/ui/CareerSignUpPage.tsx`) 가 같은 이유로 같은 일을 한다.
   */
  profile?: MyProfileResponse;
  /** 저장이 끝난 뒤 계정을 다시 읽는다. 다음 저장도 방금 저장한 값에서 출발해야 한다. */
  onSaved: () => void;
}

/**
 * 커리어 정보 구역(PRD 6 절). `/signup/career` 의 폼을 그대로 쓴다 — 고치는 값이 같은
 * 여덟이고 전량 교체라는 제약도 같다.
 *
 * 목업(`개인정보/image.png`) 에는 이 구역이 없다. 목업이 그린 칸 중 저장할 곳이 있는 것은
 * 사실상 이 여덟뿐이라(나머지는 2.3 의 비활성 일곱) PRD 가 이 구역을 더했다.
 */
export function CareerInfoSection({ profile, onSaved }: CareerInfoSectionProps) {
  const [saved, setSaved] = useState(false);

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-gray-950">커리어 정보</h2>

      {profile ? (
        <>
          {saved ? (
            <p role="status" className="text-sm text-blue-600">
              커리어 정보를 저장했어요.
            </p>
          ) : null}
          <CareerInfoForm
            /* 저장 뒤 다시 읽은 값으로 폼을 처음부터 세운다. `initialProfile` 은 첫 렌더에만
               읽히는 초기값이라, 키를 바꾸지 않으면 저장 전 값이 그대로 남는다. */
            key={JSON.stringify(profile)}
            initialProfile={profile}
            heading="학력"
            submitLabel="커리어 정보 저장하기"
            showSkip={false}
            onSaved={() => {
              setSaved(true);
              onSaved();
            }}
          />
        </>
      ) : (
        <p className="text-sm text-gray-400">불러오는 중입니다.</p>
      )}
    </section>
  );
}
