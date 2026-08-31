'use client';

import { useState } from 'react';
import { cn } from '@ogonggo/ui';
import { getCompanyLogoUrl } from '../model/company-logo';

export interface CompanyLogoProps {
  companyName: string;
  className?: string;
}

/**
 * `getCompanyLogoUrl`이 아는 회사면 실제 로고 이미지, 모르면(또는 로고 서비스가 그 도메인에
 * 이미지를 못 주면) 기존 회색 placeholder 박스 — 확신 없는 도메인을 지어내지 않는다
 * (`company-logo.ts` 참고). 로드 실패를 `useState`로 잡아 깨진 이미지 아이콘 대신 항상 같은
 * 회색 박스로 떨어지게 한다.
 *
 * `object-contain`을 쓴다 — `object-cover`로 바꿔봤다가(로고 마크가 이미지 안에서 한쪽으로
 * 치우친 경우가 많아 가운데 정렬처럼 보이게 하려던 시도) SK 로고 등에서 실제로 글자가 잘려
 * 나가는 게 스크린샷으로 확인돼 되돌렸다 — 일부가 안 보이는 크롭 사고가 살짝 비대칭인 여백보다
 * 나쁘다. 정식 로고 API가 아니라 구글 이미지 캐시 썸네일이라 로고가 박스 안에서 완벽하게
 * 가운데로 안 보이는 경우가 남아 있을 수 있다 — 그건 이 데이터 소스의 한계다.
 */
export function CompanyLogo({ companyName, className }: CompanyLogoProps) {
  const logoUrl = getCompanyLogoUrl(companyName);
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <div
        className={cn('shrink-0 rounded-md bg-gray-200 shadow-sm', className)}
        aria-hidden="true"
      />
    );
  }
  return (
    <img
      src={logoUrl}
      alt={`${companyName} 로고`}
      className={cn('shrink-0 rounded-md bg-white object-contain p-1 shadow-sm', className)}
      onError={() => setFailed(true)}
    />
  );
}
