'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLinkPreview } from '@/shared/api/linkPreview';

export const LINK_CLASS =
  'break-all text-blue-600 underline underline-offset-2 hover:text-blue-700';
export const LINK_REL = 'noopener noreferrer nofollow ugc';

/**
 * 주소 하나를 오픈그래프 카드로 — 왼쪽에 사이트·제목·설명, 오른쪽에 대표 이미지. 미리보기는 서버가 읽는다
 * (`app/link-preview/route.ts`). 읽는 동안과 제목을 얻지 못했을 때는 평범한 링크로 보인다.
 */
export function LinkPreviewCard({ url }: { url: string }) {
  const { data } = useQuery({
    queryKey: ['link-preview', url],
    queryFn: () => fetchLinkPreview(url),
    staleTime: Infinity,
    retry: false,
  });

  if (!data?.title) {
    return (
      <p>
        <a href={url} target="_blank" rel={LINK_REL} className={LINK_CLASS}>
          {url}
        </a>
      </p>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel={LINK_REL}
      className="flex max-w-xl overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
        {data.siteName ? (
          <span className="truncate text-xs text-gray-400">{data.siteName}</span>
        ) : null}
        <span className="line-clamp-2 text-sm font-semibold text-gray-900">{data.title}</span>
        {data.description ? (
          <span className="line-clamp-2 text-xs text-gray-500">{data.description}</span>
        ) : null}
      </span>
      {data.image ? (
        // 남의 사이트 이미지라 next/image 의 허용 도메인에 넣을 수 없다.
        <img
          src={data.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-auto w-24 shrink-0 bg-gray-100 object-cover sm:w-32"
        />
      ) : null}
    </a>
  );
}
