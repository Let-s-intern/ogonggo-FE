export {
  AD_AVAILABILITY_QUERY_KEY,
  MY_AD_COUPONS_QUERY_KEY,
  fetchAdAvailability,
  confirmCompanyEmailCode,
  createAdApplication,
  fetchMyAdCoupons,
  sendCompanyEmailCode,
} from './api/advertisementApi';
export {
  AD_PAGE_LABELS,
  AD_PAGE_ORDER,
  AD_UNIT_LABELS,
  adApplyHref,
  formatPeriod,
  formatShortDate,
  formatWon,
  placementChips,
} from './model/labels';
export type {
  AdCoupon,
  AdJobField,
  AdPlacement,
  AdPlacementAvailabilityResponse,
  AdPlacementKey,
  AdPlacementPage,
  AdPlacementPeriodAvailability,
  AdTargetType,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';
