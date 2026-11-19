import { httpClient } from '@ogonggo/api';
import type { AdSlot } from './adPosting';
import { advertisementPostingPage, hasNextPostingExposurePage } from './adPostingContract';

const MAX_POSTING_EXPOSURE_PAGES = 100;
const EXPOSURE_PAGE_SIZE = 100;
const POSTINGS_PER_AD_PAGE = 12;
const CONTENT_FETCH_CONCURRENCY = 4;

type PublicPostingExposure = {
  id: number;
  category: 'JOB_POSTING';
  position: string | null;
  targetType: 'JOB' | 'BOOTCAMP';
  targetId: number;
  displayOrder: number;
  adLabel: boolean;
};

type PostingExposurePage = {
  data?: {
    items: PublicPostingExposure[];
    pageInfo: { pageNum: number; totalPages: number };
  };
};

export interface LoadedPostingAd<T> {
  item: T;
  slot: AdSlot;
}

export interface PostingAdPage<T> {
  ads: LoadedPostingAd<T>[];
  totalPages: number;
}

/**
 * Loads paid-posting exposures, assigns them to pages in `displayOrder`, and hydrates only the current page's targets.
 * The configured API page is bounded and content lookups run four at a time. Lookup failures skip only that ad.
 */
export async function fetchJobPostingAdsForPage<T extends { id: number }>(
  targetType: PublicPostingExposure['targetType'],
  page: number,
  existingItems: readonly T[] | Promise<readonly T[]>,
  fetchTarget: (targetId: number) => Promise<T | undefined>,
): Promise<PostingAdPage<T>> {
  const [exposures, resolvedExistingItems] = await Promise.all([
    fetchPostingExposures(),
    existingItems,
  ]);
  if (!exposures) return { ads: [], totalPages: 0 };

  const byTargetId = new Map<number, PublicPostingExposure>();
  for (const exposure of exposures) {
    if (exposure.targetType !== targetType || byTargetId.has(exposure.targetId)) continue;
    byTargetId.set(exposure.targetId, exposure);
  }
  const ordered = [...byTargetId.values()].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id - b.id,
  );
  const pageExposures = advertisementPostingPage(ordered, page, POSTINGS_PER_AD_PAGE);
  const currentItemsById = new Map(resolvedExistingItems.map((item) => [item.id, item]));
  const loadedAds: LoadedPostingAd<T>[] = [];

  for (let start = 0; start < pageExposures.length; start += CONTENT_FETCH_CONCURRENCY) {
    const batch = pageExposures.slice(start, start + CONTENT_FETCH_CONCURRENCY);
    const loaded = await Promise.all(
      batch.map(async (exposure) => {
        const item = currentItemsById.get(exposure.targetId) ??
          (await fetchTarget(exposure.targetId).catch(() => undefined));
        return item ? { item, slot: toAdSlot(exposure) } : undefined;
      }),
    );
    loadedAds.push(...loaded.filter((item): item is LoadedPostingAd<T> => item !== undefined));
  }

  return {
    ads: loadedAds,
    totalPages: Math.ceil(ordered.length / POSTINGS_PER_AD_PAGE),
  };
}

async function fetchPostingExposures(): Promise<PublicPostingExposure[] | undefined> {
  const items: PublicPostingExposure[] = [];
  let page = 1;
  let totalPages = 1;

  try {
    while (page <= totalPages) {
      const response = await httpClient<PostingExposurePage>(
        `/api/v1/advertisement-exposures/postings?page=${page}&size=${EXPOSURE_PAGE_SIZE}`,
      );
      const body = response.data;
      if (!body) return undefined;
      items.push(...body.items);
      totalPages = Math.max(1, body.pageInfo.totalPages);
      if (totalPages > MAX_POSTING_EXPOSURE_PAGES) return undefined;
      if (!hasNextPostingExposurePage(page, totalPages)) break;
      page += 1;
    }
  } catch {
    return undefined;
  }
  return items;
}

function toAdSlot(exposure: PublicPostingExposure): AdSlot {
  return {
    adId: exposure.id,
    placement: exposure.category,
    position: exposure.displayOrder,
    category: exposure.category,
    productPosition: exposure.position,
    adLabel: exposure.adLabel,
  };
}
