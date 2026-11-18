/** 링크 카드 미리보기. 서버 경로(`app/link-preview/route.ts`)가 만들고 `shared/ui/LinkPreviewCard.tsx` 가 그린다. */
export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const response = await fetch(`/link-preview?url=${encodeURIComponent(url)}`);
  if (!response.ok) return { url };
  return (await response.json()) as LinkPreview;
}
