'use client';

import { useState } from 'react';
import { cn } from '@ogonggo/ui';
import { Logo } from './Logo';

export interface ThumbnailProps {
  /** 없으면 오공고 로고 폴백을 그린다. */
  src?: string;
  alt: string;
  className?: string;
}

/**
 * 이미지가 없거나 로드에 실패했을 때 그리는 자리. 흰 배경 가운데에 오공고 로고를 둔다
 * (`Logo.tsx`, 가로형 `ogg` 마크). 회색 빈 박스를 쓰지 않는 이유는 그대로다 — 빈 박스는
 * "이미지를 못 불러왔다"와 "원래 없다"를 구분해 주지 않는다.
 *
 * **이미지 한 장으로 채우지 않는다.** 폴백이 보이는 자리마다 박스 비율이 다르다 — 공고
 * 썸네일은 8:5, 작성자 프로필은 1:1, 상세 헤더는 64px 정사각이다. 한 장을 늘리면 어느
 * 한쪽에서 반드시 찌그러진다. 로고를 가운데 두고 크기를 박스 폭에 묶으면 비율과 무관하다.
 *
 * 로고 폭은 박스 폭의 절반이되 24~96px 로 자른다(PRD 7 절). 실측으로 정한 값이다 — 원본
 * 크기(52x25) 로 고정하면 48px 짜리 작성자 썸네일을 넘치고, 비율만 두고 최대치를 빼면 268px
 * 카드에서 로고가 박스를 가로지른다. 지금 값으로 8:5 카드 96px, 상세 헤더 32px, 작성자
 * 썸네일 24px 이 나온다.
 */
function ThumbnailFallback({ className }: { className?: string }) {
  return (
    <div role="presentation" className={cn('flex items-center justify-center bg-white', className)}>
      <Logo className="w-1/2 max-w-24 min-w-6 text-blue-500" />
    </div>
  );
}

/**
 * 썸네일 이미지 한 장. `src`가 없거나 로드에 실패하면 오공고 로고 폴백으로 떨어진다.
 *
 * 채용공고·부트캠프·사이드·스터디가 각자 빈 박스를 그리던 것을 하나로 모은 것이다.
 * `next/image`를 쓰지 않는 이유는 기존 `CompanyLogo`와 같다 — 외부 호스트(새싹 등) 이미지가
 * 섞여 있어 도메인을 미리 등록해야 하고, 목데이터 단계에서 그 목록이 계속 바뀐다.
 *
 * 로드 실패를 `useState`로 한 번만 잡는다. 폴백은 이미지가 아니라 인라인 SVG라 그 자체가 다시
 * 실패할 일이 없다.
 */
export function Thumbnail({ src, alt, className }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <ThumbnailFallback className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
