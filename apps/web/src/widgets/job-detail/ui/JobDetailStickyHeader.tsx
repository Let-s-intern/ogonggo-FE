'use client';

import { useEffect, useRef, useState } from 'react';
import type { RecruitmentType } from '@/shared/lib/dday';
import { DdayBadge } from '@/shared/ui/DdayBadge';

export interface JobDetailStickyHeaderProps {
  companyName: string;
  title: string;
  recruitmentType: RecruitmentType;
  recruitmentEndAt?: string;
}

/**
 * 상세 PC 스크롤 고정 헤더(`job-detail-pc-sticky-header.png`) — `회사명 · 공고명` 과 D-day.
 *
 * 헤더 카드 바로 아래에 높이 없는 표식을 두고, 그 표식이 화면 위로 지나가면 화면 맨 위에 띠를 붙인다.
 * 맨 위로 올려 헤더 카드가 다시 보이면 사라진다. 사이트 헤더는 고정이 아니라서 띠를 화면 맨 위(`top-0`)에 둔다.
 * 모바일(`md` 미만)은 하단 고정 바(`StickyApplyBar`)가 같은 정보를 이미 보여 띠를 그리지 않는다.
 *
 * 띠의 내용은 보일 때만 그린다. D-day 는 지금 시각으로 계산하므로 서버 렌더에 넣으면 하이드레이션이 어긋날 수 있다.
 */
export function JobDetailStickyHeader({
  companyName,
  title,
  recruitmentType,
  recruitmentEndAt,
}: JobDetailStickyHeaderProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 높이 없는 표식. 부모의 `gap-4` 를 `-mt-4` 로 되돌려 레이아웃을 바꾸지 않는다. */}
      <div ref={markerRef} aria-hidden="true" className="-mt-4 h-0 w-full" />
      {visible ? (
        <div
          data-job-sticky-header
          className="fixed inset-x-0 top-0 z-30 hidden border-b border-gray-200 bg-white md:block"
        >
          <div className="mx-auto flex h-14 max-w-page-padded items-center justify-between gap-4 px-5">
            <p className="min-w-0 truncate text-base font-semibold text-gray-800">
              {companyName} · {title}
            </p>
            <DdayBadge recruitmentType={recruitmentType} recruitmentEndAt={recruitmentEndAt} />
          </div>
        </div>
      ) : null}
    </>
  );
}
