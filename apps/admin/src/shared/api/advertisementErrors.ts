import { HttpError } from '@ogonggo/api';
import { serverErrorMessage } from './authErrorMessages';

/**
 * 광고 상품·노출·계약 API 의 오류 코드별 화면 문구(BE `AdvertisementProductErrorCode`·`AdvertisementExposureErrorCode`·
 * `AdvertisementContractErrorCode`, 계정 발급 `BUSINESS_ACCOUNT_*`). 서버 문구는 개발자에게 하는 말이라 운영자가 무엇을 고칠지로 바꾼다.
 */
const MESSAGES: Record<string, string> = {
  ADVERTISEMENT_PRODUCT_POSITION_MISMATCH: '노출 자리를 고른 상품은 카테고리가 배너여야 해요.',
  ADVERTISEMENT_PRODUCT_NOT_FOUND: '광고 상품을 찾을 수 없어요. 이미 지운 상품일 수 있어요.',
  ADVERTISEMENT_PRODUCT_NOT_EXPOSABLE: '이 상품은 오공고 화면에 노출하지 않는 상품이에요.',
  ADVERTISEMENT_BANNER_CONTENT_REQUIRED: '배너 이름, 이미지, 링크를 모두 채워 주세요.',
  ADVERTISEMENT_EXPOSURE_PERIOD_INVALID:
    '노출 기간은 시작과 끝을 함께 넣거나 둘 다 비워 주세요. 시작이 끝보다 앞서야 해요.',
  ADVERTISEMENT_EXPOSURE_NOT_FOUND: '배너를 찾을 수 없어요. 다른 사람이 지웠을 수 있어요.',
  ADVERTISEMENT_CONTRACT_NOT_FOUND: '광고 계약을 찾을 수 없어요.',
  ADVERTISEMENT_CONTRACT_PRODUCT_NOT_FOUND:
    '계약에 붙인 상품을 찾을 수 없어요. 이미 뺐을 수 있어요.',
  ADVERTISEMENT_CONTRACT_FOLLOWS_REVIEW:
    '비즈니스 공고 계약은 공고 검수 결과를 따라가서 상태를 바꿀 수 없어요.',
  BUSINESS_ACCOUNT_NOT_ISSUABLE:
    '이미 회원이 붙은 신청이거나 비즈니스 공고 계약이라 계정을 발급할 수 없어요.',
  BUSINESS_ACCOUNT_MEMBER_NOT_ACTIVE:
    '이 이메일의 비즈니스 회원이 정지되었거나 탈퇴했어요. 회원 관리에서 상태를 확인해 주세요.',
};

function errorCode(error: unknown): string | undefined {
  if (!(error instanceof HttpError)) return undefined;
  try {
    const parsed: unknown = JSON.parse(error.body);
    if (parsed && typeof parsed === 'object' && 'code' in parsed) {
      return typeof parsed.code === 'string' ? parsed.code : undefined;
    }
  } catch {
    // JSON 이 아닌 본문이다.
  }
  return undefined;
}

/** 아는 코드면 화면 문구, 아니면 서버 문구, 그것도 없으면 `fallback`. */
export function advertisementErrorMessage(error: unknown, fallback: string): string {
  const code = errorCode(error);
  return (code && MESSAGES[code]) ?? serverErrorMessage(error) ?? fallback;
}
