'use client';

import { useEffect, useState } from 'react';
import { BizApplyLink } from './BizApplyLink';

/**
 * 오른쪽 아래에 붙어 다니는 신청 버튼(시안 `.float`). 신청 구역으로 내려간다.
 *
 * 기존 랜딩처럼 첫 화면부터 보이되, 신청 구역이 화면에 들어오면 숨긴다. 폼 위에 떠 있으면
 * 제출 버튼과 입력칸을 가린다.
 */
export function BizFloatingApply() {
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('apply');
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setFormVisible(entries.some((entry) => entry.isIntersecting)),
      {
        threshold: 0.1,
      },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <BizApplyLink
      placement="floating"
      aria-hidden={formVisible}
      tabIndex={formVisible ? -1 : undefined}
      className={`fixed right-5 bottom-5 z-20 inline-flex h-14 items-center rounded-full bg-blue-500 px-[26px] text-base font-bold text-white shadow-[0_12px_24px_-8px_rgba(74,118,255,0.5)] transition-opacity hover:bg-blue-600 md:right-8 md:bottom-8 ${
        formVisible ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      무료 홍보 신청하기
    </BizApplyLink>
  );
}
