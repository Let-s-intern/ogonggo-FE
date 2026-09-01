'use client';

import { useState } from 'react';
import { cn } from '@ogonggo/ui';

/**
 * 이미지가 없거나 로드에 실패했을 때 쓰는 기본 썸네일. `apps/web/public/`에 있다.
 * 회색 빈 박스 대신 이걸 쓴다 — 빈 박스는 "이미지를 못 불러왔다"와 "원래 없다"를 구분해 주지
 * 않는다.
 */
export const DEFAULT_THUMBNAIL_URL = '/default-thumbnail.jpg';

export interface ThumbnailProps {
  /** 없으면 기본 이미지를 쓴다. */
  src?: string;
  alt: string;
  className?: string;
}

/**
 * 썸네일 이미지 한 장. `src`가 없거나 로드에 실패하면 기본 이미지로 떨어진다.
 *
 * 채용공고·부트캠프·사이드·스터디가 각자 빈 박스를 그리던 것을 하나로 모은 것이다.
 * `next/image`를 쓰지 않는 이유는 기존 `CompanyLogo`와 같다 — 외부 호스트(새싹 등) 이미지가
 * 섞여 있어 도메인을 미리 등록해야 하고, 목데이터 단계에서 그 목록이 계속 바뀐다.
 *
 * 로드 실패를 `useState`로 한 번만 잡는다. 기본 이미지 자체가 실패해도 다시 갈아끼우지 않아
 * `onError`가 무한히 돌지 않는다.
 */
export function Thumbnail({ src, alt, className }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const usingFallback = !src || failed;

  return (
    <img
      src={usingFallback ? DEFAULT_THUMBNAIL_URL : src}
      alt={alt}
      className={cn('object-cover', className)}
      onError={usingFallback ? undefined : () => setFailed(true)}
    />
  );
}
