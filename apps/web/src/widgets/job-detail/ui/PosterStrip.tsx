'use client';

import { useEffect, useState } from 'react';
import { Button, Modal } from '@ogonggo/ui';
import type { PosterImage } from '../lib/posterImages';

/**
 * 이보다 작은 쪽이 있는 이미지는 포스터가 아니라 원문 사이트의 아이콘·구분선으로 보고 숨긴다. 원문 탭에는
 * 그대로 남는다.
 */
const MIN_POSTER_SIDE = 100;

/** 크기를 재 볼 이미지 수. 원문에 아이콘이 수십 개 섞여도 앞쪽 몇 개만 받는다. */
const MAX_CANDIDATES = 12;

/** 줄에 보이는 포스터 수. */
const MAX_POSTERS = 6;

/**
 * 상세 헤더 카드와 탭 사이의 원본 포스터 줄(LC-3566, PRD `prd-job-filter-improve.md` 결정 4 C). 원문이 글을
 * 옮겨 붙인 것이라 읽기 어렵다는 설문에, 원문 HTML 의 이미지를 탭을 누르지 않아도 보이게 꺼낸다. 기본 탭
 * (`공고 분석`)은 그대로다. 누르면 크게 본다.
 *
 * 이미지는 원문 사이트 주소를 그대로 건다(결정 5, S3 로 옮기지 않는다). 핫링크가 막힌 곳은 불러오지 못하고,
 * 원문에는 아이콘·구분선 이미지도 섞여 있다. 그래서 줄은 숨긴 채(자리도 잡지 않고) 시작하고, 브라우저에서 이미지를
 * 받아 두 변이 모두 100px 이상인 것이 확인되면 그것만 보인다. 서버 HTML 에 줄을 그려 두고 하이드레이션 뒤 숨기면,
 * 포스터가 없는 공고에서 아래 탭이 위로 튄다(CLS). 확인된 이미지는 이미 받아 둔 것이라 줄에 붙은 뒤 크기가
 * 바뀌지 않는다.
 *
 * `next/image` 를 쓰지 않는다. 원문 이미지 호스트는 정해져 있지 않아 `images.remotePatterns` 에 다 적을 수
 * 없다.
 */
export function PosterStrip({ images }: { images: PosterImage[] }) {
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(() => new Set());
  const [opened, setOpened] = useState<PosterImage | undefined>();
  const candidates = images.slice(0, MAX_CANDIDATES);
  const sources = candidates.map((image) => image.src).join('\n');

  useEffect(() => {
    let alive = true;
    const loaders = sources.split('\n').map((src) => {
      const img = new Image();
      img.onload = () => {
        if (alive && img.naturalWidth >= MIN_POSTER_SIDE && img.naturalHeight >= MIN_POSTER_SIDE) {
          setConfirmed((previous) => (previous.has(src) ? previous : new Set(previous).add(src)));
        }
      };
      img.src = src;
      return img;
    });
    return () => {
      alive = false;
      for (const img of loaders) img.onload = null;
    };
  }, [sources]);

  const shown = candidates.filter((image) => confirmed.has(image.src)).slice(0, MAX_POSTERS);
  if (shown.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="job-poster-title" className="flex flex-col gap-3">
      <h2 id="job-poster-title" className="text-base font-bold text-gray-900">
        원본 포스터
      </h2>
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {shown.map((image, index) => (
          <li key={image.src} className="shrink-0">
            <button
              type="button"
              onClick={() => setOpened(image)}
              aria-label={`원본 포스터 ${index + 1} 크게 보기`}
              className="block overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-shadow hover:shadow-md"
            >
              {/* oxlint-disable-next-line no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                className="block h-48 w-auto max-w-[80vw] object-contain md:h-60 md:max-w-md"
              />
            </button>
          </li>
        ))}
      </ul>
      <Modal
        open={opened !== undefined}
        title="원본 포스터"
        onClose={() => setOpened(undefined)}
        className="w-[min(56rem,calc(100vw-2rem))]"
      >
        {opened ? (
          <div className="flex flex-col gap-4">
            {/* oxlint-disable-next-line no-img-element */}
            <img src={opened.src} alt={opened.alt} className="max-h-[70vh] w-full object-contain" />
            <Button
              variant="ghost"
              onClick={() => setOpened(undefined)}
              className="self-end bg-gray-100"
            >
              닫기
            </Button>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
