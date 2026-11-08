'use client';

import { useState } from 'react';
import { INQUIRY_TEMPLATE } from './content';

export function CopyInquiryButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(INQUIRY_TEMPLATE);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
    >
      {state === 'copied'
        ? '복사했어요'
        : state === 'failed'
          ? '복사하지 못했어요'
          : '문의 문구 복사'}
    </button>
  );
}
