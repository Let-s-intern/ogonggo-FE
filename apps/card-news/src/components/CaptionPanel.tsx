'use client';

import { useEffect, useId, useState } from 'react';
import { Button, Textarea } from '@ogonggo/ui';

/** 인스타그램 게시물 본문. AI 가 카드 문구와 함께 쓰고, 사람이 고친 뒤 복사해 붙인다. */
export function CaptionPanel({
  caption,
  onChange,
}: {
  caption: string;
  onChange: (caption: string) => void;
}) {
  const id = useId();
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    navigator.clipboard.writeText(caption).then(
      () => setCopied('ok'),
      () => setCopied('fail'),
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-base font-bold">
          인스타 본문
        </label>
        <span className="flex items-center gap-2">
          {copied === 'ok' ? <span className="text-xs text-blue-600">복사했어요</span> : null}
          {copied === 'fail' ? (
            <span className="text-xs text-error">
              복사하지 못했어요. 직접 선택해 복사해 주세요.
            </span>
          ) : null}
          <Button size="sm" onClick={copy} disabled={!caption.trim()}>
            본문 복사
          </Button>
        </span>
      </div>
      <Textarea
        id={id}
        rows={16}
        className="text-sm leading-relaxed"
        value={caption}
        onChange={(event) => onChange(event.target.value)}
        placeholder="AI가 쓴 본문이 여기 들어옵니다. 'AI로 다시 쓰기'로 새로 받을 수 있어요."
      />
    </section>
  );
}
