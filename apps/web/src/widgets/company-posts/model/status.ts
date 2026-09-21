import type {
  CompanyJobSummaryResponsePublicationStatus,
  CompanyJobSummaryResponseReviewStatus,
} from '@ogonggo/api';

/**
 * 기업용 목록 응답에만 있는 상태 둘(v5 PRD 2 절). **목업에 없는 열이지만 없으면 기업이 자기
 * 공고가 왜 안 보이는지 알 수 없다** — 게시를 눌렀는데 목록에 안 뜨는 이유가 검수 대기인지
 * 반려인지 숨김인지 화면이 말하지 않으면 물어볼 곳이 없다.
 *
 * `reviewStatus` 는 운영자 검수다. 승인되어야 게시되고, 내용을 고치면 다시 대기가 된다.
 * `publicationStatus` 는 노출 여부다. 둘은 다른 값이고 함께 봐야 뜻이 선다.
 */
export const REVIEW_STATUS_LABELS: Record<CompanyJobSummaryResponseReviewStatus, string> = {
  PENDING: '검수 대기',
  APPROVED: '승인',
  REJECTED: '반려',
};

/** 반려만 빨강이다. 검수 대기는 잘못된 상태가 아니라 기다리는 상태다. */
export const REVIEW_STATUS_TONES: Record<
  CompanyJobSummaryResponseReviewStatus,
  'neutral' | 'success' | 'danger'
> = {
  PENDING: 'neutral',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export const PUBLICATION_STATUS_LABELS: Record<CompanyJobSummaryResponsePublicationStatus, string> =
  {
    DRAFT: '초안',
    PUBLISHED: '게시',
    HIDDEN: '숨김',
    ARCHIVED: '보관',
  };

/** 지금 노출되고 있는 것만 파랑이다. 나머지 셋은 "안 보이는 상태" 라 한 색으로 묶는다. */
export const PUBLICATION_STATUS_TONES: Record<
  CompanyJobSummaryResponsePublicationStatus,
  'neutral' | 'main'
> = {
  DRAFT: 'neutral',
  PUBLISHED: 'main',
  HIDDEN: 'neutral',
  ARCHIVED: 'neutral',
};
