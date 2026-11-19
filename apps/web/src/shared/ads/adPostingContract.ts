export interface AdReportSlot {
  exposureId: number;
  category: 'JOB_POSTING' | 'BANNER';
  position: string | null;
}

export interface AdPostingClickData {
  event: 'ad_posting_click';
  params: {
    ad_id: number;
    ad_placement: string;
    ad_position: number;
    content_type: 'job' | 'bootcamp';
    content_id: string;
  };
  posthogParams: {
    exposure_id: number;
    category: 'JOB_POSTING' | 'BANNER';
    position: string | null;
  };
}

export function adReportPosthogParams(slot: AdReportSlot): AdPostingClickData['posthogParams'] {
  return {
    exposure_id: slot.exposureId,
    category: slot.category,
    position: slot.position,
  };
}

export function hasNextPostingExposurePage(currentPage: number, totalPages: number): boolean {
  return currentPage < Math.max(1, totalPages);
}

export interface OrderedAdvertisementPosting {
  id: number;
  targetId: number;
  displayOrder: number;
}

/** Sorts paid postings by the configured order and assigns each target to one ad page. */
export function advertisementPostingPage<T extends OrderedAdvertisementPosting>(
  exposures: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const seenTargets = new Set<number>();
  const unique = [...exposures]
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
    .filter((exposure) => {
      if (seenTargets.has(exposure.targetId)) return false;
      seenTargets.add(exposure.targetId);
      return true;
    });
  const start = (page - 1) * pageSize;
  return unique.slice(start, start + pageSize);
}

/** Avoids showing one target twice when its paid slot and organic result share a page. */
export function removeAdvertisementPostingDuplicates<T extends { id: number }>(
  organicItems: readonly T[],
  paidTargetIds: ReadonlySet<number>,
): T[] {
  return organicItems.filter((item) => !paidTargetIds.has(item.id));
}

export function qualifiesAdvertisementImpression(intersectionRatio: number, visibleMs: number): boolean {
  return isAdvertisementViewportVisible(intersectionRatio, true) && visibleMs >= 1000;
}

export function isAdvertisementViewportVisible(
  intersectionRatio: number,
  documentVisible: boolean,
): boolean {
  return documentVisible && intersectionRatio >= 0.5;
}

/** A generic analytics event for a promoted card must not leak its content/campaign fields to PostHog. */
export function safePromotedPosthogProperties(
  params: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (params.is_promoted !== 'Y' && !(typeof params.ad_campaign_id === 'string' && params.ad_campaign_id.length > 0)) {
    return undefined;
  }
  return { is_promoted: 'Y' };
}

export function adPostingClickData(
  slot: AdReportSlot & { displayOrder: number; placement: string },
  contentType: 'job' | 'bootcamp',
  contentId: number,
): AdPostingClickData {
  return {
    event: 'ad_posting_click',
    params: {
      ad_id: slot.exposureId,
      ad_placement: slot.placement,
      ad_position: slot.displayOrder,
      content_type: contentType,
      content_id: String(contentId),
    },
    posthogParams: adReportPosthogParams(slot),
  };
}

/** Allowlist the report properties before an ad event reaches PostHog. */
export function safeAdvertisementPosthogProperties(
  event: string,
  explicit: Record<string, unknown>,
  isSignedIn: boolean,
  jobRoleCodes: readonly string[],
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const key of ['exposure_id', 'category', 'position'] as const) {
    const value = explicit[key];
    if (value !== undefined) properties[key] = value;
  }
  properties.audience_type = !isSignedIn
    ? 'NON_MEMBER'
    : jobRoleCodes.length > 0
      ? 'MEMBER'
      : 'UNSPECIFIED';
  if (event.endsWith('_click')) {
    properties.job_role_codes = isSignedIn ? [...jobRoleCodes] : [];
  }
  return properties;
}
