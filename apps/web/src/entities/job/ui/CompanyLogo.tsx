'use client';

import { useCallback, useId, useSyncExternalStore } from 'react';
import { cn } from '@ogonggo/ui';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { getCompanyLogoUrl } from '../model/company-logo';
import {
  getLogoMeasure,
  getServerLogoMeasure,
  subscribeLogoMeasure,
  type LogoBounds,
} from '../model/logo-bounds';

/**
 * 로고마다 박스를 차지하는 "넓이"를 같게 맞추는 설정. 모두 박스 대비 비율이다.
 *
 * 여백을 뺀 뒤에도 박스에 꽉 맞추기(contain)만 하면 비율이 뭉툭한 로고(LG, 2:1)가 긴 로고(LG CNS,
 * 4:1)보다 훨씬 커 보인다 — 긴 로고는 폭에 먼저 걸려 높이가 얇아지기 때문이다. 넓이를 같게 두면
 * 둘이 비슷한 무게로 보이고, 폭·높이 상한이 너무 긴 로고와 정사각 로고가 박스를 넘지 않게 막는다.
 */
export interface LogoBalance {
  /** 박스의 가로/세로 비율. */
  boxAspect: number;
  /** 로고가 차지할 넓이. */
  area: number;
  maxWidth: number;
  maxHeight: number;
}

export interface CompanyLogoProps {
  companyName: string;
  className?: string;
  /** 없으면 여백을 뺀 로고를 박스(안쪽 여백 제외)에 꽉 맞춘다. */
  balance?: LogoBalance;
}

function balancedSize(bounds: LogoBounds, { boxAspect, area, maxWidth, maxHeight }: LogoBalance) {
  const ratio = bounds.width / bounds.height;
  // 박스 높이를 1로 두면 박스 넓이는 boxAspect, 로고 넓이는 area * boxAspect 이다.
  let height = Math.sqrt((area * boxAspect) / ratio);
  let width = height * ratio;
  const shrink = Math.min(1, (maxWidth * boxAspect) / width, maxHeight / height);
  height *= shrink;
  width *= shrink;
  return { width: `${(width / boxAspect) * 100}%`, height: `${height * 100}%` };
}

/**
 * `getCompanyLogoUrl`이 아는 회사면 실제 로고 이미지, 모르면(또는 로고 서비스가 그 도메인에
 * 이미지를 못 주면) 기본 썸네일(`Thumbnail`) — 확신 없는 도메인을 지어내지 않는다
 * (`company-logo.ts` 참고). 로드 실패는 깨진 이미지 아이콘 대신 항상 같은 기본 이미지로 떨어진다.
 *
 * 로고는 구글 이미지 캐시 썸네일이라 이미지마다 안쪽 여백이 제각각이다(캔버스의 8%만 로고인
 * 것부터 여백이 없는 것까지). 그대로 넣으면 같은 박스에서도 로고 크기가 들쭉날쭉해서, 브라우저에서
 * 여백을 잰 뒤(`logo-bounds.ts`) 그 범위만 SVG `viewBox`로 잘라 그린다. `preserveAspectRatio`
 * 기본값(`xMidYMid meet`)이 `object-contain`과 같은 맞춤이라 글자가 잘리지 않는다 — `object-cover`로
 * SK 로고 글자가 잘렸던 일이 있다. `viewBox` 바깥 픽셀이 레터박스 자리에 비치지 않게 같은 범위로
 * `clipPath`를 건다.
 *
 * 재는 동안에는 빈 박스만 둔다. 원본 크기로 그렸다가 바꾸면 로고가 한 번 튄다.
 */
export function CompanyLogo({ companyName, className, balance }: CompanyLogoProps) {
  const logoUrl = getCompanyLogoUrl(companyName);
  const clipId = useId();
  const subscribe = useCallback(
    (notify: () => void) => (logoUrl ? subscribeLogoMeasure(logoUrl, notify) : () => {}),
    [logoUrl],
  );
  const measure = useSyncExternalStore(
    subscribe,
    () => (logoUrl ? getLogoMeasure(logoUrl) : getServerLogoMeasure()),
    getServerLogoMeasure,
  );

  if (!logoUrl || measure.status === 'error') {
    return <Thumbnail alt="" className={cn('shrink-0 rounded-md shadow-sm', className)} />;
  }

  const boxClass = cn(
    'flex shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm',
    className,
  );
  if (measure.status === 'pending') {
    return <div role="presentation" className={boxClass} />;
  }

  const { bounds, naturalWidth, naturalHeight } = measure;
  return (
    <div className={boxClass}>
      <svg
        role="img"
        aria-label={`${companyName} 로고`}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
        className={balance ? undefined : 'h-full w-full'}
        style={balance ? balancedSize(bounds, balance) : undefined}
      >
        <clipPath id={clipId}>
          <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} />
        </clipPath>
        <image
          href={logoUrl}
          width={naturalWidth}
          height={naturalHeight}
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </div>
  );
}
