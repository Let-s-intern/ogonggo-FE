import { useId } from 'react';
import type { SVGProps } from 'react';

/**
 * 렛츠커리어 잎 모양 마크. 원본은 `docs/asset/v3-1/icon/렛츠커리어.svg`(26x26)다.
 *
 * `Logo.tsx`(오공고 심볼)와 한 쌍이다. 헤더에서 이 마크 · 세로 구분선 · 오공고 로고 셋이
 * 하나의 로고 잠금을 이루고, 링크 이름은 `SiteHeader`의 `aria-label`이 붙인다. 그래서 이
 * 마크는 `aria-hidden`이다.
 *
 * `Logo`와 달리 색을 `currentColor`로 바꾸지 않는다. 세로 그라데이션(`#E5E7EB` → `#D1D5DB`)이
 * 에셋에 박혀 있고 한 색으로 줄이면 그 그라데이션이 사라진다.
 *
 * 그라데이션 `id`는 `useId`로 나눈다. 지금은 화면에 하나뿐이지만 `id`는 문서에서 유일해야
 * 하고, 값이 박혀 있으면 마크가 둘 이상 그려지는 순간 조용히 깨진다.
 */
export function LetsCareerMark(props: SVGProps<SVGSVGElement>) {
  const gradientId = `letscareer-mark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg viewBox="0 0 26 26" fill="none" aria-hidden="true" {...props}>
      <path
        d="M24.7491 24.1713C22.9553 25.1775 19.6756 23.1201 16.5019 19.3128C17.507 22.3852 17.4713 24.8368 16.1925 25.5541C14.7511 26.3627 12.1354 24.7406 9.62182 21.7291C10.0145 23.645 9.72617 25.1954 8.70208 25.7699C7.00265 26.7232 3.92058 24.6277 1.81808 21.0895C-0.284421 17.5514 -0.611173 13.9103 1.08826 12.957C2.11232 12.3826 3.63844 12.9152 5.14974 14.2034C3.72217 10.5826 3.58414 7.57055 5.02558 6.76199C6.30439 6.04464 8.50751 7.24049 10.7436 9.6224C8.9369 5.0485 8.74288 1.26021 10.5366 0.254008C12.9644 -1.10783 18.1141 3.14224 22.0387 9.74682C25.9634 16.3514 27.1769 22.8095 24.7491 24.1713Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="13"
          y1="0"
          x2="13"
          y2="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E5E7EB" />
          <stop offset="1" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>
    </svg>
  );
}
